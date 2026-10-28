'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getCashFlowData } from '@/actions/reports'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function ArusKasPage() {
  const now = new Date()
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today = now.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await getCashFlowData(startDate, endDate)
      setData(result)
    } catch (err) {
      console.error('Gagal memuat arus kas:', err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    let ignore = false
    getCashFlowData(startDate, endDate).then(result => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    }).catch(err => {
      console.error('Gagal memuat arus kas:', err)
      if (!ignore) setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [startDate, endDate])

  const handlePrint = () => window.print()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Arus Kas</h1>
        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors print:hidden">Cetak / PDF</button>
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
        <div className="flex items-end">
          <button onClick={fetchData} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors">Terapkan</button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data arus kas...</p>
        </div>
      ) : data ? (
        <div className="bg-white p-8 rounded shadow print:shadow-none print:p-0">
          <div className="text-center mb-8 border-b pb-4">
            <h2 className="text-xl font-bold">UMKM CATATANKU</h2>
            <h3 className="text-lg font-bold">LAPORAN ARUS KAS (Metode Langsung)</h3>
            <p className="text-sm text-gray-500">
              Periode: {new Date(startDate + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(endDate + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8">
            {/* Arus Kas Operasi */}
            <div>
              <h4 className="font-bold border-b-2 border-black mb-3 pb-1">A. ARUS KAS DARI AKTIVITAS OPERASI</h4>
              <div className="space-y-1 pl-4">
                <div className="flex justify-between py-1">
                  <span>Penerimaan kas dari penjualan</span>
                  <span className="text-green-700 font-medium">{formatRupiah(data.operating.cashIn)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Pembayaran kas untuk pembelian & beban</span>
                  <span className="text-red-600 font-medium">({formatRupiah(data.operating.cashOut)})</span>
                </div>
              </div>
              <div className={`flex justify-between py-2 font-bold mt-2 px-2 rounded ${data.operating.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <span>Arus Kas Bersih dari Aktivitas Operasi</span>
                <span>{formatRupiah(data.operating.net)}</span>
              </div>
            </div>

            {/* Arus Kas Investasi */}
            <div>
              <h4 className="font-bold border-b-2 border-black mb-3 pb-1">B. ARUS KAS DARI AKTIVITAS INVESTASI</h4>
              <div className="space-y-1 pl-4">
                <div className="flex justify-between py-1">
                  <span>Pembelian aset tetap / peralatan</span>
                  <span className="text-red-600 font-medium">({formatRupiah(data.investing.cashOut)})</span>
                </div>
              </div>
              <div className={`flex justify-between py-2 font-bold mt-2 px-2 rounded ${data.investing.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <span>Arus Kas Bersih dari Aktivitas Investasi</span>
                <span>{formatRupiah(data.investing.net)}</span>
              </div>
            </div>

            {/* Arus Kas Pendanaan */}
            <div>
              <h4 className="font-bold border-b-2 border-black mb-3 pb-1">C. ARUS KAS DARI AKTIVITAS PENDANAAN</h4>
              <div className="space-y-1 pl-4">
                <div className="flex justify-between py-1">
                  <span>Penerimaan setoran modal / pinjaman</span>
                  <span className="text-green-700 font-medium">{formatRupiah(data.financing.cashIn)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Pembayaran pinjaman / pengambilan prive</span>
                  <span className="text-red-600 font-medium">({formatRupiah(data.financing.cashOut)})</span>
                </div>
              </div>
              <div className={`flex justify-between py-2 font-bold mt-2 px-2 rounded ${data.financing.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <span>Arus Kas Bersih dari Aktivitas Pendanaan</span>
                <span>{formatRupiah(data.financing.net)}</span>
              </div>
            </div>

            {/* Total */}
            <div className={`flex justify-between py-3 font-bold px-4 rounded text-lg border-t-4 border-black ${data.netChangeInCash >= 0 ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
              <span>KENAIKAN (PENURUNAN) BERSIH KAS</span>
              <span>{formatRupiah(data.netChangeInCash)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
