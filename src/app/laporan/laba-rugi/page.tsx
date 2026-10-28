'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getIncomeStatementData, exportReport } from '@/actions/reports'
import { getBusinessLines } from '@/actions/cashier'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function LabaRugiPage() {
  const now = new Date()
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today = now.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [businessLineId, setBusinessLineId] = useState<number | undefined>()
  const [businessLines, setBusinessLines] = useState<any[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    getBusinessLines().then(lines => {
      if (!ignore) setBusinessLines(lines)
    }).catch(console.error)
    return () => {
      ignore = true
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const result = await getIncomeStatementData(startDate, endDate, businessLineId)
      setData(result)
    } catch (err) {
      console.error('Gagal memuat laporan:', err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, businessLineId])

  useEffect(() => {
    let ignore = false
    getIncomeStatementData(startDate, endDate, businessLineId).then(result => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    }).catch(err => {
      console.error('Gagal memuat laporan:', err)
      if (!ignore) setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [startDate, endDate, businessLineId])

  const handleExportCSV = async () => {
    const csv = await exportReport('income', { startDate, endDate })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laba-rugi-${startDate}-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Laba Rugi</h1>
        <div className="space-x-2 print:hidden">
          <button onClick={handleExportCSV} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors">Export CSV</button>
          <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">Cetak / PDF</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4 print:hidden">
        <div>
          <label className="block text-sm mb-1">Mulai Tanggal</label>
          <input type="date" className="border p-2 rounded" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Sampai Tanggal</label>
          <input type="date" className="border p-2 rounded" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Filter Usaha</label>
          <select className="border p-2 rounded w-48" value={businessLineId ?? ''} onChange={e => setBusinessLineId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">Semua (Konsolidasi)</option>
            {businessLines.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={fetchData} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors">Terapkan</button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data laporan...</p>
        </div>
      ) : data ? (
        <div className="bg-white p-8 rounded shadow print:shadow-none print:p-0">
          <div className="text-center mb-8 border-b pb-4">
            <h2 className="text-xl font-bold">UMKM CATATANKU</h2>
            <h3 className="text-lg font-bold">LAPORAN LABA RUGI</h3>
            <p className="text-sm text-gray-500">
              Periode: {new Date(startDate + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(endDate + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-6">
            {/* Pendapatan */}
            <div>
              <h4 className="font-bold border-b mb-2">PENDAPATAN USAHA</h4>
              {data.revenues.length > 0 ? data.revenues.map((r: any) => (
                <div key={r.code} className="flex justify-between py-1">
                  <span>{r.name}</span>
                  <span>{formatRupiah(r.amount)}</span>
                </div>
              )) : (
                <p className="text-gray-400 text-sm py-1 italic">Belum ada data pendapatan pada periode ini</p>
              )}
              <div className="flex justify-between py-2 font-bold mt-2 border-t">
                <span>Total Pendapatan Usaha</span>
                <span>{formatRupiah(data.totalRevenue)}</span>
              </div>
            </div>

            {/* HPP */}
            <div>
              <h4 className="font-bold border-b mb-2">HARGA POKOK PENJUALAN (HPP)</h4>
              {data.cogs.length > 0 ? data.cogs.map((c: any) => (
                <div key={c.code} className="flex justify-between py-1">
                  <span>{c.name}</span>
                  <span>({formatRupiah(c.amount)})</span>
                </div>
              )) : (
                <p className="text-gray-400 text-sm py-1 italic">Belum ada data HPP pada periode ini</p>
              )}
              <div className="flex justify-between py-2 font-bold mt-2 border-t">
                <span>Total HPP</span>
                <span>({formatRupiah(data.totalCogs)})</span>
              </div>
            </div>

            {/* Laba Kotor */}
            <div className="flex justify-between py-2 font-bold bg-gray-50 px-2 rounded">
              <span>LABA KOTOR</span>
              <span>{formatRupiah(data.grossProfit)}</span>
            </div>

            {/* Beban Operasional */}
            <div>
              <h4 className="font-bold border-b mb-2">BEBAN OPERASIONAL</h4>
              {data.expenses.length > 0 ? data.expenses.map((e: any) => (
                <div key={e.code} className="flex justify-between py-1">
                  <span>{e.name}</span>
                  <span>{formatRupiah(e.amount)}</span>
                </div>
              )) : (
                <p className="text-gray-400 text-sm py-1 italic">Belum ada data beban pada periode ini</p>
              )}
              <div className="flex justify-between py-2 font-bold mt-2 border-t">
                <span>Total Beban Operasional</span>
                <span>({formatRupiah(data.totalExpense)})</span>
              </div>
            </div>

            {/* Laba Bersih */}
            <div className={`flex justify-between py-3 font-bold px-4 rounded text-lg ${data.netIncome >= 0 ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
              <span>LABA (RUGI) BERSIH</span>
              <span>{formatRupiah(data.netIncome)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
