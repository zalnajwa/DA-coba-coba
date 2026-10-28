'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../lib/prisma'
import { createJournalEntry } from '../lib/accounting'
import { serializeDecimal } from '../lib/serialize'

export async function getPayables(type?: 'PAYABLE' | 'RECEIVABLE', status?: string) {
  const where: any = {}
  if (type) where.type = type
  if (status) where.status = status
  const payables = await prisma.payable.findMany({
    where,
    include: { businessLine: true },
    orderBy: { dueDate: 'asc' },
  })
  return serializeDecimal(payables)
}

export async function createPayable(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const amount = parseFloat(data.amount as string || '0')
  const type = (data.type as string) || 'PAYABLE'

  await prisma.payable.create({
    data: {
      type,
      amount,
      paidAmount: 0,
      contactName: String(data.contactName || 'Kontak'),
      description: data.description ? String(data.description) : null,
      dueDate: data.dueDate ? new Date(data.dueDate as string) : new Date(),
      status: 'UNPAID',
      businessLineId: data.businessLineId ? Number(data.businessLineId) : null,
    },
  })
  revalidatePath('/utang-piutang')
}

export async function recordPayment(id: number, amount: number, paymentMethod: string = 'CASH') {
  const payable = await prisma.payable.findUnique({ where: { id } })
  if (!payable) throw new Error('Data utang/piutang tidak ditemukan')

  const newPaid = Number(payable.paidAmount) + amount
  const isPaidFull = newPaid >= Number(payable.amount)
  const newStatus = isPaidFull ? 'PAID' : 'PARTIAL'

  const cashAccount = paymentMethod === 'BANK' ? '1200' : '1100'

  // Create double-entry journal for the payment
  if (payable.type === 'PAYABLE') {
    // Bayar utang: Debit Utang Usaha (2100), Kredit Kas/Bank
    await createJournalEntry(
      {
        date: new Date(),
        description: `Pelunasan Utang: ${payable.contactName}`,
        type: 'EXPENSE',
        source: 'WEB',
        businessLineId: payable.businessLineId,
      },
      [
        { accountCode: '2100', debit: amount, credit: 0, description: `Pelunasan ke ${payable.contactName}` },
        { accountCode: cashAccount, debit: 0, credit: amount, description: `Pembayaran ke ${payable.contactName}` },
      ]
    )
  } else {
    // Penerimaan piutang: Debit Kas/Bank, Kredit Piutang Usaha (1300)
    await createJournalEntry(
      {
        date: new Date(),
        description: `Penerimaan Piutang: ${payable.contactName}`,
        type: 'SALE',
        source: 'WEB',
        businessLineId: payable.businessLineId,
      },
      [
        { accountCode: cashAccount, debit: amount, credit: 0, description: `Terima dari ${payable.contactName}` },
        { accountCode: '1300', debit: 0, credit: amount, description: `Pelunasan piutang ${payable.contactName}` },
      ]
    )
  }

  await prisma.payable.update({
    where: { id },
    data: {
      paidAmount: newPaid,
      status: newStatus,
    },
  })

  revalidatePath('/utang-piutang')
  revalidatePath('/laporan/posisi-keuangan')
}

export async function getDuePayables(daysAhead: number = 7) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysAhead)

  const payables = await prisma.payable.findMany({
    where: {
      status: { in: ['UNPAID', 'PARTIAL'] },
      dueDate: { lte: targetDate },
    },
    include: { businessLine: true },
    orderBy: { dueDate: 'asc' },
  })
  return serializeDecimal(payables)
}
