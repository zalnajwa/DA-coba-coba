import Link from 'next/link'
import { getTransactions } from '@/actions/transactions'
import { Badge, Card, EmptyState } from '@/components/ui'

export default async function TransaksiPage() {
  const transactions = await getTransactions()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daftar seluruh transaksi keuangan yang telah dibukukan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/kasir"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-maroon-900 text-white font-semibold text-xs hover:bg-maroon-800 transition-colors shadow-sm"
          >
            🧾 Buka Kasir
          </Link>
          <Link
            href="/transaksi/penjualan"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
          >
            💰 + Penjualan
          </Link>
          <Link
            href="/transaksi/pembelian"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
          >
            🛒 + Pembelian
          </Link>
          <Link
            href="/transaksi/pengeluaran"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
          >
            💸 + Pengeluaran
          </Link>
        </div>
      </div>

      <Card noPadding>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Keterangan</th>
                  <th className="px-5 py-3.5">Tipe</th>
                  <th className="px-5 py-3.5">Lini Bisnis</th>
                  <th className="px-5 py-3.5 text-right">Debit (Masuk)</th>
                  <th className="px-5 py-3.5 text-right">Kredit (Keluar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-600 font-medium">
                      {new Date(t.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-xs truncate">
                      {t.description}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge variant={t.type === 'SALE' ? 'success' : t.type === 'PURCHASE' ? 'maroon' : 'warning'}>
                        {t.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-600">
                      {t.businessLine?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-semibold text-emerald-600">
                      {t.amountDebit ? `Rp ${t.amountDebit.toLocaleString('id-ID')}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-semibold text-red-600">
                      {t.amountCredit ? `Rp ${t.amountCredit.toLocaleString('id-ID')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="📋"
            title="Belum Ada Transaksi"
            description="Mulai catat transaksi penjualan, pembelian, atau gunakan Kasir POS untuk bertransaksi."
            action={
              <Link
                href="/kasir"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-maroon-900 text-white font-semibold text-xs hover:bg-maroon-800 transition-colors"
              >
                🧾 Buka Kasir POS
              </Link>
            }
          />
        )}
      </Card>
    </div>
  )
}
