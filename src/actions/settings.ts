'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../lib/prisma'
import { serializeDecimal } from '../lib/serialize'

// ===== Business Profile Settings =====

export async function getSettings() {
  const settings = await prisma.setting.findMany()
  const result: Record<string, string> = {}
  for (const s of settings) {
    result[s.key] = s.value
  }
  return result
}

export async function updateSettings(data: Record<string, string>) {
  for (const [key, value] of Object.entries(data)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }
  revalidatePath('/pengaturan')
}

// ===== Petty Cash =====

export async function getPettyCashBalance() {
  const entries = await prisma.pettyCash.findMany()
  let balance = 0
  for (const e of entries) {
    if (e.type === 'REPLENISH') balance += Number(e.amount)
    else balance -= Number(e.amount)
  }
  return balance
}

export async function getPettyCashHistory() {
  const history = await prisma.pettyCash.findMany({
    orderBy: { date: 'desc' },
    take: 50,
  })
  return serializeDecimal(history)
}

export async function createPettyCashEntry(data: {
  type: 'REPLENISH' | 'EXPENSE'
  amount: number
  description: string
}) {
  await prisma.pettyCash.create({
    data: {
      date: new Date(),
      type: data.type,
      amount: data.amount,
      description: data.description,
    },
  })
  revalidatePath('/kas')
}

// ===== Backup =====

export async function createBackup() {
  const fs = await import('fs')
  const path = await import('path')
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
  const backupDir = path.join(process.cwd(), 'backups')

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `backup-${timestamp}.db`
  const backupPath = path.join(backupDir, filename)

  fs.copyFileSync(dbPath, backupPath)
  const stats = fs.statSync(backupPath)

  await prisma.backupHistory.create({
    data: {
      filename,
      filePath: backupPath,
      sizeBytes: stats.size,
      type: 'MANUAL',
    },
  })

  revalidatePath('/pengaturan/backup')
  return { filename, size: stats.size }
}

export async function getBackupHistory() {
  return await prisma.backupHistory.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

export async function restoreBackup(filename: string) {
  const fs = await import('fs')
  const path = await import('path')
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
  const backupDir = path.join(process.cwd(), 'backups')
  const backupPath = path.join(backupDir, filename)

  if (!fs.existsSync(backupPath)) {
    throw new Error('File backup tidak ditemukan')
  }

  // Create safety backup first
  const safetyName = `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.db`
  const safetyPath = path.join(backupDir, safetyName)
  fs.copyFileSync(dbPath, safetyPath)

  // Restore
  fs.copyFileSync(backupPath, dbPath)
  revalidatePath('/')
  return { restored: filename, safetyBackup: safetyName }
}

// ===== Waste Logs =====

export async function getWasteLogs(limit: number = 50) {
  const logs = await prisma.wasteLog.findMany({
    orderBy: { date: 'desc' },
    take: limit,
    include: { businessLine: true },
  })
  return serializeDecimal(logs)
}

// ===== Tax Summary =====

export async function getTaxSummaryData(year: number) {
  const { getTaxSummary } = await import('../lib/reports')
  const summary = await getTaxSummary(year)
  return serializeDecimal(summary)
}

// ===== Create Inventory Item =====

export async function createInventoryItem(data: {
  name: string
  businessLineId: number
  quantity: number
  unit: string
  minimumStock: number
  costPrice: number
  sellingPrice: number
}) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      businessLineId: data.businessLineId,
      sellingPrice: data.sellingPrice,
      costPrice: data.costPrice,
      unit: data.unit,
      isActive: true,
    },
  })

  await prisma.inventory.create({
    data: {
      productId: product.id,
      businessLineId: data.businessLineId,
      quantity: data.quantity,
      unit: data.unit,
      minimumStock: data.minimumStock,
      costPrice: data.costPrice,
    },
  })

  revalidatePath('/persediaan')
}

// ===== System Cash Balance (for reconciliation) =====

export async function getSystemCashBalance() {
  const cashLines = await prisma.transactionLine.findMany({
    where: { account: { code: '1100' } },
  })
  let balance = 0
  for (const line of cashLines) {
    balance += Number(line.debit) - Number(line.credit)
  }
  return balance
}
