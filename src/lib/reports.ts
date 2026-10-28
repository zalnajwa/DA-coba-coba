import { prisma } from './prisma';
import { ReportFilter, DashboardSummary } from '../types';

/**
 * Helper to get account balance up to a date
 */
export async function getAccountBalance(accountCode: string, asOfDate: Date = new Date()) {
  const lines = await prisma.transactionLine.findMany({
    where: {
      account: { code: accountCode },
      transaction: { date: { lte: asOfDate } },
    },
    include: { account: true },
  });

  let balance = 0;
  for (const line of lines) {
    if (line.account.normalBalance === 'DEBIT') {
      balance += Number(line.debit) - Number(line.credit);
    } else {
      balance += Number(line.credit) - Number(line.debit);
    }
  }
  return balance;
}

/**
 * 1. Laporan Laba Rugi (Sesuai SAK EMKM)
 */
export async function getIncomeStatement(filter: ReportFilter) {
  const { startDate, endDate, businessLineId } = filter;

  const whereClause: any = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };
  if (businessLineId) {
    whereClause.businessLineId = businessLineId;
  }

  const transactionLines = await prisma.transactionLine.findMany({
    where: {
      transaction: whereClause,
      account: {
        type: { in: ['REVENUE', 'COGS', 'EXPENSE'] },
      },
    },
    include: {
      account: {
        include: { businessLine: true },
      },
    },
  });

  const revenues: Record<string, { code: string; name: string; amount: number; business: string }> = {};
  const cogs: Record<string, { code: string; name: string; amount: number; business: string }> = {};
  const expenses: Record<string, { code: string; name: string; amount: number; business: string }> = {};

  let totalRevenue = 0;
  let totalCogs = 0;
  let totalExpense = 0;

  for (const line of transactionLines) {
    const acc = line.account;
    const netCredit = Number(line.credit) - Number(line.debit);
    const netDebit = Number(line.debit) - Number(line.credit);
    const bName = acc.businessLine?.name || 'Umum';

    if (acc.type === 'REVENUE') {
      if (!revenues[acc.code]) {
        revenues[acc.code] = { code: acc.code, name: acc.name, amount: 0, business: bName };
      }
      revenues[acc.code].amount += netCredit;
      totalRevenue += netCredit;
    } else if (acc.type === 'COGS') {
      if (!cogs[acc.code]) {
        cogs[acc.code] = { code: acc.code, name: acc.name, amount: 0, business: bName };
      }
      cogs[acc.code].amount += netDebit;
      totalCogs += netDebit;
    } else if (acc.type === 'EXPENSE') {
      if (!expenses[acc.code]) {
        expenses[acc.code] = { code: acc.code, name: acc.name, amount: 0, business: bName };
      }
      expenses[acc.code].amount += netDebit;
      totalExpense += netDebit;
    }
  }

  const grossProfit = totalRevenue - totalCogs;
  const netIncome = grossProfit - totalExpense;

  return {
    period: { startDate, endDate },
    revenues: Object.values(revenues),
    cogs: Object.values(cogs),
    expenses: Object.values(expenses),
    totalRevenue,
    totalCogs,
    grossProfit,
    totalExpense,
    netIncome,
  };
}

/**
 * 2. Laporan Posisi Keuangan / Neraca (Sesuai SAK EMKM)
 */
export async function getBalanceSheet(asOfDate: Date = new Date()) {
  const allAccounts = await prisma.account.findMany({
    where: { isActive: true },
    include: {
      transactionLines: {
        where: { transaction: { date: { lte: asOfDate } } },
      },
    },
  });

  const assets: any[] = [];
  const liabilities: any[] = [];
  const equity: any[] = [];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquityAccounts = 0;

  for (const acc of allAccounts) {
    let balance = 0;
    for (const l of acc.transactionLines) {
      if (acc.normalBalance === 'DEBIT') {
        balance += Number(l.debit) - Number(l.credit);
      } else {
        balance += Number(l.credit) - Number(l.debit);
      }
    }

    if (acc.type === 'ASSET') {
      assets.push({ code: acc.code, name: acc.name, balance });
      totalAssets += balance;
    } else if (acc.type === 'LIABILITY') {
      liabilities.push({ code: acc.code, name: acc.name, balance });
      totalLiabilities += balance;
    } else if (acc.type === 'EQUITY') {
      equity.push({ code: acc.code, name: acc.name, balance });
      totalEquityAccounts += balance;
    }
  }

  // Calculate Net Income up to asOfDate to reflect in current earnings
  const startOfYear = new Date(asOfDate.getFullYear(), 0, 1);
  const incStmt = await getIncomeStatement({ startDate: startOfYear, endDate: asOfDate });
  const currentEarnings = incStmt.netIncome;

  const totalEquity = totalEquityAccounts + currentEarnings;
  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  return {
    asOfDate,
    assets,
    liabilities,
    equity,
    currentEarnings,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    isBalanced,
  };
}

/**
 * 3. Laporan Arus Kas (Metode Langsung)
 */
