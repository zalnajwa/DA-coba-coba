import Link from 'next/link'
import { getDashboardData } from '@/actions/reports'
import { getLowStockItems } from '@/actions/inventory'
import { getDuePayables } from '@/actions/payables'
import { getCurrentShift } from '@/actions/shifts'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  const lowStock = await getLowStockItems()
  const payables = await getDuePayables()
  const shift = await getCurrentShift()

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const netPositive = data.netIncomeToday >= 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Selamat Datang! 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        {shift && (
          <div className="flex items-center gap-2 bg-maroon-50 border border-maroon-100 text-maroon-800 text-xs font-semibold px-3 py-2 rounded-xl">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
            Shift Aktif — Dibuka {new Date(shift.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue — Maroon gradient */}
        <div className="bg-gradient-to-br from-maroon-900 via-maroon-800 to-maroon-900 rounded-2xl p-5 text-white shadow-lg animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-maroon-200 text-xs font-semibold uppercase tracking-wide">Pendapatan Hari Ini</p>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-base">💰</div>
          </div>
          <p className="text-2xl font-bold">{formatRupiah(data.totalRevenueToday)}</p>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Pengeluaran</p>
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-base">💸</div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatRupiah(data.totalExpensesToday)}</p>
        </div>

        {/* Net Income */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Laba Bersih</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${netPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {netPositive ? '📈' : '📉'}
            </div>
          </div>
          <p className={`text-2xl font-bold ${netPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatRupiah(data.netIncomeToday)}
          </p>
        </div>

        {/* Transaction count */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Jumlah Transaksi</p>
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-base">📋</div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.transactionCountToday}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up stagger-3">
        <Link href="/kasir" className="group bg-maroon-900 text-white p-4 rounded-2xl text-center hover:bg-maroon-800 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5">
          <span className="block text-2xl mb-1.5">🧾</span>
          <span className="text-sm font-semibold">Buka Kasir</span>
        </Link>
        <Link href="/transaksi/penjualan" className="group bg-white p-4 rounded-2xl text-center hover:bg-gray-50 transition-all border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5">
          <span className="block text-2xl mb-1.5">💰</span>
          <span className="text-sm font-semibold text-gray-800">Catat Penjualan</span>
        </Link>
        <Link href="/transaksi/pembelian" className="group bg-white p-4 rounded-2xl text-center hover:bg-gray-50 transition-all border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5">
          <span className="block text-2xl mb-1.5">🛒</span>
          <span className="text-sm font-semibold text-gray-800">Catat Pembelian</span>
        </Link>
        <Link href="/transaksi/pengeluaran" className="group bg-white p-4 rounded-2xl text-center hover:bg-gray-50 transition-all border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5">
          <span className="block text-2xl mb-1.5">💸</span>
          <span className="text-sm font-semibold text-gray-800">Catat Pengeluaran</span>
        </Link>
      </div>

      {/* Cards row — Low stock + Payables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in-up stagger-4">
        {/* Low stock */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📦</span>
              <h3 className="font-bold text-gray-900 text-sm">Peringatan Stok Menipis</h3>
            </div>
            <Link href="/persediaan" className="text-xs text-maroon-700 font-semibold hover:text-maroon-900 transition-colors">
              Lihat semua →
            </Link>
          </div>
          <div className="p-5">
            {lowStock.length > 0 ? (
              <ul className="space-y-3">
                {lowStock.slice(0, 5).map((item: any) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-sm">⚠️</div>
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                      {item.quantity} tersisa
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-sm text-gray-500 font-medium">Semua stok aman</p>
              </div>
            )}
          </div>
        </div>

        {/* Payables */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">💳</span>
              <h3 className="font-bold text-gray-900 text-sm">Tagihan Mendatang</h3>
            </div>
            <Link href="/utang-piutang" className="text-xs text-maroon-700 font-semibold hover:text-maroon-900 transition-colors">
              Lihat semua →
            </Link>
          </div>
          <div className="p-5">
            {payables.length > 0 ? (
              <ul className="space-y-3">
                {payables.slice(0, 5).map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-sm">🔔</div>
                      <span className="text-sm font-medium text-gray-800">{p.contactName}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                      {formatRupiah(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-sm text-gray-500 font-medium">Tidak ada tagihan mendesak</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
