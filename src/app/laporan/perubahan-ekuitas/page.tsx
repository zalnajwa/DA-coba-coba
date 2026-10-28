'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getEquityChangesData } from '@/actions/reports'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function PerubahanEkuitasPage() {
  const now = new Date()
  const firstOfYear = `${now.getFullYear()}-01-01`
  const today = now.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstOfYear)
  const [endDate, setEndDate] = useState(today)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await getEquityChangesData(startDate, endDate)
      setData(result)
    } catch (err) {
      console.error('Gagal memuat perubahan ekuitas:', err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    let ignore = false
    getEquityChangesData(startDate, endDate).then(result => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    }).catch(err => {
      console.error('Gagal memuat perubahan ekuitas:', err)
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
        <h1 className="text-2xl font-bold">Laporan Perubahan Ekuitas</h1>
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
          <p className="text-gray-500 text-sm">Memuat data perubahan ekuitas...</p>
        </div>
      ) : data ? (
        <div className="bg-white p-8 rounded shadow print:shadow-none print:p-0">
          <div className="text-center mb-8 border-b pb-4">
            <h2 className="text-xl font-bold">UMKM CATATANKU</h2>
            <h3 className="text-lg font-bold">LAPORAN PERUBAHAN EKUITAS</h3>
            <p className="text-sm text-gray-500">
              Periode: {new Date(startDate + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(endDate + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex justify-between py-3 border-b">
              <span className="font-medium">Modal Awal (Awal Periode)</span>
              <span className="font-bold">{formatRupiah(data.beginningEquity)}</span>
            </div>

            <div className="pl-6 space-y-2">
              <div className="flex justify-between py-2">
                <span className={data.netIncome >= 0 ? 'text-green-700' : 'text-red-600'}>
                  {data.netIncome >= 0 ? 'Ditambah: Laba Bersih Periode Ini' : 'Dikurang: Rugi Bersih Periode Ini'}
                </span>
                <span className={`font-bold ${data.netIncome >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {data.netIncome >= 0 ? '+' : ''}{formatRupiah(data.netIncome)}
                </span>
              </div>

              {data.prive > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-red-600">Dikurang: Prive (Pengambilan Pemilik)</span>
                  <span className="font-bold text-red-600">-{formatRupiah(data.prive)}</span>
                </div>
              )}
            </div>

            <div className={`flex justify-between py-4 font-bold text-lg border-t-4 border-black px-3 rounded ${data.endingEquity >= data.beginningEquity ? 'bg-green-50' : 'bg-red-50'}`}>
              <span>Modal Akhir (Akhir Periode)</span>
              <span>{formatRupiah(data.endingEquity)}</span>
            </div>

            {/* Visual summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-2">📊 Ringkasan</p>
              <p>Perubahan modal selama periode ini: <span className={`font-bold ${data.endingEquity - data.beginningEquity >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatRupiah(data.endingEquity - data.beginningEquity)}</span></p>
              <p className="mt-1 text-xs text-gray-400">Modal Akhir = Modal Awal + Laba Bersih − Prive</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
