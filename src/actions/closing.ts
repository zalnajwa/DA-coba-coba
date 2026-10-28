'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../lib/prisma'
import { getIncomeStatement, getAccountBalance } from '../lib/reports'
import { serializeDecimal } from '../lib/serialize'

export async function closePeriod(period: string, notes?: string) {
  // period format: 'YYYY-MM'
  const [yearStr, monthStr] = period.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1

  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59)

  const inc = await getIncomeStatement({ startDate, endDate })
  const openingRetained = await getAccountBalance('3300', startDate)
  const closingRetained = openingRetained + inc.netIncome

  const closing = await prisma.periodClosing.create({
    data: {
      period,
      closedAt: new Date(),
      openingRetainedEarnings: openingRetained,
      netIncome: inc.netIncome,
      closingRetainedEarnings: closingRetained,
      notes: notes || null,
    },
  })

  revalidatePath('/pengaturan/tutup-buku')
  revalidatePath('/laporan/posisi-keuangan')
  return serializeDecimal(closing)
}

export async function getClosingHistory() {
  const history = await prisma.periodClosing.findMany({
    orderBy: { period: 'desc' },
  })
  return serializeDecimal(history)
}

export async function isPeriodClosed(period: string) {
  const closed = await prisma.periodClosing.findFirst({
    where: { period },
  })
  return !!closed
}
