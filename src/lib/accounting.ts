import { prisma } from './prisma';
import { SaleFormData, SeblakSaleFormData, PurchaseFormData, ExpenseFormData, WasteFormData } from '../types';

export async function getAccountByCode(code: string) {
  return prisma.account.findUnique({ where: { code } });
}

export async function createJournalEntry(
  transactionData: {
    date: Date;
    description: string;
    type: string;
    source?: 'WEB' | 'WHATSAPP';
    businessLineId?: number | null;
    shiftId?: number | null;
    discountId?: number | null;
  },
  lines: { accountCode: string; debit: number; credit: number; description?: string }[]
) {
  // Validate debit = credit (accounting balance equation)
  const totalDebit = lines.reduce((acc, l) => acc + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + Number(l.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Jurnal tidak seimbang! Total Debit (Rp${totalDebit}) ≠ Total Kredit (Rp${totalCredit})`);
  }

  return prisma.$transaction(async (tx) => {
    // Resolve all accounts
    const accountRecords = await Promise.all(
      lines.map(async (line) => {
        const acc = await tx.account.findUnique({ where: { code: line.accountCode } });
        if (!acc) throw new Error(`Akun dengan kode ${line.accountCode} tidak ditemukan`);
        return { ...line, accountId: acc.id };
      })
    );

    // Create Transaction
    const transaction = await tx.transaction.create({
      data: {
        date: transactionData.date || new Date(),
        description: transactionData.description,
        type: transactionData.type,
        source: transactionData.source || 'WEB',
        businessLineId: transactionData.businessLineId || null,
        shiftId: transactionData.shiftId || null,
        discountId: transactionData.discountId || null,
        transactionLines: {
          create: accountRecords.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description || transactionData.description,
          })),
        },
      },
      include: {
        transactionLines: { include: { account: true } },
      },
    });

    // Record Audit Log
    await tx.auditLog.create({
      data: {
        action: 'CREATE_TRANSACTION',
        tableName: 'Transaction',
        recordId: String(transaction.id),
        newValue: JSON.stringify({ id: transaction.id, type: transaction.type, amount: totalDebit }),
        source: transactionData.source || 'WEB',
      },
    });

    return transaction;
  });
}

/**
 * 1. Catat Penjualan Biasa (Warkop / Rental PS / Seblak Paket)
 */
export async function createSaleJournal(data: SaleFormData, source: 'WEB' | 'WHATSAPP' = 'WEB') {
  return prisma.$transaction(async (tx) => {
    // Resolve business line by ID or name
    let businessLine = null;
    if (data.businessLineId && !isNaN(Number(data.businessLineId))) {
      businessLine = await tx.businessLine.findUnique({ where: { id: Number(data.businessLineId) } });
    }
    if (!businessLine && (data as any).businessLine) {
      const blNameOrCode = String((data as any).businessLine).trim();
      businessLine = await tx.businessLine.findFirst({
        where: {
          OR: [
            { name: { contains: blNameOrCode } },
            { code: { contains: blNameOrCode.toUpperCase() } },
          ],
        },
      });
    }
    if (!businessLine) {
      businessLine = await tx.businessLine.findFirst({ orderBy: { id: 'asc' } });
    }
    if (!businessLine) throw new Error('Lini bisnis tidak ditemukan');

    // Calculate total price and HPP cost
    let totalSellingPrice = 0;
    let totalCostPrice = 0;

    const productDetails: { product: any; quantity: number; price: number }[] = [];

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      for (const item of data.items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true },
        });
        if (!prod) throw new Error(`Produk ID ${item.productId} tidak ditemukan`);

        const price = Number(item.price || prod.sellingPrice);
        const cost = Number(prod.costPrice || 0) * item.quantity;
        totalSellingPrice += price * item.quantity;
        totalCostPrice += cost;

        productDetails.push({ product: prod, quantity: item.quantity, price });
      }
    }

    // Direct sale fallback if no items passed
    if (totalSellingPrice === 0 && ((data as any).amount || (data as any).totalAmount)) {
      totalSellingPrice = Number((data as any).amount || (data as any).totalAmount || 0);
    }

    // Determine accounts based on business line and payment method
    const pMethod = String(data.paymentMethod || 'CASH').toUpperCase();
    const paymentAccountCode = (pMethod === 'BANK' || pMethod === 'TRANSFER' || pMethod === 'QRIS') ? '1200' : '1100';
    let revenueAccountCode = '4900';
    let cogsAccountCode = '5100';
    let inventoryAccountCode = '1410';

    if (businessLine.code === 'WARKOP') {
      revenueAccountCode = '4110'; // Penjualan Warkop
      cogsAccountCode = '5100';    // HPP Warkop
      inventoryAccountCode = '1410'; // Persediaan Warkop
    } else if (businessLine.code === 'RENTAL_PS') {
      revenueAccountCode = '4210'; // Pendapatan Sewa PS
      cogsAccountCode = '5300';    // HPP Rental PS
      inventoryAccountCode = '1430'; // Persediaan Rental PS
    } else if (businessLine.code === 'SEBLAK') {
      revenueAccountCode = '4310'; // Penjualan Seblak
      cogsAccountCode = '5200';    // HPP Seblak
      inventoryAccountCode = '1420'; // Persediaan Seblak
    }

    const journalLines: { accountCode: string; debit: number; credit: number; description?: string }[] = [
      // Debit: Kas / Bank
      { accountCode: paymentAccountCode, debit: totalSellingPrice, credit: 0, description: `Penerimaan Penjualan ${businessLine.name}` },
      // Credit: Pendapatan
      { accountCode: revenueAccountCode, debit: 0, credit: totalSellingPrice, description: `Penjualan ${businessLine.name}` },
    ];

    // If there is HPP & inventory cost
    if (totalCostPrice > 0) {
      journalLines.push(
        { accountCode: cogsAccountCode, debit: totalCostPrice, credit: 0, description: `Beban Pokok Penjualan ${businessLine.name}` },
        { accountCode: inventoryAccountCode, debit: 0, credit: totalCostPrice, description: `Pengurangan Persediaan ${businessLine.name}` }
      );
    }

    // Create journal transaction
    const desc = productDetails.length > 0
      ? `Penjualan ${businessLine.name}: ${productDetails.map((p) => `${p.product.name} (${p.quantity}x)`).join(', ')}`
      : ((data as any).description || `Penjualan ${businessLine.name} (Pencatatan Manual)`);
    
    // Resolve accounts
    const accountRecords = await Promise.all(
      journalLines.map(async (line) => {
        const acc = await tx.account.findUnique({ where: { code: line.accountCode } });
        if (!acc) throw new Error(`Akun ${line.accountCode} tidak ditemukan`);
        return { ...line, accountId: acc.id };
      })
    );

    const transaction = await tx.transaction.create({
      data: {
        date: new Date(),
        description: desc,
        type: 'SALE',
        source,
        businessLineId: businessLine.id,
        discountId: data.discountId || null,
        transactionLines: {
          create: accountRecords.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        },
      },
    });

    // Update inventory quantity if applicable
    for (const item of productDetails) {
      if (item.product.inventory) {
        await tx.inventory.update({
          where: { id: item.product.inventory.id },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId: item.product.inventory.id,
            transactionId: transaction.id,
            type: 'OUT',
            quantity: item.quantity,
            costPrice: item.product.costPrice,
            description: `Penjualan: ${item.product.name}`,
            date: new Date(),
          },
        });
      }
    }

    return transaction;
  });
}

/**
 * 2. Catat Penjualan Seblak Prasmanan (Berdasarkan Topping + BOM Otomatis)
 */
export async function createSeblakSaleJournal(data: SeblakSaleFormData, source: 'WEB' | 'WHATSAPP' = 'WEB') {
  return prisma.$transaction(async (tx) => {
    const seblakBL = await tx.businessLine.findUnique({ where: { code: 'SEBLAK' } });
    if (!seblakBL) throw new Error('Lini bisnis SEBLAK tidak ditemukan');

    let calculatedTotal = 0;
    let totalHPP = 0;
    const toppingNames: string[] = [];

    // For each topping, calculate selling price and HPP based on BOM
    for (const item of data.toppings) {
      const topping = await tx.seblakTopping.findUnique({
        where: { id: item.toppingId },
        include: {
          seblakBOMs: {
            include: { inventory: true },
          },
        },
      });

      if (!topping) continue;
      const toppingPrice = Number(topping.sellingPrice) * item.quantity;
      calculatedTotal += toppingPrice;
      toppingNames.push(`${topping.name} (${item.quantity}x)`);

      // Process BOM for inventory reduction and HPP
      for (const bom of topping.seblakBOMs) {
        const qtyUsed = Number(bom.quantityUsed) * item.quantity;
        const invCost = Number(bom.inventory.costPrice) * qtyUsed;
        totalHPP += invCost;

        // Reduce inventory
        await tx.inventory.update({
          where: { id: bom.inventory.id },
          data: {
            quantity: { decrement: qtyUsed },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId: bom.inventory.id,
            type: 'OUT',
            quantity: qtyUsed,
            costPrice: bom.inventory.costPrice,
            description: `Bahan Seblak Topping ${topping.name}`,
            date: new Date(),
          },
        });
      }
    }

    const finalAmount = data.totalPrice || calculatedTotal;
    const paymentAccountCode = data.paymentMethod === 'BANK' ? '1200' : '1100';

    const journalLines = [
      // Kas / Bank masuk
      { accountCode: paymentAccountCode, debit: finalAmount, credit: 0, description: 'Penjualan Seblak Prasmanan' },
      // Pendapatan Seblak
      { accountCode: '4310', debit: 0, credit: finalAmount, description: 'Pendapatan Seblak Prasmanan' },
    ];

    if (totalHPP > 0) {
      journalLines.push(
        // HPP Seblak
        { accountCode: '5200', debit: totalHPP, credit: 0, description: 'HPP Bahan Seblak Prasmanan' },
        // Persediaan Seblak
        { accountCode: '1420', debit: 0, credit: totalHPP, description: 'Pengurangan Persediaan Bahan Seblak' }
      );
    }

    const desc = `Seblak Prasmanan: ${toppingNames.join(', ')}`;
    const accountRecords = await Promise.all(
      journalLines.map(async (line) => {
        const acc = await tx.account.findUnique({ where: { code: line.accountCode } });
        if (!acc) throw new Error(`Akun ${line.accountCode} tidak ditemukan`);
        return { ...line, accountId: acc.id };
      })
    );

    const transaction = await tx.transaction.create({
      data: {
        date: new Date(),
        description: desc,
        type: 'SALE',
        source,
        businessLineId: seblakBL.id,
        transactionLines: {
          create: accountRecords.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        },
      },
    });

    return transaction;
  });
}

/**
 * 3. Catat Pembelian / Pengadaan (Bahan Baku / Perlengkapan / Aset)
 */
export async function createPurchaseJournal(data: PurchaseFormData, source: 'WEB' | 'WHATSAPP' = 'WEB') {
  return prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      for (const item of data.items) {
        totalAmount += Number(item.price) * Number(item.quantity);
      }
    }
    if (totalAmount === 0 && ((data as any).amount || (data as any).totalAmount)) {
      totalAmount = Number((data as any).amount || (data as any).totalAmount);
    }

    let businessLine = null;
    if (data.businessLineId && !isNaN(Number(data.businessLineId))) {
      businessLine = await tx.businessLine.findUnique({ where: { id: Number(data.businessLineId) } });
    }
    if (!businessLine && (data as any).businessLine) {
      const blNameOrCode = String((data as any).businessLine).trim();
      businessLine = await tx.businessLine.findFirst({
        where: {
          OR: [
            { name: { contains: blNameOrCode } },
            { code: { contains: blNameOrCode.toUpperCase() } },
          ],
        },
      });
    }

    const cat = String(data.category || 'INVENTORY').toUpperCase();
    let targetAccountCode = '1410'; // default persediaan warkop
    if (cat === 'INVENTORY' || cat === 'BAHAN_BAKU') {
      if (businessLine?.code === 'SEBLAK') targetAccountCode = '1420';
      else if (businessLine?.code === 'RENTAL_PS') targetAccountCode = '1430';
      else targetAccountCode = '1410';
    } else if (cat === 'SUPPLY' || cat === 'PERLENGKAPAN') {
      if (businessLine?.code === 'SEBLAK') targetAccountCode = '1520';
      else if (businessLine?.code === 'RENTAL_PS') targetAccountCode = '1530';
      else if (businessLine?.code === 'WARKOP') targetAccountCode = '1510';
      else targetAccountCode = '1540';
    } else if (cat === 'ASSET' || cat === 'ASET') {
      if (businessLine?.code === 'SEBLAK') targetAccountCode = '1630';
      else if (businessLine?.code === 'RENTAL_PS') targetAccountCode = '1620';
      else if (businessLine?.code === 'WARKOP') targetAccountCode = '1610';
      else targetAccountCode = '1640';
    }

    // Payment source: Kas, Bank, or Utang (Credit)
    const pMethod = String(data.paymentMethod || 'CASH').toUpperCase();
    let creditAccountCode = (pMethod === 'BANK' || pMethod === 'TRANSFER' || pMethod === 'QRIS') ? '1200' : '1100';
    if (data.isCredit) {
      creditAccountCode = '2100'; // Utang Usaha
    }

    const itemDescriptions = data.items && data.items.length > 0
      ? data.items.map((i) => `${i.name} (${i.quantity} ${i.unit || 'unit'})`).join(', ')
      : ((data as any).description || 'Pengadaan barang operasional');
    const desc = `Pembelian ${cat}: ${itemDescriptions}`;

    const journalLines = [
      { accountCode: targetAccountCode, debit: totalAmount, credit: 0, description: desc },
      { accountCode: creditAccountCode, debit: 0, credit: totalAmount, description: `Pembayaran ${desc}` },
    ];

    const accountRecords = await Promise.all(
      journalLines.map(async (line) => {
        const acc = await tx.account.findUnique({ where: { code: line.accountCode } });
        if (!acc) throw new Error(`Akun ${line.accountCode} tidak ditemukan`);
        return { ...line, accountId: acc.id };
      })
    );

    const transaction = await tx.transaction.create({
      data: {
        date: new Date(),
        description: desc,
        type: 'PURCHASE',
        source,
        businessLineId: data.businessLineId || null,
        transactionLines: {
          create: accountRecords.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        },
      },
    });

    // If Credit, create a Payable record
    if (data.isCredit) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Default 30 days due
      await tx.payable.create({
        data: {
          type: 'PAYABLE',
          contactName: data.supplierName || 'Supplier',
          description: desc,
          amount: totalAmount,
          paidAmount: 0,
          dueDate,
          status: 'UNPAID',
          transactionId: transaction.id,
          businessLineId: data.businessLineId || null,
        },
      });
    }

    // Update inventory quantity if applicable
    if (data.category === 'INVENTORY' && data.businessLineId) {
      for (const item of data.items) {
        const inv = await tx.inventory.findFirst({
          where: { product: { name: item.name }, businessLineId: data.businessLineId },
        });

        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              quantity: { increment: item.quantity },
              costPrice: item.price,
            },
          });

          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              transactionId: transaction.id,
              type: 'IN',
              quantity: item.quantity,
              costPrice: item.price,
              description: `Pembelian stok: ${item.name}`,
              date: new Date(),
            },
          });
        }
      }
    }

    return transaction;
  });
}

/**
 * 4. Catat Pengeluaran Operasional (Beban Listrik, Gaji, Sewa, dll)
 */
export async function createExpenseJournal(data: ExpenseFormData, source: 'WEB' | 'WHATSAPP' = 'WEB') {
  return prisma.$transaction(async (tx) => {
    const pMethod = String(data.paymentMethod || 'CASH').toUpperCase();
    const paymentAccountCode = (pMethod === 'BANK' || pMethod === 'TRANSFER' || pMethod === 'QRIS') ? '1200' : '1100';

    let code = data.accountCode ? String(data.accountCode).trim() : '';
    if (!code || code === 'undefined' || code === 'null') {
      const d = (data.description || '').toLowerCase();
      if (d.includes('listrik') || d.includes('token') || d.includes('pln')) code = '6930';
      else if (d.includes('gaji') || d.includes('upah') || d.includes('karyawan')) code = '6910';
      else if (d.includes('sewa') || d.includes('lapak') || d.includes('ruko')) code = '6920';
      else if (d.includes('wifi') || d.includes('internet') || d.includes('kuota') || d.includes('indihome')) code = '6950';
      else if (d.includes('bersih') || d.includes('sampah') || d.includes('keamanan')) code = '6960';
      else if (d.includes('air') || d.includes('pdam')) code = '6940';
      else if (d.includes('gas') || d.includes('lpg')) code = '6330';
      else if (d.includes('pajak')) code = '6970';
      else code = '6990'; // Beban Lain-lain
    }

    // Verify account exists in DB, fallback to 6990 if not found
    let accRecord = await tx.account.findUnique({ where: { code } });
    if (!accRecord) {
      code = '6990';
      accRecord = await tx.account.findUnique({ where: { code: '6990' } });
    }
    if (!accRecord) {
      // Last resort: find any EXPENSE account
      accRecord = await tx.account.findFirst({ where: { type: 'EXPENSE' } });
    }
    if (!accRecord) throw new Error('Akun beban tidak ditemukan dalam sistem COA');

    const journalLines = [
      { accountCode: accRecord.code, debit: Number(data.amount), credit: 0, description: data.description },
      { accountCode: paymentAccountCode, debit: 0, credit: Number(data.amount), description: `Kas/Bank: ${data.description}` },
    ];

    const accountRecords = await Promise.all(
      journalLines.map(async (line) => {
        const acc = await tx.account.findUnique({ where: { code: line.accountCode } });
        if (!acc) throw new Error(`Akun ${line.accountCode} tidak ditemukan`);
        return { ...line, accountId: acc.id };
      })
    );

    const transaction = await tx.transaction.create({
      data: {
        date: new Date(),
        description: data.description,
        type: 'EXPENSE',
        source,
        businessLineId: data.businessLineId || null,
        transactionLines: {
          create: accountRecords.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        },
      },
    });

    return transaction;
  });
}

/**
 * 5. Catat Kerugian Waste / Basi Seblak Prasmanan
 */
export async function createWasteJournal(data: WasteFormData, source: 'WEB' | 'WHATSAPP' = 'WEB') {
  return prisma.$transaction(async (tx) => {
    let totalLoss = 0;
    const wasteItemsSummary: any[] = [];

    for (const item of data.items) {
      const inv = await tx.inventory.findUnique({
        where: { id: item.inventoryId },
        include: { product: true },
      });
      if (!inv) continue;

      const cost = Number(item.estimatedCost || inv.costPrice) * item.quantity;
      totalLoss += cost;

      wasteItemsSummary.push({
        name: inv.product?.name || 'Bahan',
        quantity: item.quantity,
        unit: inv.unit,
        estimatedCost: cost,
      });

      // Reduce inventory
      await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: { decrement: item.quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryId: inv.id,
          type: 'WASTE',
          quantity: item.quantity,
          costPrice: inv.costPrice,
          description: `Kerugian waste/basi: ${inv.product?.name}`,
          date: new Date(),
        },
      });
    }

    const desc = `Pencatatan Waste Seblak: ${data.notes || 'Bahan basi/rusak'}`;
    const journalLines = [
      { accountCode: '5250', debit: totalLoss, credit: 0, description: desc }, // Kerugian Waste Seblak
      { accountCode: '1420', debit: 0, credit: totalLoss, description: desc }, // Persediaan Seblak
    ];

    const accountRecords = await Promise.all(
      journalLines.map(async (line) => {
        const acc = await tx.account.findUnique({ where: { code: line.accountCode } });
        if (!acc) throw new Error(`Akun ${line.accountCode} tidak ditemukan`);
        return { ...line, accountId: acc.id };
      })
    );

    const transaction = await tx.transaction.create({
      data: {
        date: new Date(),
        description: desc,
        type: 'WASTE',
        source,
        businessLineId: data.businessLineId,
        transactionLines: {
          create: accountRecords.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        },
      },
    });

    await tx.wasteLog.create({
      data: {
        date: new Date(),
        businessLineId: data.businessLineId,
        transactionId: transaction.id,
        items: JSON.stringify(wasteItemsSummary),
        totalLoss,
        notes: data.notes || '',
      },
    });

    return transaction;
  });
}

/**
 * 6. Hitung & Catat Penyusutan Bulanan Aset Tetap
 */
export async function calculateDepreciation(assetId: number) {
  return prisma.$transaction(async (tx) => {
    const asset = await tx.fixedAsset.findUnique({
      where: { id: assetId },
      include: { businessLine: true },
    });
    if (!asset || !asset.isActive) throw new Error('Aset tetap tidak ditemukan atau non-aktif');

    // Straight line depreciation: (purchaseCost - salvageValue) / usefulLifeMonths
    const cost = Number(asset.purchaseCost);
    const salvage = Number(asset.salvageValue || 0);
    const months = asset.usefulLifeMonths || 12;
    const monthlyDepreciation = (cost - salvage) / months;

    let expenseCode = '6990';
    let accumCode = '1740';

    if (asset.businessLine?.code === 'WARKOP') {
      expenseCode = '6120';
      accumCode = '1710';
    } else if (asset.businessLine?.code === 'RENTAL_PS') {
      expenseCode = '6220';
      accumCode = '1720';
    } else if (asset.businessLine?.code === 'SEBLAK') {
      expenseCode = '6320';
      accumCode = '1730';
    }

    const desc = `Penyusutan Aset: ${asset.name}`;
    const journalLines = [
      { accountCode: expenseCode, debit: monthlyDepreciation, credit: 0, description: desc },
      { accountCode: accumCode, debit: 0, credit: monthlyDepreciation, description: desc },
    ];

    const accountRecords = await Promise.all(
      journalLines.map(async (line) => {
        const acc = await tx.account.findUnique({ where: { code: line.accountCode } });
        if (!acc) throw new Error(`Akun ${line.accountCode} tidak ditemukan`);
        return { ...line, accountId: acc.id };
      })
    );

    const transaction = await tx.transaction.create({
      data: {
        date: new Date(),
        description: desc,
        type: 'DEPRECIATION',
        source: 'SYSTEM',
        businessLineId: asset.businessLineId,
        transactionLines: {
          create: accountRecords.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        },
      },
    });

    const newAccum = Number(asset.accumulatedDepreciation || 0) + monthlyDepreciation;
    await tx.fixedAsset.update({
      where: { id: asset.id },
      data: { accumulatedDepreciation: newAccum },
    });

    await tx.depreciation.create({
      data: {
        fixedAssetId: asset.id,
        transactionId: transaction.id,
        date: new Date(),
        amount: monthlyDepreciation,
        accumulatedTotal: newAccum,
      },
    });

    return transaction;
  });
}
