'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../lib/prisma'
import { serializeDecimal } from '../lib/serialize'

export async function openShift(openingCash: number) {
  const existing = await getCurrentShift()
  if (existing) throw new Error('Shift sudah aktif. Tutup shift sebelumnya terlebih dahulu.')

  const shift = await prisma.shift.create({
    data: {
      openedAt: new Date(),
      openingCash,
      status: 'OPEN',
    },
  })
  revalidatePath('/')
  revalidatePath('/kas/shift')
  return serializeDecimal(shift)
}

export async function closeShift(closingCash: number, notes?: string) {
  const currentShift = await getCurrentShift()
  if (!currentShift) throw new Error('Tidak ada shift yang sedang terbuka')

  // Calculate cash transactions during shift
  const cashLines = await prisma.transactionLine.findMany({
    where: {
      account: { code: '1100' }, // Kas
      transaction: {
        date: { gte: currentShift.openedAt },
      },
    },
  })

  let cashChange = 0
  for (const line of cashLines) {
    cashChange += Number(line.debit) - Number(line.credit)
  }

  const expectedCash = Number(currentShift.openingCash) + cashChange
  const difference = Number(closingCash) - expectedCash

  const closed = await prisma.shift.update({
    where: { id: currentShift.id },
    data: {
      closedAt: new Date(),
      closingCash,
      expectedCash,
      difference,
      status: 'CLOSED',
      notes,
    },
  })

  revalidatePath('/')
  revalidatePath('/kas/shift')
  return serializeDecimal(closed)
}

export async function getCurrentShift() {
  const shift = await prisma.shift.findFirst({
    where: { status: 'OPEN' },
    orderBy: { openedAt: 'desc' },
  })
  return serializeDecimal(shift)
}

export async function getShiftHistory(limit: number = 10) {
  const history = await prisma.shift.findMany({
    orderBy: { openedAt: 'desc' },
    take: limit,
  })
  return serializeDecimal(history)
}

export async function reconcileCash(physicalBalance: number, notes?: string) {
  const currentShift = await getCurrentShift()

  // Calculate current system balance of Kas (1100)
  const cashLines = await prisma.transactionLine.findMany({
    where: { account: { code: '1100' } },
  })
  let systemBalance = 0
  for (const line of cashLines) {
    systemBalance += Number(line.debit) - Number(line.credit)
  }

  const difference = physicalBalance - systemBalance

  const rec = await prisma.cashReconciliation.create({
    data: {
      date: new Date(),
      systemBalance,
      physicalBalance,
      difference,
      notes: notes || null,
      shiftId: currentShift ? currentShift.id : null,
    },
  })

  revalidatePath('/')
  revalidatePath('/kas')
  return serializeDecimal(rec)
}
