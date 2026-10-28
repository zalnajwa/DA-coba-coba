import { GoogleGenAI } from '@google/genai';

export interface DiscoveredModel {
  name: string;
  displayName: string;
  version: number;
  score: number;
  supportedActions: string[];
}

let cachedModelNames: string[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // Cache selama 1 jam

/**
 * Ekstrak versi numerik dari nama model secara dinamis
 * Contoh: 'gemini-3.8-flash' -> 3.8, 'gemini-4.0-flash' -> 4.0
 */
function extractVersion(name: string): number {
  const match = name.match(/gemini-(\d+(?:\.\d+)?)/i);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Menghitung skor kualitas/relevansi model untuk tugas chat & parsing UMKM
 */
function scoreModel(name: string, supportedActions: string[]): number {
  const clean = name.replace(/^models\//, '').toLowerCase();

  // Wajib mendukung generateContent
  if (supportedActions.length > 0 && !supportedActions.includes('generateContent')) {
    return -100;
  }

  // Saring model non-teks atau model eksperimental khusus
  const nonGeneralKeywords = [
    'image', 'tts', 'transcribe', 'live', 'robotics', 'computer-use',
    'lyria', 'veo', 'embedding', 'aqa', 'deep-research'
  ];
  if (nonGeneralKeywords.some((kw) => clean.includes(kw))) {
    return -50;
  }

  let score = 0;
  const version = extractVersion(clean);
  // Bobot versi dinamis: semakin tinggi versi (misal 3.8 > 3.5 > 2.5 atau versi 4.x di masa depan), skor semakin tinggi
  score += version * 100;

  // Prioritaskan keluarga Flash untuk performa cepat dan hemat biaya UMKM
  if (clean.includes('flash') && !clean.includes('lite')) {
    score += 50;
  } else if (clean.includes('flash-lite')) {
    score += 30;
  } else if (clean.includes('pro')) {
    score += 20;
  }

  // Berikan prioritas pada model rilis umum dibandingkan preview dengan versi sama
  if (clean.includes('preview')) {
    score -= 10;
  }

  // Model dengan alias "latest"
  if (clean.includes('flash-latest')) {
    score += 45;
  } else if (clean.includes('pro-latest')) {
    score += 15;
  }

  return score;
}

/**
 * Bersihkan cache model jika terjadi perubahan atau error versi lama
 */
export function invalidateModelCache(): void {
  cachedModelNames = null;
  lastFetchTime = 0;
}

/**
 * Mengambil dan mengurutkan seluruh model Gemini yang aktif langsung dari Google API
 */
export async function discoverAvailableGeminiModels(apiKey: string, forceRefresh: boolean = false): Promise<string[]> {
  const now = Date.now();
  if (!forceRefresh && cachedModelNames && cachedModelNames.length > 0 && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedModelNames;
  }

  if (!apiKey) {
    return ['gemini-flash-latest', 'gemini-pro-latest'];
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.list();
    const discovered: DiscoveredModel[] = [];

    for await (const m of response) {
      const cleanName = m.name ? m.name.replace(/^models\//, '') : '';
      const actions = (m as any).supportedActions || (m as any).supportedGenerationMethods || [];
      const score = scoreModel(cleanName, actions);

      if (score > 0) {
        discovered.push({
          name: cleanName,
          displayName: m.displayName || cleanName,
          version: extractVersion(cleanName),
          score,
          supportedActions: actions,
        });
      }
    }

    // Urutkan dari model terbaik / versi tertinggi ke terendah
    discovered.sort((a, b) => b.score - a.score);
    const sortedNames = discovered.map((d) => d.name);

    if (sortedNames.length > 0) {
      cachedModelNames = sortedNames;
      lastFetchTime = now;
      console.log(`[Gemini Model Resolver] Berhasil mendeteksi ${sortedNames.length} model aktif dari Google API. Versi terbaru: ${sortedNames[0]}`);
      return sortedNames;
    }
  } catch (error) {
    console.warn('[Gemini Model Resolver] Gagal mengambil daftar model langsung dari API, menggunakan fallback terurut:', error);
  }

  // Fallback aman jika panggilan API listModels gagal
  const fallback = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
  ];
  cachedModelNames = fallback;
  lastFetchTime = now;
  return fallback;
}

/**
 * Mendapatkan daftar cascade model yang siap dicoba secara berjenjang
 */
export async function getGeminiModelCascade(apiKey: string): Promise<string[]> {
  const discovered = await discoverAvailableGeminiModels(apiKey);
  const envModel = process.env.GEMINI_MODEL?.trim();

  // Jika user menyetel variabel lingkungan tertentu, letakkan di depan, lalu gabungkan dengan hasil auto-discovery
  const combined = [
    ...(envModel ? [envModel] : []),
    ...discovered,
  ];

  return Array.from(new Set(combined));
}

/**
 * Menjalankan operasi Google Gemini dengan sistem auto-linking model berjenjang.
 * Jika suatu model mengalami 404 (deprecated/tidak ada) atau 503 (server Google sibuk),
 * sistem otomatis mencoba model versi berikutnya dari hasil auto-discovery.
 */
export async function executeWithAutoModel<T>(
  apiKey: string,
  operation: (modelName: string, client: GoogleGenAI) => Promise<T>
): Promise<{ result: T; usedModel: string }> {
  const models = await getGeminiModelCascade(apiKey);
  const client = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of models) {
    try {
      const result = await operation(model, client);
      return { result, usedModel: model };
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || (err?.error && err.error.code);
      const msg = err?.message || String(err);

      // Jika model 404 / tidak ditemukan, bersihkan cache agar sistem re-query ke Google API
      if (status === 404 || status === 'NOT_FOUND' || msg.includes('not found') || msg.includes('not supported')) {
        console.warn(`[Gemini Model Resolver] Model '${model}' sudah tidak didukung/ditemukan (404). Mengganti ke model berikutnya...`);
        invalidateModelCache();
      } else {
        console.warn(`[Gemini Model Resolver] Model '${model}' mengalami kendala (${status || msg}). Mencoba alternatif berikutnya...`);
      }
    }
  }

  throw lastError || new Error('Semua model Gemini yang tersedia gagal dihubungi.');
}
