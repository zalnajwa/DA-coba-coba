'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createSaleJournal } from '@/lib/accounting'
import { serializeDecimal } from '@/lib/serialize'

export async function getProductsForPOS() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { businessLine: true, inventory: true },
    orderBy: { businessLine: { code: 'asc' } },
  })
  return products.map(p => ({
    id: p.id,
    name: p.name,
    code: p.code,
    price: Number(p.sellingPrice),
    costPrice: Number(p.costPrice),
    businessLine: p.businessLine.code,
    businessLineName: p.businessLine.name,
    stock: p.inventory ? Number(p.inventory.quantity) : null,
    unit: p.unit || 'pcs',
  }))
}

export async function getSeblakToppingsForPOS() {
  const toppings = await prisma.seblakTopping.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
  return toppings.map(t => ({
    id: t.id,
    name: t.name,
    price: Number(t.sellingPrice),
  }))
}

export async function processPOSSale(data: {
  items: { productId: number; name: string; quantity: number; price: number }[]
  paymentMethod: 'CASH' | 'BANK'
  businessLineId: number
  cashReceived: number
  totalAmount: number
}) {
  const saleItems = data.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
  }))

  const transaction = await createSaleJournal({
    businessLineId: data.businessLineId,
    items: saleItems,
    paymentMethod: data.paymentMethod,
  }, 'WEB')

  revalidatePath('/')
  revalidatePath('/kasir')
  revalidatePath('/transaksi')

  return {
    success: true,
    transactionId: transaction?.id || Date.now(),
    receiptData: {
      id: `INV-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString(),
      items: data.items,
      subtotal: data.totalAmount,
      total: data.totalAmount,
      paymentMethod: data.paymentMethod,
      cashReceived: data.cashReceived,
      change: data.cashReceived - data.totalAmount,
    }
  }
}

export async function getBusinessLines() {
  const lines = await prisma.businessLine.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  })
  return serializeDecimal(lines)
}