export async function getCashFlow(filter: ReportFilter) {
  const { startDate, endDate } = filter;

  // Operating cash: Sales cash in, purchases/expenses cash out
  const cashLines = await prisma.transactionLine.findMany({
    where: {
      account: { code: { in: ['1100', '1200', '1250'] } },
      transaction: { date: { gte: startDate, lte: endDate } },
    },
    include: {
      transaction: {
        include: {
          transactionLines: { include: { account: true } },
        },
      },
    },
  });

  let operatingIn = 0;
  let operatingOut = 0;
  const investingOut = 0;
  let financingIn = 0;
  let financingOut = 0;

  for (const line of cashLines) {
    const netCashChange = Number(line.debit) - Number(line.credit);
    const trxType = line.transaction.type;

    if (trxType === 'SALE') {
      operatingIn += Number(line.debit);
    } else if (trxType === 'PURCHASE' || trxType === 'EXPENSE') {
      operatingOut += Number(line.credit);
    } else if (trxType === 'DEPRECIATION') {
      // Non-cash transaction
    } else {
      if (netCashChange > 0) financingIn += netCashChange;
      else financingOut += Math.abs(netCashChange);
    }
  }

  const netOperating = operatingIn - operatingOut;
  const netInvesting = -investingOut;
  const netFinancing = financingIn - financingOut;
  const netChangeInCash = netOperating + netInvesting + netFinancing;

  return {
    period: { startDate, endDate },
    operating: {
      cashIn: operatingIn,
      cashOut: operatingOut,
      net: netOperating,
    },
    investing: {
      cashOut: investingOut,
      net: netInvesting,
    },
    financing: {
      cashIn: financingIn,
      cashOut: financingOut,
      net: netFinancing,
    },
    netChangeInCash,
  };
}

/**
 * 4. Laporan Perubahan Ekuitas
 */
export async function getEquityChanges(filter: ReportFilter) {
  const { startDate, endDate } = filter;

  const beginningModal = await getAccountBalance('3100', startDate);
  const beginningRetained = await getAccountBalance('3300', startDate);
  const prive = await getAccountBalance('3200', endDate);

  const inc = await getIncomeStatement(filter);
  const netIncome = inc.netIncome;

  const endingEquity = beginningModal + beginningRetained + netIncome - prive;

  return {
    period: { startDate, endDate },
    beginningEquity: beginningModal + beginningRetained,
    netIncome,
    prive,
    endingEquity,
  };
}

/**
 * 5. Dashboard Summary
 */
export async function getDashboardSummary(period: 'today' | 'week' | 'month' = 'today'): Promise<DashboardSummary> {
  const now = new Date();
  let startDate = new Date();

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const inc = await getIncomeStatement({ startDate, endDate: now });

  // Revenue per business line
  const lines = await prisma.businessLine.findMany();
  const revenueByBusiness: Record<string, number> = {};

  for (const b of lines) {
    const bInc = await getIncomeStatement({ startDate, endDate: now, businessLineId: b.id });
    revenueByBusiness[b.name] = bInc.totalRevenue;
  }

  const lowStock = await getLowStockItems();
  const pendingPayables = await getPendingPayables();

  return {
    totalRevenue: inc.totalRevenue,
    totalExpense: inc.totalExpense + inc.totalCogs,
    netProfit: inc.netIncome,
    revenueByBusiness,
    lowStockItems: lowStock,
    pendingPayables,
  };
}

/**
 * 6. Low stock items
 */
export async function getLowStockItems() {
  const inventories = await prisma.inventory.findMany({
    include: { product: true, businessLine: true },
  });

  return inventories
    .filter((inv) => Number(inv.quantity) <= Number(inv.minimumStock))
    .map((inv) => ({
      id: inv.id,
      name: inv.product?.name || 'Item',
      currentStock: Number(inv.quantity),
      minimumStock: Number(inv.minimumStock),
      unit: inv.unit || 'unit',
      businessLine: inv.businessLine?.name || 'Umum',
    }));
}

/**
 * 7. Pending payables (Utang jatuh tempo)
 */
export async function getPendingPayables() {
  const payables = await prisma.payable.findMany({
    where: { status: { in: ['UNPAID', 'PARTIAL'] } },
    include: { businessLine: true },
    orderBy: { dueDate: 'asc' },
  });

  return payables.map((p) => ({
    id: p.id,
    type: p.type,
    contactName: p.contactName,
    description: p.description,
    amount: Number(p.amount),
    remaining: Number(p.amount) - Number(p.paidAmount),
    dueDate: p.dueDate,
    status: p.status,
    businessLine: p.businessLine?.name || 'Umum',
  }));
}

/**
 * 8. PPh Final UMKM Summary
 */
export async function getTaxSummary(year: number = new Date().getFullYear()) {
  const records = await prisma.taxRecord.findMany({
    where: { year },
    orderBy: { month: 'asc' },
  });

  const plainRecords = records.map((r) => ({
    id: r.id,
    year: r.year,
    month: r.month,
    grossRevenue: Number(r.grossRevenue),
    cumulativeRevenue: Number(r.cumulativeRevenue),
    taxableAmount: Number(r.taxableAmount),
    taxAmount: Number(r.taxAmount),
    isPaid: r.isPaid,
    paidDate: r.paidDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  const totalRevenueYear = plainRecords.reduce((acc, r) => acc + r.grossRevenue, 0);
  const totalTaxYear = plainRecords.reduce((acc, r) => acc + r.taxAmount, 0);

  return {
    year,
    records: plainRecords,
    totalRevenueYear,
    totalTaxYear,
    threshold: 500000000,
    isExempt: totalRevenueYear <= 500000000,
  };
}
