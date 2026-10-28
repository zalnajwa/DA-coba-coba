'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getBalanceSheetData } from '@/actions/reports'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function PosisiKeuanganPage() {
  const today = new Date().toISOString().split('T')[0]
  const [asOfDate, setAsOfDate] = useState(today)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await getBalanceSheetData(asOfDate)
      setData(result)
    } catch (err) {
      console.error('Gagal memuat neraca:', err)
    } finally {
      setLoading(false)
    }
  }, [asOfDate])

  useEffect(() => {
    let ignore = false
    getBalanceSheetData(asOfDate).then(result => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    }).catch(err => {
      console.error('Gagal memuat neraca:', err)
      if (!ignore) setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [asOfDate])

  const handlePrint = () => window.print()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Posisi Keuangan</h1>
        <div className="space-x-2 print:hidden">
          <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">Cetak / PDF</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4 print:hidden">
        <div>
          <label className="block text-sm mb-1">Per Tanggal</label>
          <input type="date" className="border p-2 rounded" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button onClick={() => { setLoading(true); fetchData(); }} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors">Terapkan</button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data neraca...</p>
        </div>
      ) : data ? (
        <div className="bg-white p-8 rounded shadow print:shadow-none print:p-0">
          <div className="text-center mb-8 border-b pb-4">
            <h2 className="text-xl font-bold">UMKM CATATANKU</h2>
            <h3 className="text-lg font-bold">LAPORAN POSISI KEUANGAN (NERACA)</h3>
            <p className="text-sm text-gray-500">
              Per Tanggal: {new Date(asOfDate + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Kolom Kiri: ASET */}
            <div>
              <h3 className="font-bold text-lg border-b-2 border-black mb-4">ASET</h3>
              {data.assets.length > 0 ? (
                <>
                  {data.assets.map((a: any) => (
                    <div key={a.code} className="flex justify-between py-1">
                      <span className={a.name.includes('Akumulasi') ? 'text-red-600' : ''}>{a.name}</span>
                      <span className={a.name.includes('Akumulasi') ? 'text-red-600' : ''}>
                        {a.balance < 0 ? `(${formatRupiah(Math.abs(a.balance))})` : formatRupiah(a.balance)}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-400 text-sm py-1 italic">Belum ada data aset</p>
              )}
              <div className="flex justify-between py-2 font-bold mt-4 border-t-2 border-black">
                <span>Total Aset</span>
                <span>{formatRupiah(data.totalAssets)}</span>
              </div>
            </div>

            {/* Kolom Kanan: LIABILITAS & EKUITAS */}
            <div>
              <h3 className="font-bold text-lg border-b-2 border-black mb-4">LIABILITAS & EKUITAS</h3>

              <h4 className="font-bold mb-2">Liabilitas (Utang)</h4>
              {data.liabilities.length > 0 ? data.liabilities.map((l: any) => (
                <div key={l.code} className="flex justify-between py-1">
                  <span>{l.name}</span>
                  <span>{formatRupiah(l.balance)}</span>
                </div>
              )) : (
                <p className="text-gray-400 text-sm py-1 italic">Tidak ada liabilitas</p>
              )}
              <div className="flex justify-between py-2 font-bold mb-4 border-t">
                <span>Total Liabilitas</span>
                <span>{formatRupiah(data.totalLiabilities)}</span>
              </div>

              <h4 className="font-bold mb-2">Ekuitas (Modal)</h4>
              {data.equity.length > 0 ? data.equity.map((eq: any) => (
                <div key={eq.code} className="flex justify-between py-1">
                  <span>{eq.name}</span>
                  <span>{formatRupiah(eq.balance)}</span>
                </div>
              )) : (
                <p className="text-gray-400 text-sm py-1 italic">Belum ada data ekuitas</p>
              )}
              {data.currentEarnings !== 0 && (
                <div className="flex justify-between py-1 text-blue-700">
                  <span>Laba Berjalan (YTD)</span>
                  <span>{formatRupiah(data.currentEarnings)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold border-t">
                <span>Total Ekuitas</span>
                <span>{formatRupiah(data.totalEquity)}</span>
              </div>

              <div className="flex justify-between py-2 font-bold mt-4 border-t-2 border-black">
                <span>Total Liab. & Ekuitas</span>
                <span>{formatRupiah(data.totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className={`mt-8 p-3 rounded text-center text-sm font-semibold ${data.isBalanced ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {data.isBalanced ? '✅ Neraca Balance — Total Aset = Total Liabilitas + Ekuitas' : '⚠️ Neraca Tidak Balance — Periksa kembali jurnal transaksi'}
          </div>
        </div>
      ) : null}
    </div>
  )
}
