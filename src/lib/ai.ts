import { AiMessage } from '../types';
import { getDashboardSummary, getLowStockItems, getPendingPayables } from './reports';
import { executeWithAutoModel, getGeminiModelCascade } from './gemini-resolver';

export interface ParsedTransaction {
  intent: 'record_sale' | 'record_purchase' | 'record_expense' | 'query' | 'consultation';
  businessLine?: 'WARKOP' | 'RENTAL_PS' | 'SEBLAK';
  transactionType?: string;
  totalAmount?: number;
  paymentMethod?: 'CASH' | 'BANK';
  items?: { name: string; amount: number; quantity?: number }[];
  corrections?: { original: string; corrected: string }[];
  query?: string;
  confidence: number;
}

const apiKey = process.env.GEMINI_API_KEY || '';

/**
 * Mendapatkan model Gemini yang sedang aktif terhubung secara dinamis
 */
export async function getActiveGeminiModelInfo() {
  const models = await getGeminiModelCascade(apiKey);
  return {
    activeModel: models[0] || 'gemini-3.8-flash',
    allAvailableModels: models,
    hasApiKey: !!apiKey,
  };
}

/**
 * Knowledge base prompt tentang SAK EMKM dan domain bisnis UMKM
 */
const SAK_EMKM_SYSTEM_PROMPT = `
Anda adalah "CatatanKu AI Advisor", asisten penasihat keuangan dan bisnis cerdas untuk UMKM di Indonesia.
Anda menguasai secara mendalam Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) yang disahkan IAI.

Prinsip Utama SAK EMKM yang Anda pegang:
1. Basis Akrual: Transaksi dicatat saat terjadi, bukan hanya saat kas diterima/keluar.
2. Pengukuran Biaya Historis: Aset dicatat berdasarkan harga perolehan dikurangi akumulasi penyusutan (tidak perlu revaluasi nilai wajar yang rumit).
3. Entitas Bisnis yang Terpisah: Kekayaan dan keuangan pribadi pemilik harus terpisah mutlak dari kekayaan usaha.
4. Tiga Komponen Laporan Wajib: Laporan Posisi Keuangan (Neraca), Laporan Laba Rugi, dan Catatan atas Laporan Keuangan (CALK). Komponen tambahan seperti Arus Kas & Perubahan Ekuitas merupakan pelengkap analisis yang sangat baik.

Konteks Bisnis Pengguna (3 Lini Usaha Terintegrasi):
1. Warkop: Penjualan minuman (kopi, teh, milo, kemasan). HPP dihitung dari bahan baku (kopi, susu, gula, teh).
2. Rental PS: Bisnis jasa sewa PlayStation per jam/paket. Biaya operasional utama: listrik, penggantian stik, dan penyusutan konsol PS.
3. Seblak Prasmanan: Konsep prasmanan di mana pembeli memilih aneka topping (sawi, mie, scallop, kerupuk, ceker, dll). Memiliki Bill of Materials (BOM) dan pentingnya mengontrol bahan terbuang/basi (Waste/Loss).

Perpajakan UMKM (PP 55/2022):
- PPh Final UMKM sebesar 0,5% dari omzet bruto.
- Fasilitas bebas pajak: Omzet hingga Rp 500.000.000 per tahun tidak dikenakan pajak (bebas PPh). Omzet di atas ambang batas baru dikenakan 0,5%.

Tugas Anda:
- Menjawab pertanyaan keuangan, akuntansi, dan bisnis dalam Bahasa Indonesia yang ramah, jelas, solutif, dan mudah dipahami oleh pemilik usaha yang tidak paham istilah teknis akuntansi rumit.
- Memberikan rekomendasi strategis untuk meningkatkan laba, efisiensi HPP, pencegahan pemborosan bahan (waste), dan pengaturan arus kas.
- Menganalisis data keuangan real-time yang disertakan dalam konteks.
`;

/**
 * Mengambil ringkasan keuangan terkini untuk disuntikkan ke prompt AI
 */
