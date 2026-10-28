import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Business Lines
  const warkop = await prisma.businessLine.upsert({
    where: { code: 'WARKOP' },
    update: {},
    create: { code: 'WARKOP', name: 'Warkop', description: 'Kedai kopi dan aneka minuman' },
  });

  const rentalPs = await prisma.businessLine.upsert({
    where: { code: 'RENTAL_PS' },
    update: {},
    create: { code: 'RENTAL_PS', name: 'Rental PS', description: 'Rental PlayStation dan aksesoris' },
  });

  const seblak = await prisma.businessLine.upsert({
    where: { code: 'SEBLAK' },
    update: {},
    create: { code: 'SEBLAK', name: 'Seblak Prasmanan', description: 'Seblak prasmanan aneka isian dan topping' },
  });

  console.log('✓ Business lines seeded.');

  const bLineMap: Record<string, number> = {
    WARKOP: warkop.id,
    RENTAL_PS: rentalPs.id,
    SEBLAK: seblak.id,
  };

  // 2. Chart of Accounts (SAK EMKM - 4 Digit)
  const accountsData = [
    // ASSETS (1xxx)
    { code: '1100', name: 'Kas', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1200', name: 'Bank', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1250', name: 'Kas Kecil', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1300', name: 'Piutang Usaha', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1410', name: 'Persediaan - Warkop', type: 'ASSET', normalBalance: 'DEBIT', bLine: 'WARKOP' },
    { code: '1420', name: 'Persediaan - Seblak', type: 'ASSET', normalBalance: 'DEBIT', bLine: 'SEBLAK' },
    { code: '1430', name: 'Persediaan - Rental PS', type: 'ASSET', normalBalance: 'DEBIT', bLine: 'RENTAL_PS' },
    { code: '1510', name: 'Perlengkapan - Warkop', type: 'ASSET', normalBalance: 'DEBIT', bLine: 'WARKOP' },
    { code: '1520', name: 'Perlengkapan - Seblak', type: 'ASSET', normalBalance: 'DEBIT', bLine: 'SEBLAK' },
    { code: '1530', name: 'Perlengkapan - Rental PS', type: 'ASSET', normalBalance: 'DEBIT', bLine: 'RENTAL_PS' },
    { code: '1540', name: 'Perlengkapan - Umum', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1610', name: 'Peralatan - Warkop', type: 'ASSET', normalBalance: 'DEBIT', bLine: 'WARKOP' },
    { code: '1620', name: 'Peralatan - Rental PS', type: 'ASSET', normalBalance: 'DEBIT', bLine: 'RENTAL_PS' },
    { code: '1630', name: 'Peralatan - Seblak', type: 'ASSET', normalBalance: 'DEBIT', bLine: 'SEBLAK' },
    { code: '1640', name: 'Peralatan - Umum', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1710', name: 'Akum. Penyusutan - Warkop', type: 'ASSET', normalBalance: 'CREDIT', bLine: 'WARKOP' },
    { code: '1720', name: 'Akum. Penyusutan - Rental PS', type: 'ASSET', normalBalance: 'CREDIT', bLine: 'RENTAL_PS' },
    { code: '1730', name: 'Akum. Penyusutan - Seblak', type: 'ASSET', normalBalance: 'CREDIT', bLine: 'SEBLAK' },
    { code: '1740', name: 'Akum. Penyusutan - Umum', type: 'ASSET', normalBalance: 'CREDIT' },
    { code: '1800', name: 'Sewa Dibayar Di Muka', type: 'ASSET', normalBalance: 'DEBIT' },

    // LIABILITIES (2xxx)
    { code: '2100', name: 'Utang Usaha', type: 'LIABILITY', normalBalance: 'CREDIT' },
    { code: '2200', name: 'Utang Bank/Pinjaman', type: 'LIABILITY', normalBalance: 'CREDIT' },
    { code: '2300', name: 'Utang Pajak', type: 'LIABILITY', normalBalance: 'CREDIT' },
    { code: '2400', name: 'Utang Lain-lain', type: 'LIABILITY', normalBalance: 'CREDIT' },

    // EQUITY (3xxx)
    { code: '3100', name: 'Modal Pemilik', type: 'EQUITY', normalBalance: 'CREDIT' },
    { code: '3200', name: 'Prive / Penarikan Pemilik', type: 'EQUITY', normalBalance: 'DEBIT' },
    { code: '3300', name: 'Laba Ditahan', type: 'EQUITY', normalBalance: 'CREDIT' },
    { code: '3400', name: 'Laba Berjalan', type: 'EQUITY', normalBalance: 'CREDIT' },

    // REVENUE (4xxx)
    { code: '4110', name: 'Penjualan Kopi', type: 'REVENUE', normalBalance: 'CREDIT', bLine: 'WARKOP' },
    { code: '4120', name: 'Penjualan Teh', type: 'REVENUE', normalBalance: 'CREDIT', bLine: 'WARKOP' },
    { code: '4130', name: 'Penjualan Minuman Kemasan', type: 'REVENUE', normalBalance: 'CREDIT', bLine: 'WARKOP' },
    { code: '4140', name: 'Penjualan Lainnya - Warkop', type: 'REVENUE', normalBalance: 'CREDIT', bLine: 'WARKOP' },
    { code: '4210', name: 'Pendapatan Sewa PS', type: 'REVENUE', normalBalance: 'CREDIT', bLine: 'RENTAL_PS' },
    { code: '4310', name: 'Penjualan Seblak', type: 'REVENUE', normalBalance: 'CREDIT', bLine: 'SEBLAK' },
    { code: '4900', name: 'Pendapatan Lain-lain', type: 'REVENUE', normalBalance: 'CREDIT' },

    // COGS (5xxx)
    { code: '5100', name: 'HPP - Warkop', type: 'COGS', normalBalance: 'DEBIT', bLine: 'WARKOP' },
    { code: '5200', name: 'HPP - Seblak', type: 'COGS', normalBalance: 'DEBIT', bLine: 'SEBLAK' },
    { code: '5250', name: 'Kerugian Waste - Seblak', type: 'COGS', normalBalance: 'DEBIT', bLine: 'SEBLAK' },
    { code: '5300', name: 'HPP - Rental PS', type: 'COGS', normalBalance: 'DEBIT', bLine: 'RENTAL_PS' },

    // EXPENSES (6xxx)
    { code: '6110', name: 'Beban Perlengkapan - Warkop', type: 'EXPENSE', normalBalance: 'DEBIT', bLine: 'WARKOP' },
    { code: '6120', name: 'Beban Penyusutan - Warkop', type: 'EXPENSE', normalBalance: 'DEBIT', bLine: 'WARKOP' },
    { code: '6210', name: 'Beban Perlengkapan - Rental PS', type: 'EXPENSE', normalBalance: 'DEBIT', bLine: 'RENTAL_PS' },
    { code: '6220', name: 'Beban Penyusutan - Rental PS', type: 'EXPENSE', normalBalance: 'DEBIT', bLine: 'RENTAL_PS' },
    { code: '6230', name: 'Beban Listrik - Rental PS', type: 'EXPENSE', normalBalance: 'DEBIT', bLine: 'RENTAL_PS' },
    { code: '6310', name: 'Beban Perlengkapan - Seblak', type: 'EXPENSE', normalBalance: 'DEBIT', bLine: 'SEBLAK' },
    { code: '6320', name: 'Beban Penyusutan - Seblak', type: 'EXPENSE', normalBalance: 'DEBIT', bLine: 'SEBLAK' },
    { code: '6330', name: 'Beban Gas - Seblak', type: 'EXPENSE', normalBalance: 'DEBIT', bLine: 'SEBLAK' },
    { code: '6910', name: 'Beban Gaji Karyawan', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '6920', name: 'Beban Sewa Tempat', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '6930', name: 'Beban Listrik Umum', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '6940', name: 'Beban Air', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '6950', name: 'Beban Internet/WiFi', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '6960', name: 'Beban Kebersihan', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '6970', name: 'Beban Pajak - PPh Final', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '6980', name: 'Beban Diskon/Promo', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '6990', name: 'Beban Lain-lain', type: 'EXPENSE', normalBalance: 'DEBIT' },
  ];

  for (const acc of accountsData) {
    const businessLineId = acc.bLine ? bLineMap[acc.bLine] : null;
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {
        name: acc.name,
        type: acc.type,
        normalBalance: acc.normalBalance,
        businessLineId,
      },
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        normalBalance: acc.normalBalance,
        businessLineId,
      },
    });
  }
  console.log('✓ Chart of Accounts seeded.');

  // 3. Products
  const sampleProducts = [
    // Warkop
    { name: 'Kopi Hitam', sellingPrice: 8000, costPrice: 3000, unit: 'cangkir', bLine: 'WARKOP' },
    { name: 'Kopi Susu', sellingPrice: 12000, costPrice: 5000, unit: 'cangkir', bLine: 'WARKOP' },
    { name: 'Es Kopi Susu', sellingPrice: 15000, costPrice: 6000, unit: 'cup', bLine: 'WARKOP' },
    { name: 'Teh Manis', sellingPrice: 5000, costPrice: 1500, unit: 'gelas', bLine: 'WARKOP' },
    { name: 'Es Teh Manis', sellingPrice: 7000, costPrice: 2000, unit: 'cup', bLine: 'WARKOP' },
    { name: 'Cappuccino', sellingPrice: 18000, costPrice: 7000, unit: 'cup', bLine: 'WARKOP' },
    { name: 'Teh Tarik', sellingPrice: 10000, costPrice: 3500, unit: 'cangkir', bLine: 'WARKOP' },
    { name: 'Milo Panas/Dingin', sellingPrice: 12000, costPrice: 5000, unit: 'cup', bLine: 'WARKOP' },
    { name: 'Air Mineral Botol', sellingPrice: 4000, costPrice: 2500, unit: 'botol', bLine: 'WARKOP' },
    { name: 'Minuman Kemasan Kaleng', sellingPrice: 7000, costPrice: 4500, unit: 'kaleng', bLine: 'WARKOP' },

    // Rental PS
    { name: 'Sewa PS Per Jam', sellingPrice: 10000, costPrice: 3000, unit: 'jam', bLine: 'RENTAL_PS' },
    { name: 'Paket Sewa 3 Jam', sellingPrice: 25000, costPrice: 9000, unit: 'paket', bLine: 'RENTAL_PS' },
    { name: 'Paket Sewa 5 Jam', sellingPrice: 40000, costPrice: 15000, unit: 'paket', bLine: 'RENTAL_PS' },

    // Seblak Prasmanan
    { name: 'Seblak Prasmanan (Kustom)', sellingPrice: 15000, costPrice: 6000, unit: 'porsi', bLine: 'SEBLAK' },
    { name: 'Paket Seblak Lengkap', sellingPrice: 25000, costPrice: 11000, unit: 'porsi', bLine: 'SEBLAK' },
  ];

  const createdProducts: Record<string, any> = {};

  for (const prod of sampleProducts) {
    const bId = bLineMap[prod.bLine];
    let p = await prisma.product.findFirst({
      where: { name: prod.name, businessLineId: bId },
    });
    if (!p) {
      p = await prisma.product.create({
        data: {
          name: prod.name,
          businessLineId: bId,
          sellingPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
          unit: prod.unit,
        },
      });
    }
    createdProducts[prod.name] = p;
  }
  console.log('✓ Products seeded.');

  // 4. Inventories (Tied to products or raw ingredients)
  const rawIngredients = [
    // Warkop ingredients
    { name: 'Kopi Bubuk Robusta (kg)', bLine: 'WARKOP', qty: 5, unit: 'kg', min: 1, cost: 80000 },
    { name: 'Susu Kental Manis (kaleng)', bLine: 'WARKOP', qty: 24, unit: 'kaleng', min: 6, cost: 12000 },
    { name: 'Gula Pasir (kg)', bLine: 'WARKOP', qty: 15, unit: 'kg', min: 3, cost: 17000 },
    { name: 'Teh Celup (box)', bLine: 'WARKOP', qty: 10, unit: 'box', min: 2, cost: 8000 },
    // Seblak ingredients
    { name: 'Kerupuk Mentah Aneka', bLine: 'SEBLAK', qty: 15, unit: 'kg', min: 3, cost: 18000 },
    { name: 'Mie Kuning/Basah', bLine: 'SEBLAK', qty: 10, unit: 'kg', min: 2, cost: 12000 },
    { name: 'Kwetiau Basah', bLine: 'SEBLAK', qty: 8, unit: 'kg', min: 2, cost: 14000 },
    { name: 'Bumbu Dasar Seblak', bLine: 'SEBLAK', qty: 10, unit: 'kg', min: 2, cost: 35000 },
    { name: 'Sawi Hijau Segar', bLine: 'SEBLAK', qty: 12, unit: 'ikat', min: 3, cost: 3000 },
    { name: 'Scallop Ikan Olahan', bLine: 'SEBLAK', qty: 10, unit: 'pack', min: 2, cost: 22000 },
    { name: 'Bakso Sapi Olahan', bLine: 'SEBLAK', qty: 10, unit: 'pack', min: 2, cost: 25000 },
    { name: 'Sosis Sapi Olahan', bLine: 'SEBLAK', qty: 10, unit: 'pack', min: 2, cost: 20000 },
    { name: 'Telur Ayam', bLine: 'SEBLAK', qty: 60, unit: 'butir', min: 15, cost: 2000 },
    { name: 'Ceker Ayam Bersih', bLine: 'SEBLAK', qty: 8, unit: 'kg', min: 2, cost: 24000 },
    { name: 'Tulang Ayam Kaldu', bLine: 'SEBLAK', qty: 8, unit: 'kg', min: 2, cost: 18000 },
    // Rental PS items
    { name: 'Stik PS4 Wireless Cadangan', bLine: 'RENTAL_PS', qty: 4, unit: 'unit', min: 1, cost: 180000 },
  ];

  const inventoryMap: Record<string, any> = {};

  for (const item of rawIngredients) {
    const bId = bLineMap[item.bLine];
    // Create product representation for ingredient if not existing
    let prod = await prisma.product.findFirst({
      where: { name: item.name, businessLineId: bId },
    });
    if (!prod) {
      prod = await prisma.product.create({
        data: {
          name: item.name,
          businessLineId: bId,
          sellingPrice: item.cost * 1.3,
          costPrice: item.cost,
          unit: item.unit,
        },
      });
    }

    let inv = await prisma.inventory.findUnique({
      where: { productId: prod.id },
    });
    if (!inv) {
      inv = await prisma.inventory.create({
        data: {
          productId: prod.id,
          businessLineId: bId,
          quantity: item.qty,
          unit: item.unit,
          minimumStock: item.min,
          costPrice: item.cost,
        },
      });
    }
    inventoryMap[item.name] = inv;
  }
  console.log('✓ Inventories seeded.');

  // 5. Seblak Toppings
  const toppingsData = [
    { name: 'Sawi Hijau', sellingPrice: 2000, invName: 'Sawi Hijau Segar', qtyUsed: 0.25 },
    { name: 'Mie Kuning', sellingPrice: 3000, invName: 'Mie Kuning/Basah', qtyUsed: 0.1 },
    { name: 'Kerupuk', sellingPrice: 3000, invName: 'Kerupuk Mentah Aneka', qtyUsed: 0.1 },
    { name: 'Kwetiau', sellingPrice: 3000, invName: 'Kwetiau Basah', qtyUsed: 0.1 },
    { name: 'Scallop', sellingPrice: 5000, invName: 'Scallop Ikan Olahan', qtyUsed: 0.1 },
    { name: 'Bakso Sapi', sellingPrice: 4000, invName: 'Bakso Sapi Olahan', qtyUsed: 0.1 },
    { name: 'Sosis Sapi', sellingPrice: 4000, invName: 'Sosis Sapi Olahan', qtyUsed: 0.1 },
    { name: 'Telur Ayam', sellingPrice: 3000, invName: 'Telur Ayam', qtyUsed: 1 },
    { name: 'Ceker Ayam', sellingPrice: 5000, invName: 'Ceker Ayam Bersih', qtyUsed: 0.15 },
    { name: 'Tulang Kaldu', sellingPrice: 4000, invName: 'Tulang Ayam Kaldu', qtyUsed: 0.15 },
  ];

  for (const t of toppingsData) {
    let topping = await prisma.seblakTopping.findFirst({
      where: { name: t.name },
    });
    if (!topping) {
      topping = await prisma.seblakTopping.create({
        data: {
          name: t.name,
          sellingPrice: t.sellingPrice,
          isActive: true,
        },
      });
    }

    const inv = inventoryMap[t.invName];
    if (inv) {
      const existingBom = await prisma.seblakBOM.findFirst({
        where: { toppingId: topping.id, inventoryId: inv.id },
      });
      if (!existingBom) {
        await prisma.seblakBOM.create({
          data: {
            toppingId: topping.id,
            inventoryId: inv.id,
            quantityUsed: t.qtyUsed,
            unit: inv.unit,
          },
        });
      }
    }
  }
  console.log('✓ Seblak Toppings and BOM seeded.');

  // 6. Default Settings
  const defaultSettings = [
    { key: 'app_name', value: 'CatatanKu' },
    { key: 'currency', value: 'IDR' },
    { key: 'tax_rate', value: '0.005' },
    { key: 'tax_free_threshold', value: '500000000' },
    { key: 'fiscal_year_start', value: '01-01' },
    { key: 'backup_retention_days', value: '30' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log('✓ Settings seeded.');

  // 7. Default User Authentication (Default PIN: 1234)
  const defaultAuth = await prisma.userAuth.findFirst();
  if (!defaultAuth) {
    await prisma.userAuth.create({
      data: {
        pin: '1234',
      },
    });
    console.log('✓ Default PIN 1234 seeded.');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
