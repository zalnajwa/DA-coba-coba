'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../lib/prisma'
import { createWasteJournal } from '../lib/accounting'
import { serializeDecimal } from '../lib/serialize'

export async function getInventory(businessLineId?: number) {
  const where = businessLineId ? { businessLineId: Number(businessLineId) } : {}
  const items = await prisma.inventory.findMany({
    where,
    include: {
      product: true,
      businessLine: true,
    },
    orderBy: { id: 'asc' },
  })
  return serializeDecimal(items)
}

export async function getInventoryItem(id: number) {
  const item = await prisma.inventory.findUnique({
    where: { id: Number(id) },
    include: {
      product: true,
      businessLine: true,
      movements: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  return serializeDecimal(item)
}

export async function updateInventory(id: number, data: { quantity?: number; minimumStock?: number; costPrice?: number }) {
  await prisma.inventory.update({
    where: { id: Number(id) },
    data: {
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.minimumStock !== undefined && { minimumStock: data.minimumStock }),
      ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
    },
  })
  revalidatePath('/persediaan')
}

export async function getLowStockItems() {
  const items = await prisma.inventory.findMany({
    include: { product: true, businessLine: true },
  })
  const filtered = items.filter((item) => Number(item.quantity) <= Number(item.minimumStock))
  return serializeDecimal(filtered)
}

export async function getSeblakToppings() {
  const toppings = await prisma.seblakTopping.findMany({
    include: {
      seblakBOMs: {
        include: {
          inventory: {
            include: { product: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
  return serializeDecimal(toppings)
}

export async function updateSeblakTopping(id: number, data: { name?: string; sellingPrice?: number; isActive?: boolean }) {
  await prisma.seblakTopping.update({
    where: { id: Number(id) },
    data,
  })
  revalidatePath('/seblak')
}

export async function createSeblakTopping(data: { name: string; sellingPrice: number }) {
  await prisma.seblakTopping.create({
    data: {
      name: data.name,
      sellingPrice: data.sellingPrice,
      isActive: true,
    },
  })
  revalidatePath('/seblak')
}

export async function logWaste(formData: FormData) {
  const raw = Object.fromEntries(formData.entries())
  let items = []
  if (raw.items) {
    try {
      items = JSON.parse(raw.items as string)
    } catch {
      items = []
    }
  } else if (raw.inventoryId && raw.quantity) {
    items = [{
      inventoryId: Number(raw.inventoryId),
      quantity: Number(raw.quantity),
      estimatedCost: Number(raw.estimatedCost || 0),
    }]
  }

  await createWasteJournal({
    businessLineId: Number(raw.businessLineId || 3), // 3 = Seblak
    items,
    notes: String(raw.notes || ''),
  }, 'WEB')

  revalidatePath('/seblak')
  revalidatePath('/seblak/waste')
  revalidatePath('/persediaan')
}