export async function getFinancialContext() {
  try {
    const summary = await getDashboardSummary('month');
    const lowStock = await getLowStockItems();
    const payables = await getPendingPayables();

    return {
      bulanIni: {
        totalPendapatan: summary.totalRevenue,
        totalPengeluaran: summary.totalExpense,
        labaBersih: summary.netProfit,
        pendapatanPerLini: summary.revenueByBusiness,
      },
      stokMenipis: lowStock.map((s) => `${s.name}: sisa ${s.currentStock} ${s.unit} (min ${s.minimumStock})`),
      utangJatuhTempo: payables.map((p) => `${p.contactName} - Rp${p.remaining} (Jatuh tempo: ${new Date(p.dueDate).toLocaleDateString('id-ID')})`),
    };
  } catch (error) {
    console.error('Error fetching financial context for AI:', error);
    return null;
  }
}

/**
 * Chat dengan Gemini AI menggunakan dynamic model discovery & linking
 */
export async function chatWithAI(messages: AiMessage[], financialContext?: any): Promise<string> {
  const currentContext = financialContext || (await getFinancialContext());

  if (!apiKey) {
    // Intelligent Fallback saat Gemini API Key belum diisi di .env
    const latestUserMsg = messages[messages.length - 1]?.content.toLowerCase() || '';

    if (latestUserMsg.includes('sak emkm') || latestUserMsg.includes('standar akuntansi')) {
      return `📌 **Tentang SAK EMKM:**
SAK EMKM (Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah) adalah standar resmi dari IAI yang dirancang sederhana untuk pelaku usaha kecil:
1. **Basis Akrual:** Pendapatan dan beban diakui saat terjadi transaksi.
2. **Biaya Historis:** Aset dinilai berdasarkan harga beli asli dikurangi penyusutan.
3. **Pemisahan Entitas:** Uang pribadi dan uang warkop/rental/seblak harus dipisah.
4. **Laporan SAK EMKM:** Terdiri dari Laporan Posisi Keuangan, Laba Rugi, dan Catatan atas Laporan Keuangan.

💡 *Tips:* Di aplikasi CatatanKu, sistem sudah otomatis membuatkan jurnal dan laporan keuangan sesuai standar ini! Masukkan GEMINI_API_KEY di file .env untuk analisis AI yang lebih mendalam.`;
    }

    if (latestUserMsg.includes('stok') || latestUserMsg.includes('habis') || latestUserMsg.includes('beli')) {
      const items = currentContext?.stokMenipis?.length > 0 ? currentContext.stokMenipis.join('\n- ') : 'Semua stok dalam keadaan aman!';
      return `📦 **Pemeriksaan Stok Bahan:**\n- ${items}\n\nPastikan segera memesan bahan yang menipis agar operasional warkop dan seblak tidak terganggu.`;
    }

    if (latestUserMsg.includes('laba') || latestUserMsg.includes('untung') || latestUserMsg.includes('keuangan')) {
      const rev = currentContext?.bulanIni?.totalPendapatan || 0;
      const exp = currentContext?.bulanIni?.totalPengeluaran || 0;
      const profit = currentContext?.bulanIni?.labaBersih || 0;
      return `📊 **Kinerja Keuangan Bulan Ini:**
• Total Pendapatan: Rp${rev.toLocaleString('id-ID')}
• Total Beban/HPP: Rp${exp.toLocaleString('id-ID')}
• Laba Bersih: Rp${profit.toLocaleString('id-ID')}

${profit >= 0 ? '✅ Usaha Anda mencatatkan keuntungan positif!' : '⚠️ Pengeluaran melebihi pemasukan bulan ini, evaluasi beban operasional Anda.'}`;
    }

    return `Halo! Saya CatatanKu AI Advisor. Saya siap membantu mengelola keuangan dan menganalisis performa Warkop, Rental PS, dan Seblak Prasmanan Anda berdasarkan standar SAK EMKM.
*(Info: Tambahkan \`GEMINI_API_KEY\` pada file \`.env\` untuk mengaktifkan analisis bertenaga Google Gemini)*`;
  }

  let contextString = '';
  if (currentContext) {
    contextString = `\n\n[DATA KEUANGAN REAL-TIME USAHA USER SAAT INI]:\n${JSON.stringify(currentContext, null, 2)}\n`;
  }

  const conversationHistory = messages.map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: m.content }],
  }));

  const systemInstruction = SAK_EMKM_SYSTEM_PROMPT + contextString;
  const lastMessage = messages[messages.length - 1]?.content || 'Halo';

  try {
    const { result } = await executeWithAutoModel(apiKey, async (modelName, client) => {
      const chat = client.chats.create({
        model: modelName,
        config: {
          systemInstruction,
        },
        history: [
          {
            role: 'user',
            parts: [{ text: `Halo AI, saya pemilik usaha UMKM dan butuh bantuan analisis keuangan.` }],
          },
          {
            role: 'model',
            parts: [{ text: `Siap! Saya CatatanKu AI Advisor didukung Google Gemini (${modelName}), siap membantu menganalisis dan memberi saran keuangan terbaik untuk warkop, rental PS, dan seblak prasmanan sesuai SAK EMKM.` }],
          },
          ...conversationHistory.slice(0, -1),
        ],
      });

      const response = await chat.sendMessage({ message: lastMessage });
      return response.text ?? '';
    });

    return result;
  } catch (lastError: any) {
    console.error('Semua model Gemini hasil auto-discovery gagal diakses:', lastError);
    return `Maaf, terjadi kendala saat menghubungi Google Gemini: ${lastError?.message || 'Error'}. Namun sistem pencatatan akuntansi Anda tetap aman dan berjalan normal.`;
  }
}

