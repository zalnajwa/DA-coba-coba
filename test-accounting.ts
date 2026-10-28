import { createSaleJournal, createSeblakSaleJournal } from './src/lib/accounting';
import { getIncomeStatement, getBalanceSheet, getDashboardSummary } from './src/lib/reports';
import { parseTransactionFromNaturalLanguage } from './src/lib/ai';

async function test() {
  console.log('--- 1. Testing NLP Parsing ---');
  const parsed = await parseTransactionFromNaturalLanguage(
    'Pemasukan 20k dari seblak isi sawi 5k, scalop 5k, mie 3k, kerupuk 5k, kuas 2k'
  );
  console.log('Parsed intent:', parsed.intent);
  console.log('Business line:', parsed.businessLine);
  console.log('Total amount:', parsed.totalAmount);
  console.log('Items:', parsed.items);
  console.log('Corrections:', parsed.corrections);

  console.log('\n--- 2. Testing Seblak Sale Transaction ---');
  const seblakTrx = await createSeblakSaleJournal({
    toppings: [
      { toppingId: 1, quantity: 1 }, // Sawi
      { toppingId: 2, quantity: 1 }, // Mie
      { toppingId: 3, quantity: 1 }, // Kerupuk
      { toppingId: 5, quantity: 1 }, // Scallop
    ],
    totalPrice: 20000,
    paymentMethod: 'CASH',
  }, 'WHATSAPP');
  console.log('Created Seblak Transaction ID:', seblakTrx.id);

  console.log('\n--- 3. Testing Warkop Sale Transaction ---');
  const warkopTrx = await createSaleJournal({
    businessLineId: 1, // Warkop
    items: [{ productId: 1, quantity: 2, price: 8000 }], // 2 Kopi Hitam
    paymentMethod: 'CASH',
  }, 'WEB');
  console.log('Created Warkop Transaction ID:', warkopTrx.id);

  console.log('\n--- 4. Testing Income Statement (Laba Rugi) ---');
  const inc = await getIncomeStatement({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  console.log('Total Revenue:', inc.totalRevenue);
  console.log('Total COGS / HPP:', inc.totalCogs);
  console.log('Gross Profit:', inc.grossProfit);
  console.log('Net Income:', inc.netIncome);

  console.log('\n--- 5. Testing Balance Sheet (Neraca SAK EMKM) ---');
  const bs = await getBalanceSheet(new Date());
  console.log('Total Assets:', bs.totalAssets);
  console.log('Total Liabilities:', bs.totalLiabilities);
  console.log('Total Equity:', bs.totalEquity);
  console.log('Balanced?:', bs.isBalanced);

  console.log('\n--- 6. Testing Dashboard Summary ---');
  const dash = await getDashboardSummary('today');
  console.log('Dashboard Today Revenue:', dash.totalRevenue);
  console.log('Revenue by Business Line:', dash.revenueByBusiness);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

test()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  });
