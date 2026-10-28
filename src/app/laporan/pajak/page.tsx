'use client'

import React, { useState, useEffect } from 'react'
import { getTaxSummaryData } from '@/actions/settings'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const THRESHOLD = 500_000_000

export default function LaporanPajakPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    getTaxSummaryData(year).then(result => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    }).catch(err => {
      console.error('Gagal memuat data pajak:', err)
      if (!ignore) setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [year])

  // Build monthly rows from data
  const buildMonthlyRows = () => {
    if (!data) return []
    const rows = []
    let cumulativeRevenue = 0
    for (let m = 1; m <= 12; m++) {
      const record = data.records.find((r: any) => r.month === m)
      const monthRevenue = record ? Number(record.grossRevenue) : 0
      cumulativeRevenue += monthRevenue
      const taxableAmount = Math.max(0, cumulativeRevenue - THRESHOLD) - Math.max(0, cumulativeRevenue - monthRevenue - THRESHOLD)
      const taxAmount = record ? Number(record.taxAmount) : Math.round(taxableAmount * 0.005)
      const isPaid = record ? record.isPaid : false

      rows.push({
        month: m,
        monthName: MONTH_NAMES[m - 1],
        revenue: monthRevenue,
        cumulative: cumulativeRevenue,
        taxable: taxableAmount > 0 ? taxableAmount : 0,
        tax: taxAmount,
        isPaid,
        hasData: monthRevenue > 0,
      })
    }
    return rows
  }

  const rows = buildMonthlyRows()
  const totalRevenue = data?.totalRevenueYear || rows.reduce((s, r) => s + r.revenue, 0)
  const totalTax = data?.totalTaxYear || rows.reduce((s, r) => s + r.tax, 0)
  const remainingQuota = Math.max(0, THRESHOLD - totalRevenue)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Laporan Pajak PPh Final (PP 55/2022)</h1>
      <p className="text-gray-600 mb-6">Tracking peredaran bruto (omzet) untuk UMKM dengan tarif 0,5%.</p>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-sm"><strong>Info Aturan:</strong> Wajib pajak orang pribadi UMKM yang memiliki peredaran bruto sampai dengan Rp 500 juta dalam setahun tidak dikenai Pajak Penghasilan (Bebas Pajak). Bagian omzet yang melebihi Rp 500 juta baru dikenakan tarif 0,5%.</p>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="flex items-center mb-6">
          <label className="font-bold mr-4">Tahun Pajak:</label>
          <select className="border p-2 rounded text-lg font-bold" value={year} onChange={e => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Memuat data pajak...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="border p-4 rounded bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Total Omzet YTD</p>
                <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
              </div>
              <div className="border p-4 rounded bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Sisa Kuota Bebas Pajak</p>
                <p className={`text-2xl font-bold ${remainingQuota > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(remainingQuota)}</p>
              </div>
              <div className="border p-4 rounded bg-blue-50">
                <p className="text-sm text-blue-600 font-medium mb-1">Pajak Terutang</p>
                <p className="text-2xl font-bold text-blue-800">{formatRupiah(totalTax)}</p>
              </div>
            </div>

            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left">Bulan</th>
                  <th className="py-2 px-4 border-b text-right">Peredaran Bruto</th>
                  <th className="py-2 px-4 border-b text-right">Omzet Kumulatif</th>
                  <th className="py-2 px-4 border-b text-right">DPP (Kena Pajak)</th>
                  <th className="py-2 px-4 border-b text-right">Pajak (0,5%)</th>
                  <th className="py-2 px-4 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.month} className={!row.hasData ? 'opacity-40' : ''}>
                    <td className="py-2 px-4 border-b">{row.monthName}</td>
                    <td className="py-2 px-4 border-b text-right">{row.hasData ? formatRupiah(row.revenue) : '-'}</td>
                    <td className="py-2 px-4 border-b text-right">{row.hasData ? formatRupiah(row.cumulative) : '-'}</td>
                    <td className="py-2 px-4 border-b text-right">{row.hasData ? formatRupiah(row.taxable) : '-'}</td>
                    <td className="py-2 px-4 border-b text-right">{row.hasData ? formatRupiah(row.tax) : '-'}</td>
                    <td className="py-2 px-4 border-b text-center">
                      {row.hasData ? (
                        row.taxable > 0 ? (
                          <span className={`text-xs px-2 py-1 rounded ${row.isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                            {row.isPaid ? 'Sudah Bayar' : 'Belum Bayar'}
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Bebas Pajak</span>
                        )
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="py-2 px-4 text-left">TOTAL</td>
                  <td className="py-2 px-4 text-right">{formatRupiah(totalRevenue)}</td>
                  <td className="py-2 px-4"></td>
                  <td className="py-2 px-4 text-right">{formatRupiah(Math.max(0, totalRevenue - THRESHOLD))}</td>
                  <td className="py-2 px-4 text-right">{formatRupiah(totalTax)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