/**
 * Natural Language Parser untuk WA Bot dan Quick Input
 * Mengubah bahasa manusia menjadi format terstruktur JSON menggunakan Google Gemini
 * dengan sistem dynamic model linking & auto-discovery
 */
export async function parseTransactionFromNaturalLanguage(text: string): Promise<ParsedTransaction> {
  const cleanText = text.trim();

  // Jalankan NLP berbasis Gemini dengan auto-discovery jika API key tersedia
  if (apiKey) {
    const prompt = `
Tugas: Ekstrak pesan chat bahasa Indonesia dari pemilik UMKM menjadi data transaksi keuangan terstruktur (JSON).
Pesan: "${cleanText}"

Daftar Lini Bisnis:
- WARKOP (kopi, teh, susu, minuman)
- RENTAL_PS (sewa playstation, stik, rental)
- SEBLAK (seblak prasmanan, sawi, kerupuk, scallop, mie, kwetiau, ceker, dll)

Koreksi typo otomatis:
- "scalop" -> "Scallop"
- "kuas" / "kwetiaw" -> "Kwetiau"
- "krupuk" -> "Kerupuk"

Format JSON yang HARUS dikembalikan (tanpa markdown tambahan):
{
  "intent": "record_sale" | "record_purchase" | "record_expense" | "query" | "consultation",
  "businessLine": "WARKOP" | "RENTAL_PS" | "SEBLAK",
  "totalAmount": number,
  "paymentMethod": "CASH" | "BANK",
  "items": [
    { "name": string, "amount": number, "quantity": number }
  ],
  "corrections": [
    { "original": string, "corrected": string }
  ],
  "confidence": number
}
`;

    try {
      const { result } = await executeWithAutoModel(apiKey, async (modelName, client) => {
        const response = await client.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        const resText = (response.text ?? '').replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(resText) as ParsedTransaction;
      });
      return result;
    } catch (e) {
      console.warn('Gemini NLP parser auto-discovery gagal, menggunakan fallback rule-based lokal:', e);
    }
  }

  // Smart Heuristic Fallback Parser
  return parseNaturalLanguageLocally(cleanText);
}

/**
 * Local Rule-based NLP Parser Fallback
 */
