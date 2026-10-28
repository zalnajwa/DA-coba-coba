'use server'

import {
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getEquityChanges,
  getDashboardSummary,
  getLowStockItems,
  getPendingPayables,
} from '../lib/reports'
import { prisma } from '../lib/prisma'
import { serializeDecimal } from '../lib/serialize'

export async function getIncomeStatementData(startDate: string, endDate: string, businessLineId?: number) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const data = await getIncomeStatement({
    startDate: isNaN(start.getTime()) ? new Date(new Date().getFullYear(), new Date().getMonth(), 1) : start,
    endDate: isNaN(end.getTime()) ? new Date() : end,
    businessLineId: businessLineId ? Number(businessLineId) : undefined,
  })
  return serializeDecimal(data)
}

export async function getBalanceSheetData(asOfDate: string) {
  const date = new Date(asOfDate)
  const data = await getBalanceSheet(isNaN(date.getTime()) ? new Date() : date)
  return serializeDecimal(data)
}

export async function getCashFlowData(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const data = await getCashFlow({
    startDate: isNaN(start.getTime()) ? new Date(new Date().getFullYear(), new Date().getMonth(), 1) : start,
    endDate: isNaN(end.getTime()) ? new Date() : end,
  })
  return serializeDecimal(data)
}

export async function getEquityChangesData(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const data = await getEquityChanges({
    startDate: isNaN(start.getTime()) ? new Date(new Date().getFullYear(), new Date().getMonth(), 1) : start,
    endDate: isNaN(end.getTime()) ? new Date() : end,
  })
  return serializeDecimal(data)
}

export async function getDashboardData() {
  const summary = await getDashboardSummary('today')

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const countToday = await prisma.transaction.count({
    where: { date: { gte: startOfToday } },
  })

  const revenueByBusinessLine = Object.entries(summary.revenueByBusiness).map(([name, value]) => ({
    name,
    value,
  }))

  const lowStock = await getLowStockItems()
  const pendingPayables = await getPendingPayables()

  return serializeDecimal({
    totalRevenueToday: summary.totalRevenue,
    totalExpensesToday: summary.totalExpense,
    netIncomeToday: summary.netProfit,
    transactionCountToday: countToday,
    revenueByBusinessLine,
    lowStockItems: lowStock,
    pendingPayables,
  })
}

export async function exportReport(type: string, filter: any) {
  const start = filter?.startDate ? new Date(filter.startDate) : new Date(new Date().getFullYear(), 0, 1)
  const end = filter?.endDate ? new Date(filter.endDate) : new Date()

  if (type === 'income') {
    const inc = await getIncomeStatement({ startDate: start, endDate: end })
    let csv = 'Kategori,Kode Akun,Nama Akun,Jumlah (Rp)\n'
    inc.revenues.forEach((r) => { csv += `Pendapatan,${r.code},"${r.name}",${r.amount}\n` })
    inc.cogs.forEach((c) => { csv += `HPP,${c.code},"${c.name}",${c.amount}\n` })
    inc.expenses.forEach((e) => { csv += `Beban Operasional,${e.code},"${e.name}",${e.amount}\n` })
    csv += `\nTotal Pendapatan,,,${inc.totalRevenue}\n`
    csv += `Total HPP,,,${inc.totalCogs}\n`
    csv += `Laba Kotor,,,${inc.grossProfit}\n`
    csv += `Total Beban Operasional,,,${inc.totalExpense}\n`
    csv += `Laba Bersih,,,${inc.netIncome}\n`
    return csv
  }

  return 'Date,Description,Amount\n'
}
