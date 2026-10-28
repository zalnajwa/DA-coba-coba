'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../lib/prisma'
import { createSaleJournal, createPurchaseJournal, createExpenseJournal, createSeblakSaleJournal } from '../lib/accounting'
import { serializeDecimal } from '../lib/serialize'

export async function getTransactions(filter?: {
  businessLineId?: number
  type?: string
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
}) {
  const { businessLineId, type, startDate, endDate, limit = 50, page = 1 } = filter || {}
  const where: any = {}

  if (businessLineId) where.businessLineId = Number(businessLineId)
  if (type) where.type = type
  if (startDate && endDate) where.date = { gte: new Date(startDate), lte: new Date(endDate) }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      businessLine: true,
      transactionLines: {
        include: { account: true },
      },
    },
  })
  const serialized = serializeDecimal(transactions)
  return serialized.map((t: any) => {
    let amountDebit = 0
    let amountCredit = 0
    if (t.transactionLines) {
      for (const line of t.transactionLines) {
        amountDebit += Number(line.debit || 0)
        amountCredit += Number(line.credit || 0)
      }
    }
    return {
      ...t,
      amountDebit,
      amountCredit,
    }
  })
}

export async function getTransactionById(id: number) {
  const trx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      businessLine: true,
      transactionLines: { include: { account: true } },
      inventoryMovements: true,
      wasteLogs: true,
      payables: true,
    },
  })
  return serializeDecimal(trx)
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // Ignore when executed outside Next.js request context (e.g., test scripts, CLI, bots)
  }
}

export async function createSale(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  
  // Format items from JSON or form fields
  let items = []
  if (rawData.items) {
    try {
      items = JSON.parse(rawData.items as string)
    } catch {
      items = []
    }
  } else if (rawData.productId && rawData.quantity) {
    items = [{
      productId: Number(rawData.productId),
      quantity: Number(rawData.quantity),
      price: Number(rawData.price || 0),
    }]
  }

  // Resolve business line: can be numeric id or string name
  let businessLineId = rawData.businessLineId ? Number(rawData.businessLineId) : undefined
  if (!businessLineId && rawData.businessLine) {
    const blStr = String(rawData.businessLine)
    const foundBL = await prisma.businessLine.findFirst({
      where: {
        OR: [
          { name: { contains: blStr } },
          { code: { contains: blStr.toUpperCase() } },
        ],
      },
    })
    if (foundBL) businessLineId = foundBL.id
  }
  if (!businessLineId || isNaN(businessLineId)) businessLineId = 1 // default to Warkop

  const amount = rawData.amount ? Number(rawData.amount) : undefined
  const pMethod = String(rawData.paymentMethod || 'CASH').toUpperCase()
  const paymentMethod = (pMethod === 'TRANSFER' || pMethod === 'BANK' || pMethod === 'QRIS') ? 'BANK' : 'CASH'

  await createSaleJournal({
    businessLineId,
    items,
    paymentMethod,
    discountId: rawData.discountId ? Number(rawData.discountId) : undefined,
    ...((amount !== undefined && items.length === 0) ? { amount } : {}),
    ...(rawData.description ? { description: String(rawData.description) } : {}),
  } as any, 'WEB')

  safeRevalidate('/')
  safeRevalidate('/transaksi')
}

export async function createSeblakSale(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  
  let toppings = []
  if (rawData.toppings) {
    try {
      toppings = JSON.parse(rawData.toppings as string)
    } catch {
      toppings = []
    }
  }

  const pMethod = String(rawData.paymentMethod || 'CASH').toUpperCase()
  const paymentMethod = (pMethod === 'TRANSFER' || pMethod === 'BANK' || pMethod === 'QRIS') ? 'BANK' : 'CASH'

  await createSeblakSaleJournal({
    toppings,
    totalPrice: Number(rawData.totalPrice || 0),
    paymentMethod,
  }, 'WEB')

  safeRevalidate('/')
  safeRevalidate('/transaksi')
  safeRevalidate('/seblak')
}

export async function createPurchase(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())

  let items = []
  if (rawData.items) {
    try {
      items = JSON.parse(rawData.items as string)
    } catch {
      items = []
    }
  } else if (rawData.itemName) {
    items = [{
      name: String(rawData.itemName),
      quantity: Number(rawData.quantity || 1),
      unit: String(rawData.unit || 'unit'),
      price: Number(rawData.price || 0),
    }]
  } else if (rawData.description && rawData.amount) {
    items = [{
      name: String(rawData.description),
      quantity: Number(rawData.quantity || 1),
      unit: String(rawData.unit || 'paket'),
      price: Number(rawData.amount),
    }]
  }

  // Resolve business line if string name was passed
  let businessLineId = rawData.businessLineId ? Number(rawData.businessLineId) : undefined
  if (!businessLineId && rawData.businessLine) {
    const bl = await prisma.businessLine.findFirst({
      where: {
        OR: [
          { name: { contains: String(rawData.businessLine) } },
          { code: { contains: String(rawData.businessLine).toUpperCase() } },
        ],
      },
    })
    if (bl) businessLineId = bl.id
  }

  const pMethod = String(rawData.paymentMethod || 'CASH').toUpperCase()
  const isCredit = rawData.isCredit === 'true' || rawData.isCredit === 'on' || pMethod === 'KREDIT' || pMethod === 'UTANG'
  const paymentMethod = (pMethod === 'TRANSFER' || pMethod === 'BANK' || pMethod === 'QRIS') ? 'BANK' : 'CASH'

  await createPurchaseJournal({
    category: (rawData.category as any) || 'INVENTORY',
    businessLineId,
    items,
    paymentMethod,
    isCredit,
    supplierName: rawData.supplierName ? String(rawData.supplierName) : undefined,
    ...(rawData.amount ? { amount: Number(rawData.amount) } : {}),
    ...(rawData.description ? { description: String(rawData.description) } : {}),
  } as any, 'WEB')

  safeRevalidate('/')
  safeRevalidate('/transaksi')
  safeRevalidate('/persediaan')
}

export async function createExpense(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())

  const pMethod = String(rawData.paymentMethod || 'CASH').toUpperCase()
  const paymentMethod = (pMethod === 'TRANSFER' || pMethod === 'BANK' || pMethod === 'QRIS') ? 'BANK' : 'CASH'

  let businessLineId = rawData.businessLineId ? Number(rawData.businessLineId) : undefined
  if (!businessLineId && rawData.businessLine) {
    const bl = await prisma.businessLine.findFirst({
      where: {
        OR: [
          { name: { contains: String(rawData.businessLine) } },
          { code: { contains: String(rawData.businessLine).toUpperCase() } },
        ],
      },
    })
    if (bl) businessLineId = bl.id
  }

  await createExpenseJournal({
    accountCode: rawData.accountCode ? String(rawData.accountCode) : '',
    businessLineId,
    amount: Number(rawData.amount || 0),
    description: String(rawData.description || 'Pengeluaran operasional'),
    paymentMethod,
  }, 'WEB')

  safeRevalidate('/')
  safeRevalidate('/transaksi')
}

export async function deleteTransaction(id: number) {
  await prisma.$transaction(async (tx) => {
    const trx = await tx.transaction.findUnique({ where: { id } })
    if (trx) {
      await tx.auditLog.create({
        data: {
          action: 'DELETE_TRANSACTION',
          tableName: 'Transaction',
          recordId: String(id),
          oldValue: JSON.stringify(trx),
          source: 'WEB',
        },
      })
      await tx.transaction.delete({ where: { id } })
    }
  })

  safeRevalidate('/')
  safeRevalidate('/transaksi')
}