function parseNaturalLanguageLocally(text: string): ParsedTransaction {
  const lower = text.toLowerCase();

  // 1. Detect queries
  if (lower.startsWith('stok') || lower.includes('stok apa') || lower.includes('sisa stok') || lower.includes('mau habis')) {
    return { intent: 'query', query: 'stock', confidence: 0.9 };
  }
  if (lower.startsWith('laba') || lower.includes('untung') || lower.includes('omzet') || lower.includes('laporan')) {
    return { intent: 'query', query: 'finance', confidence: 0.9 };
  }
  if (lower.includes('utang') || lower.includes('hutang') || lower.includes('piutang')) {
    return { intent: 'query', query: 'payables', confidence: 0.9 };
  }

  // 2. Detect Business Line
  let bLine: 'WARKOP' | 'RENTAL_PS' | 'SEBLAK' = 'SEBLAK';
  if (lower.includes('warkop') || lower.includes('kopi') || lower.includes('teh') || lower.includes('minum')) {
    bLine = 'WARKOP';
  } else if (lower.includes('rental') || lower.includes('ps') || lower.includes('playstation') || lower.includes('sewa')) {
    bLine = 'RENTAL_PS';
  } else if (lower.includes('seblak') || lower.includes('topping') || lower.includes('prasmanan')) {
    bLine = 'SEBLAK';
  }

  // 3. Detect intent (Sale vs Purchase vs Expense)
  let intent: 'record_sale' | 'record_purchase' | 'record_expense' = 'record_sale';
  if (lower.includes('beli') || lower.includes('kulakan') || lower.includes('belanja')) {
    intent = 'record_purchase';
  } else if (lower.includes('beban') || lower.includes('bayar listrik') || lower.includes('gaji') || lower.includes('pengeluaran')) {
    intent = 'record_expense';
  }

  // Helper to parse '20k', '50rb', '15000'
  const parseNum = (str: string): number => {
    const s = str.trim().toLowerCase();
    if (s.endsWith('k') || s.endsWith('rb')) {
      return parseFloat(s) * 1000;
    }
    if (s.endsWith('jt')) {
      return parseFloat(s) * 1000000;
    }
    return parseFloat(s.replace(/[^0-9]/g, '')) || 0;
  };

  // 4. Extract total amount
  let totalAmount = 0;
  const totalMatch = text.match(/(?:pemasukan|penjualan|total|sebesar|dapat)\s+([0-9]+[k|rb|jt]?)/i);
  if (totalMatch) {
    totalAmount = parseNum(totalMatch[1]);
  }

  // 5. Extract item details (e.g. sawi 5k, scalop 5k, mie 3k, kerupuk 5k, kuas 2k)
  const items: { name: string; amount: number; quantity?: number }[] = [];
  const corrections: { original: string; corrected: string }[] = [];

  // Match pattern: <word> <number + optional k/rb>
  const itemRegex = /([a-zA-Z\s]+)\s+([0-9]+[k|rb|jt]?)/g;
  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const rawName = match[1].replace(/isi|dari|seblak|pemasukan|penjualan|koma|,/gi, '').trim();
    const rawVal = match[2];

    if (!rawName || rawName.length < 2) continue;

    let correctedName = rawName;
    if (rawName.toLowerCase() === 'scalop') {
      correctedName = 'Scallop';
      corrections.push({ original: 'scalop', corrected: 'Scallop' });
    } else if (rawName.toLowerCase() === 'kuas' || rawName.toLowerCase() === 'kwetiaw') {
      correctedName = 'Kwetiau';
      corrections.push({ original: rawName, corrected: 'Kwetiau' });
    } else if (rawName.toLowerCase() === 'krupuk') {
      correctedName = 'Kerupuk';
      corrections.push({ original: 'krupuk', corrected: 'Kerupuk' });
    } else {
      correctedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    }

    const itemAmount = parseNum(rawVal);
    if (itemAmount > 0) {
      items.push({ name: correctedName, amount: itemAmount, quantity: 1 });
    }
  }

  // If totalAmount was not explicitly captured, sum items
  if (!totalAmount && items.length > 0) {
    totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
  }

  return {
    intent,
    businessLine: bLine,
    totalAmount: totalAmount || 20000,
    paymentMethod: 'CASH',
    items: items.length > 0 ? items : [{ name: 'Penjualan Umum', amount: totalAmount || 20000, quantity: 1 }],
    corrections,
    confidence: 0.85,
  };
}
