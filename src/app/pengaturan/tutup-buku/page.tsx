'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { closePeriod, getClosingHistory } from '@/actions/closing'
import { Button } from '@/components/ui'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function TutupBukuPage() {
  const now = new Date()
  // Default to previous month
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const defaultPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`

  const [period, setPeriod] = useState(defaultPeriod)
  const [closingHistory, setClosingHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const history = await getClosingHistory()
      setClosingHistory(history)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    getClosingHistory().then(history => {
      if (!ignore) {
        setClosingHistory(history)
        setLoading(false)
      }
    }).catch(err => {
      console.error(err)
      if (!ignore) setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [])

  const isPeriodClosed = (p: string) => closingHistory.some((c: any) => c.period === p)

  const handleClose = async () => {
    if (isPeriodClosed(period)) {
      setMessage('⚠️ Periode ini sudah ditutup sebelumnya.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const [y, m] = period.split('-')
    const monthName = MONTH_NAMES[Number(m) - 1]
    if (!confirm(`Yakin ingin menutup buku periode ${monthName} ${y}?\n\nProses ini akan:\n- Menghitung laba bersih periode\n- Membuat jurnal penutup\n- Memindahkan laba ke laba ditahan\n\nProses ini TIDAK BISA dibatalkan.`)) return

    setProcessing(true)
    try {
      const result = await closePeriod(period)
      setMessage(`✅ Tutup buku ${monthName} ${y} berhasil. Laba bersih: ${formatRupiah(Number(result.netIncome))}`)
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 5000)
    } catch (err: any) {
      setMessage(`❌ ${err.message || 'Gagal menutup buku. Pastikan periode sebelumnya sudah ditutup.'}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tutup Buku Periode</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-bold mb-2">Proses Tutup Buku</h2>
        <p className="text-sm text-gray-500 mb-4">
          Tutup buku akhir bulan akan menghitung laba/rugi periode tersebut, membuat jurnal penutup (menutup akun pendapatan, HPP, dan beban), dan memindahkan hasilnya ke laba ditahan.
        </p>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-6 text-sm">
          <strong>⚠️ Perhatian:</strong> Pastikan semua transaksi periode yang bersangkutan sudah diinput dengan benar sebelum menutup buku. Setelah ditutup, data periode tersebut tidak bisa diubah kembali.
        </div>

        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Pilih Periode</label>
            <input type="month" className="border p-2 rounded text-lg" value={period} onChange={e => setPeriod(e.target.value)} />
          </div>
          <div>
            {isPeriodClosed(period) ? (
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded text-sm font-medium">
                ✅ Periode ini sudah ditutup
              </div>
            ) : (
              <Button variant="danger" onClick={handleClose} disabled={processing}>
                {processing ? '⏳ Memproses...' : '📕 Tutup Buku Sekarang'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Riwayat Tutup Buku</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Memuat riwayat...</p>
          </div>
        ) : closingHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 border-b text-left text-sm">Periode</th>
                  <th className="py-2 px-4 border-b text-right text-sm">Laba RE Awal</th>
                  <th className="py-2 px-4 border-b text-right text-sm">Laba Bersih</th>
                  <th className="py-2 px-4 border-b text-right text-sm">Laba RE Akhir</th>
                  <th className="py-2 px-4 border-b text-left text-sm">Ditutup Pada</th>
                </tr>
              </thead>
              <tbody>
                {closingHistory.map((c: any) => {
                  const [y, m] = c.period.split('-')
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b font-medium">{MONTH_NAMES[Number(m) - 1]} {y}</td>
                      <td className="py-2 px-4 border-b text-right text-sm">{formatRupiah(Number(c.openingRetainedEarnings))}</td>
                      <td className={`py-2 px-4 border-b text-right text-sm font-medium ${Number(c.netIncome) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(Number(c.netIncome))}</td>
                      <td className="py-2 px-4 border-b text-right text-sm font-bold">{formatRupiah(Number(c.closingRetainedEarnings))}</td>
                      <td className="py-2 px-4 border-b text-sm text-gray-500">{new Date(c.closedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl block mb-2">📅</span>
            <p>Belum ada periode yang ditutup.</p>
          </div>
        )}
      </div>
    </div>
  )
}
