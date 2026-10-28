'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getPayables, createPayable, recordPayment } from '@/actions/payables'
import { getBusinessLines } from '@/actions/cashier'
import { Modal, Button } from '@/components/ui'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function UtangPiutangPage() {
  const [tab, setTab] = useState<'PAYABLE' | 'RECEIVABLE'>('PAYABLE')
  const [items, setItems] = useState<any[]>([])
  const [businessLines, setBusinessLines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [p, bl] = await Promise.all([getPayables(tab), getBusinessLines()])
      setItems(p)
      setBusinessLines(bl)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    let ignore = false
    Promise.all([getPayables(tab), getBusinessLines()]).then(([p, bl]) => {
      if (!ignore) {
        setItems(p)
        setBusinessLines(bl)
        setLoading(false)
      }
    }).catch(err => {
      console.error(err)
      if (!ignore) setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [tab])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('type', tab)
      await createPayable(formData)
      setShowAdd(false)
      setMessage(`✅ ${tab === 'PAYABLE' ? 'Utang' : 'Piutang'} baru berhasil ditambahkan`)
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal menambahkan data')
    } finally {
      setSaving(false)
    }
  }

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData(e.currentTarget)
      const amount = Number(fd.get('amount'))
      const method = fd.get('paymentMethod') as string
      await recordPayment(showPayment.id, amount, method)
      setShowPayment(null)
      setMessage('✅ Pembayaran berhasil dicatat')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal mencatat pembayaran')
    } finally {
      setSaving(false)
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Utang & Piutang</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4 border-b">
          <button onClick={() => setTab('PAYABLE')} className={`py-2 px-4 ${tab === 'PAYABLE' ? 'border-blue-500 border-b-2 font-bold' : ''}`}>Utang (Payable)</button>
          <button onClick={() => setTab('RECEIVABLE')} className={`py-2 px-4 ${tab === 'RECEIVABLE' ? 'border-blue-500 border-b-2 font-bold' : ''}`}>Piutang (Receivable)</button>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          + Tambah {tab === 'PAYABLE' ? 'Utang' : 'Piutang'}
        </Button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 border-b text-left">Kontak</th>
                <th className="py-3 px-4 border-b text-left">Keterangan</th>
                <th className="py-3 px-4 border-b text-right">Total</th>
                <th className="py-3 px-4 border-b text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 border-b text-right">Sisa</th>
                <th className="py-3 px-4 border-b text-center">Jatuh Tempo</th>
                <th className="py-3 px-4 border-b text-center">Status</th>
                <th className="py-3 px-4 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p: any) => {
                const remaining = Number(p.amount) - Number(p.paidAmount)
                const daysUntil = getDaysUntilDue(p.dueDate)
                const isOverdue = daysUntil < 0
                const isUrgent = daysUntil <= 3 && daysUntil >= 0
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="py-3 px-4 border-b font-medium">{p.contactName}</td>
                    <td className="py-3 px-4 border-b text-sm text-gray-600">{p.description || '-'}</td>
                    <td className="py-3 px-4 border-b text-right">{formatRupiah(Number(p.amount))}</td>
                    <td className="py-3 px-4 border-b text-right">{formatRupiah(Number(p.paidAmount))}</td>
                    <td className="py-3 px-4 border-b text-right font-medium text-red-600">{formatRupiah(remaining)}</td>
                    <td className={`py-3 px-4 border-b text-center text-sm ${isOverdue ? 'text-red-600 font-bold' : isUrgent ? 'text-orange-600 font-bold' : ''}`}>
                      {isOverdue ? `Terlambat ${Math.abs(daysUntil)} hari` : daysUntil === 0 ? 'Hari ini!' : daysUntil <= 3 ? `${daysUntil} hari lagi` : new Date(p.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.status === 'PAID' ? 'bg-green-100 text-green-800' : p.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status === 'PAID' ? 'Lunas' : p.status === 'PARTIAL' ? 'Sebagian' : 'Belum Lunas'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      {p.status !== 'PAID' && (
                        <button onClick={() => setShowPayment(p)} className="text-blue-500 hover:underline text-sm">
                          Catat Pembayaran
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-12 rounded shadow text-center">
          <span className="text-4xl block mb-2">{tab === 'PAYABLE' ? '💳' : '📥'}</span>
          <p className="text-gray-500">Belum ada {tab === 'PAYABLE' ? 'utang' : 'piutang'}.</p>
        </div>
      )}

      {/* Modal Tambah */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={`Tambah ${tab === 'PAYABLE' ? 'Utang' : 'Piutang'} Baru`} size="lg">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Kontak *</label>
            <input name="contactName" type="text" required className="w-full border p-2 rounded" placeholder={tab === 'PAYABLE' ? 'Nama Supplier/Pemasok' : 'Nama Pelanggan'} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Keterangan</label>
            <input name="description" type="text" className="w-full border p-2 rounded" placeholder="Deskripsi singkat..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Jumlah (Rp) *</label>
              <input name="amount" type="number" required className="w-full border p-2 rounded" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jatuh Tempo *</label>
              <input name="dueDate" type="date" required className="w-full border p-2 rounded" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lini Bisnis</label>
            <select name="businessLineId" className="w-full border p-2 rounded">
              <option value="">Umum</option>
              {businessLines.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Catat Pembayaran */}
      <Modal isOpen={!!showPayment} onClose={() => setShowPayment(null)} title="Catat Pembayaran">
        {showPayment && (
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p><strong>Kontak:</strong> {showPayment.contactName}</p>
              <p><strong>Total:</strong> {formatRupiah(Number(showPayment.amount))}</p>
              <p><strong>Sudah Dibayar:</strong> {formatRupiah(Number(showPayment.paidAmount))}</p>
              <p><strong>Sisa:</strong> <span className="text-red-600 font-bold">{formatRupiah(Number(showPayment.amount) - Number(showPayment.paidAmount))}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jumlah Pembayaran (Rp) *</label>
              <input name="amount" type="number" required className="w-full border p-2 rounded" placeholder="0" max={Number(showPayment.amount) - Number(showPayment.paidAmount)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
              <select name="paymentMethod" className="w-full border p-2 rounded">
                <option value="CASH">💵 Tunai / Kas</option>
                <option value="BANK">🏦 Transfer Bank</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowPayment(null)}>Batal</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Memproses...' : 'Catat Pembayaran'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
