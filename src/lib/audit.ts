import { prisma } from './prisma';

export async function logAction(action: string, tableName: string, recordId: string, oldValue?: any, newValue?: any, source: 'WEB'|'WHATSAPP'|'SYSTEM' = 'SYSTEM') {
  // Logic
  return prisma.auditLog.create({
    data: {
      action,
      tableName,
      recordId,
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
      source
    }
  });
}

export async function getAuditLog(filter?: { tableName?: string, startDate?: Date, endDate?: Date, limit?: number }) {
  return prisma.auditLog.findMany({
    where: {
      ...(filter?.tableName ? { tableName: filter.tableName } : {}),
      ...(filter?.startDate || filter?.endDate ? {
        createdAt: {
          ...(filter?.startDate ? { gte: filter.startDate } : {}),
          ...(filter?.endDate ? { lte: filter.endDate } : {}),
        }
      } : {}),
    },
    take: filter?.limit || 100,
    orderBy: { createdAt: 'desc' }
  });
}
