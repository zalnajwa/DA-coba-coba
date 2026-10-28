'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getPettyCashBalance, getPettyCashHistory, createPettyCashEntry, getSystemCashBalance } from '@/actions/settings'
import { reconcileCash } from '@/actions/shifts'
import { Modal, Button } from '@/components/ui'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function KasPage() {
  const [tab, setTab] = useState('kecil')
  const [balance, setBalance] = useState(0)
  const [systemBalance, setSystemBalance] = useState(0)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<'REPLENISH' | 'EXPENSE' | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [physicalCash, setPhysicalCash] = useState('')
  const [reconNotes, setReconNotes] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [b, h, sys] = await Promise.all([getPettyCashBalance(), getPettyCashHistory(), getSystemCashBalance()])
      setBalance(b)
      setHistory(h)
      setSystemBalance(sys)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    Promise.all([getPettyCashBalance(), getPettyCashHistory(), getSystemCashBalance()]).then(([b, h, sys]) => {
      if (!ignore) {
        setBalance(b)
        setHistory(h)
        setSystemBalance(sys)
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

  const handlePettyCash = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData(e.currentTarget)
      await createPettyCashEntry({
        type: showModal!,
        amount: Number(fd.get('amount')),
        description: fd.get('description') as string,
      })
      setShowModal(null)
      setMessage(`✅ ${showModal === 'REPLENISH' ? 'Isi ulang' : 'Pengeluaran'} kas kecil berhasil dicatat`)
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal mencatat transaksi kas kecil')
    } finally {
      setSaving(false)
    }
  }

  const handleReconciliation = async () => {
    if (!physicalCash) return
    setSaving(true)
    try {
      const result = await reconcileCash(Number(physicalCash), reconNotes || undefined)
      setMessage(`✅ Rekonsiliasi berhasil. Selisih: ${formatRupiah(Number(result.difference))}`)
      setPhysicalCash('')
      setReconNotes('')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal melakukan rekonsiliasi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manajemen Kas</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="flex space-x-4 mb-6 border-b">
        <button onClick={() => setTab('kecil')} className={`py-2 px-4 ${tab === 'kecil' ? 'border-b-2 border-blue-500 font-bold' : ''}`}>Kas Kecil (Petty Cash)</button>
        <button onClick={() => setTab('rekonsiliasi')} className={`py-2 px-4 ${tab === 'rekonsiliasi' ? 'border-b-2 border-blue-500 font-bold' : ''}`}>Rekonsiliasi Kas</button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data kas...</p>
        </div>
      ) : tab === 'kecil' ? (
        <div className="bg-white p-6 rounded shadow">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Saldo Kas Kecil Saat Ini</p>
              <h2 className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(balance)}</h2>
            </div>
            <div className="space-x-2">
              <Button variant="primary" onClick={() => setShowModal('REPLENISH')}>+ Isi Ulang Kas</Button>
              <Button variant="danger" onClick={() => setShowModal('EXPENSE')}>- Catat Pengeluaran</Button>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-4">Riwayat Kas Kecil</h3>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Tanggal</th>
                    <th className="py-2 px-4 border-b text-left">Keterangan</th>
                    <th className="py-2 px-4 border-b text-right">Masuk</th>
                    <th className="py-2 px-4 border-b text-right">Keluar</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b text-sm">{new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="py-2 px-4 border-b text-sm">{entry.description || '-'}</td>
                      <td className="py-2 px-4 border-b text-right text-green-600 font-medium">{entry.type === 'REPLENISH' ? formatRupiah(Number(entry.amount)) : '-'}</td>
                      <td className="py-2 px-4 border-b text-right text-red-600 font-medium">{entry.type === 'EXPENSE' ? formatRupiah(Number(entry.amount)) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>Belum ada riwayat kas kecil.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Rekonsiliasi Kas Fisik</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div className="border p-4 rounded bg-gray-50">
              <p className="text-sm text-gray-500 mb-1">Saldo Kas di Sistem (Akun 1100)</p>
              <p className="text-2xl font-bold">{formatRupiah(systemBalance)}</p>
            </div>
            <div className="border p-4 rounded">
              <label className="block text-sm font-medium mb-1">Input Uang Fisik Sebenarnya</label>
              <input type="number" className="w-full border p-2 rounded text-xl" placeholder="0" value={physicalCash} onChange={e => setPhysicalCash(e.target.value)} />
            </div>
          </div>
          {physicalCash && (
            <div className={`mb-4 p-3 rounded text-sm font-medium ${Number(physicalCash) - systemBalance === 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              Selisih: {formatRupiah(Number(physicalCash) - systemBalance)}
              {Number(physicalCash) - systemBalance !== 0 && ' — Akan dibuatkan jurnal selisih kas otomatis'}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
            <input type="text" className="w-full border p-2 rounded" placeholder="Catatan rekonsiliasi..." value={reconNotes} onChange={e => setReconNotes(e.target.value)} />
          </div>
          <Button variant="primary" onClick={handleReconciliation} disabled={!physicalCash || saving} className="w-full">
            {saving ? 'Memproses...' : 'Lakukan Rekonsiliasi & Buat Jurnal Selisih'}
          </Button>
        </div>
      )}

      {/* Modal Kas Kecil */}
      <Modal isOpen={!!showModal} onClose={() => setShowModal(null)} title={showModal === 'REPLENISH' ? 'Isi Ulang Kas Kecil' : 'Catat Pengeluaran Kas Kecil'}>
        <form onSubmit={handlePettyCash} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Jumlah (Rp) *</label>
            <input name="amount" type="number" required className="w-full border p-2 rounded" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Keterangan *</label>
            <input name="description" type="text" required className="w-full border p-2 rounded" placeholder={showModal === 'REPLENISH' ? 'Isi ulang kas kecil dari kas besar' : 'Beli galon air, snack, dll'} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(null)}>Batal</Button>
            <Button type="submit" variant={showModal === 'REPLENISH' ? 'primary' : 'danger'} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
