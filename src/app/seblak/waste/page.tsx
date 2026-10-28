'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getInventory, logWaste } from '@/actions/inventory'
import { getWasteLogs } from '@/actions/settings'
import { Button } from '@/components/ui'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function WastePage() {
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [wasteLogs, setWasteLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [inventoryId, setInventoryId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [notes, setNotes] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [inv, logs] = await Promise.all([
        getInventory(3), // 3 = Seblak business line
        getWasteLogs(50)
      ])
      setInventoryItems(inv)
      setWasteLogs(logs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    Promise.all([
      getInventory(3),
      getWasteLogs(50)
    ]).then(([inv, logs]) => {
      if (!ignore) {
        setInventoryItems(inv)
        setWasteLogs(logs)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inventoryId || !quantity) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('businessLineId', '3')
      formData.append('inventoryId', inventoryId)
      formData.append('quantity', quantity)
      formData.append('estimatedCost', estimatedCost || '0')
      formData.append('notes', notes)
      formData.append('date', date)
      await logWaste(formData)
      setMessage('✅ Pencatatan waste berhasil disimpan')
      // Reset form
      setInventoryId('')
      setQuantity('')
      setEstimatedCost('')
      setNotes('')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal menyimpan pencatatan waste')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pencatatan Waste (Buangan) Harian</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded shadow mb-8">
            <h2 className="text-lg font-bold mb-4">Tambah Pencatatan Waste</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Tanggal</label>
                  <input type="date" className="w-full border p-2 rounded" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Bahan Baku (Persediaan) *</label>
                  <select className="w-full border p-2 rounded" value={inventoryId} onChange={e => setInventoryId(e.target.value)} required>
                    <option value="">Pilih bahan baku...</option>
                    {inventoryItems.map((item: any) => (
                      <option key={item.id} value={item.id}>{item.product?.name || item.id} (Stok: {Number(item.quantity)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Kuantitas *</label>
                  <input type="number" step="0.01" className="w-full border p-2 rounded" placeholder="Contoh: 0.5" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Estimasi Kerugian (Rp)</label>
                  <input type="number" className="w-full border p-2 rounded" placeholder="Contoh: 15000" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">Catatan / Alasan</label>
                <textarea className="w-full border p-2 rounded" rows={3} placeholder="Contoh: Basi, jatuh, dll..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <Button type="submit" variant="primary" disabled={saving || !inventoryId || !quantity}>
                {saving ? 'Menyimpan...' : 'Simpan Pencatatan'}
              </Button>
            </form>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold mb-4">Riwayat Waste</h2>
            {wasteLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-4 border-b text-left">Tanggal</th>
                      <th className="py-2 px-4 border-b text-left">Item</th>
                      <th className="py-2 px-4 border-b text-right">Kerugian</th>
                      <th className="py-2 px-4 border-b text-left">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteLogs.map((log: any) => {
                      let parsedItems: any[] = []
                      try { parsedItems = JSON.parse(log.items) } catch { /* ignore */ }
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b text-sm">{new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td className="py-2 px-4 border-b text-sm">
                            {parsedItems.map((item: any, i: number) => (
                              <span key={i}>{item.name || `Item #${item.inventoryId}`} (x{item.quantity}){i < parsedItems.length - 1 ? ', ' : ''}</span>
                            ))}
                          </td>
                          <td className="py-2 px-4 border-b text-right text-sm text-red-600 font-medium">{formatRupiah(Number(log.totalLoss))}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-600">{log.notes || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Belum ada data pencatatan waste.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
