'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { openShift, closeShift, getCurrentShift, getShiftHistory } from '@/actions/shifts'
import { Button } from '@/components/ui'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function ShiftPage() {
  const [currentShift, setCurrentShift] = useState<any>(null)
  const [shiftHistory, setShiftHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openingCash, setOpeningCash] = useState('')
  const [closingCash, setClosingCash] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [shift, history] = await Promise.all([getCurrentShift(), getShiftHistory()])
      setCurrentShift(shift)
      setShiftHistory(history)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    Promise.all([getCurrentShift(), getShiftHistory()]).then(([shift, history]) => {
      if (!ignore) {
        setCurrentShift(shift)
        setShiftHistory(history)
        setLoading(false)
      }
    }).catch((err) => {
      console.error(err)
      if (!ignore) setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [])

  const handleOpenShift = async () => {
    if (!openingCash) return
    setProcessing(true)
    try {
      await openShift(Number(openingCash))
      setOpeningCash('')
      setMessage('✅ Shift berhasil dibuka')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage(`❌ ${err.message || 'Gagal membuka shift'}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleCloseShift = async () => {
    if (!closingCash) return
    if (!confirm('Yakin ingin menutup shift saat ini?')) return
    setProcessing(true)
    try {
      const result = await closeShift(Number(closingCash), closingNotes || undefined)
      setClosingCash('')
      setClosingNotes('')
      setMessage(`✅ Shift ditutup. Selisih: ${formatRupiah(Number(result.difference || 0))}`)
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 5000)
    } catch (err: any) {
      setMessage(`❌ ${err.message || 'Gagal menutup shift'}`)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Manajemen Shift Kasir</h1>
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data shift...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manajemen Shift Kasir</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {!currentShift ? (
        <div className="bg-white p-8 rounded shadow text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            🔒
          </div>
          <h2 className="text-xl font-bold mb-2">Tidak Ada Shift Aktif</h2>
          <p className="text-gray-500 mb-6">Silakan buka shift untuk mulai mencatat transaksi penjualan.</p>

          <div className="max-w-xs mx-auto text-left mb-6">
            <label className="block text-sm font-medium mb-1">Uang Modal Awal (Kembalian)</label>
            <input type="number" className="w-full border p-2 rounded" placeholder="Contoh: 100000" value={openingCash} onChange={e => setOpeningCash(e.target.value)} />
          </div>

          <Button variant="success" onClick={handleOpenShift} disabled={processing || !openingCash} className="w-full max-w-xs">
            {processing ? 'Membuka Shift...' : '🔓 Buka Shift'}
          </Button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-6 pb-6 border-b">
            <div>
              <h2 className="text-xl font-bold text-green-600 mb-1 flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                Shift Aktif
              </h2>
              <p className="text-sm text-gray-500">Dibuka pada: {new Date(currentShift.openedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border p-4 rounded bg-gray-50">
              <p className="text-sm text-gray-500 mb-1">Modal Awal</p>
              <p className="text-lg font-bold">{formatRupiah(Number(currentShift.openingCash))}</p>
            </div>
            <div className="border p-4 rounded bg-blue-50">
              <p className="text-sm text-blue-600 font-medium mb-1">Estimasi Uang di Laci</p>
              <p className="text-2xl font-bold text-blue-800">{formatRupiah(Number(currentShift.openingCash))}</p>
              <p className="text-xs text-blue-500 mt-1">+ transaksi kas selama shift</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">Proses Tutup Shift</h3>
            <div className="max-w-sm mb-4">
              <label className="block text-sm font-medium mb-1">Uang Fisik Sebenarnya di Laci *</label>
              <input type="number" className="w-full border p-2 rounded text-xl" placeholder="0" value={closingCash} onChange={e => setClosingCash(e.target.value)} />
            </div>
            <div className="max-w-sm mb-4">
              <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
              <input type="text" className="w-full border p-2 rounded" placeholder="Catatan akhir shift..." value={closingNotes} onChange={e => setClosingNotes(e.target.value)} />
            </div>
            <Button variant="danger" onClick={handleCloseShift} disabled={processing || !closingCash}>
              {processing ? 'Menutup Shift...' : '🔒 Tutup Shift Sekarang'}
            </Button>
          </div>
        </div>
      )}

      {/* Riwayat Shift */}
      {shiftHistory.length > 0 && (
        <div className="mt-8 bg-white rounded shadow overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-bold">Riwayat Shift</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 border-b text-left text-sm">Dibuka</th>
                  <th className="py-2 px-4 border-b text-left text-sm">Ditutup</th>
                  <th className="py-2 px-4 border-b text-right text-sm">Modal</th>
                  <th className="py-2 px-4 border-b text-right text-sm">Fisik</th>
                  <th className="py-2 px-4 border-b text-right text-sm">Selisih</th>
                  <th className="py-2 px-4 border-b text-center text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {shiftHistory.filter(s => s.status === 'CLOSED').map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-sm">{new Date(s.openedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2 px-4 border-b text-sm">{s.closedAt ? new Date(s.closedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="py-2 px-4 border-b text-right text-sm">{formatRupiah(Number(s.openingCash))}</td>
                    <td className="py-2 px-4 border-b text-right text-sm">{s.closingCash != null ? formatRupiah(Number(s.closingCash)) : '-'}</td>
                    <td className={`py-2 px-4 border-b text-right text-sm font-medium ${(s.difference || 0) === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.difference != null ? formatRupiah(Number(s.difference)) : '-'}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Selesai</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
