'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../lib/prisma'
import { calculateDepreciation } from '../lib/accounting'
import { serializeDecimal } from '../lib/serialize'

export async function getFixedAssets(businessLineId?: number) {
  const where = businessLineId ? { businessLineId: Number(businessLineId) } : {}
  const assets = await prisma.fixedAsset.findMany({
    where,
    include: { businessLine: true, depreciations: { orderBy: { date: 'desc' }, take: 5 } },
    orderBy: { purchaseDate: 'desc' },
  })
  return serializeDecimal(assets)
}

export async function createFixedAsset(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  await prisma.fixedAsset.create({
    data: {
      name: String(data.name),
      businessLineId: Number(data.businessLineId || 1),
      purchaseCost: parseFloat(data.purchaseCost as string || data.purchasePrice as string || '0'),
      usefulLifeMonths: parseInt(data.usefulLifeMonths as string || '36'),
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate as string) : new Date(),
      salvageValue: data.salvageValue ? parseFloat(data.salvageValue as string) : 0,
      isActive: true,
    },
  })
  revalidatePath('/aset')
}

export async function runDepreciation() {
  const activeAssets = await prisma.fixedAsset.findMany({
    where: { isActive: true },
  })

  for (const asset of activeAssets) {
    try {
      await calculateDepreciation(asset.id)
    } catch (e) {
      console.error(`Penyusutan gagal untuk aset ${asset.name}:`, e)
    }
  }

  revalidatePath('/aset')
  revalidatePath('/laporan/posisi-keuangan')
  revalidatePath('/laporan/laba-rugi')
}

export async function getAssetDetails(id: number) {
  const asset = await prisma.fixedAsset.findUnique({
    where: { id: Number(id) },
    include: {
      businessLine: true,
      depreciations: { orderBy: { date: 'desc' } },
    },
  })
  return serializeDecimal(asset)
}
