'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getInventory, updateInventory } from '@/actions/inventory'
import { getBusinessLines } from '@/actions/cashier'
import { createInventoryItem } from '@/actions/settings'
import { Modal, Button } from '@/components/ui'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function PersediaanPage() {
  const [items, setItems] = useState<any[]>([])
  const [businessLines, setBusinessLines] = useState<any[]>([])
  const [selectedBL, setSelectedBL] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showAdjust, setShowAdjust] = useState<any>(null) // inventory item being adjusted
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [inv, bl] = await Promise.all([getInventory(selectedBL), getBusinessLines()])
      setItems(inv)
      setBusinessLines(bl)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedBL])

  useEffect(() => {
    let ignore = false
    Promise.all([getInventory(selectedBL), getBusinessLines()]).then(([inv, bl]) => {
      if (!ignore) {
        setItems(inv)
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
  }, [selectedBL])

  const filteredItems = items.filter(item => {
    const name = item.product?.name || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData(e.currentTarget)
      await createInventoryItem({
        name: fd.get('name') as string,
        businessLineId: Number(fd.get('businessLineId')),
        quantity: Number(fd.get('quantity')),
        unit: fd.get('unit') as string,
        minimumStock: Number(fd.get('minimumStock')),
        costPrice: Number(fd.get('costPrice')),
        sellingPrice: Number(fd.get('sellingPrice')),
      })
      setShowAdd(false)
      setMessage('✅ Item baru berhasil ditambahkan')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal menambahkan item')
    } finally {
      setSaving(false)
    }
  }

  const handleAdjustStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData(e.currentTarget)
      await updateInventory(showAdjust.id, {
        quantity: Number(fd.get('quantity')),
        minimumStock: Number(fd.get('minimumStock')),
        costPrice: Number(fd.get('costPrice')),
      })
      setShowAdjust(null)
      setMessage('✅ Stok berhasil diperbarui')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal memperbarui stok')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manajemen Persediaan</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Business Line Tabs */}
      <div className="flex space-x-4 mb-6 border-b overflow-x-auto">
        <button
          onClick={() => setSelectedBL(undefined)}
          className={`py-2 px-4 whitespace-nowrap ${!selectedBL ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
        >
          Semua
        </button>
        {businessLines.map((bl: any) => (
          <button
            key={bl.id}
            onClick={() => setSelectedBL(bl.id)}
            className={`py-2 px-4 whitespace-nowrap ${selectedBL === bl.id ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
          >
            {bl.name}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
        <Button variant="success" onClick={() => setShowAdd(true)}>+ Tambah Item Baru</Button>
        <input
          type="text"
          placeholder="Cari item..."
          className="border p-2 rounded w-64"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data persediaan...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 border-b text-left">Nama Item</th>
                <th className="py-3 px-4 border-b text-right">Stok Saat Ini</th>
                <th className="py-3 px-4 border-b text-left">Satuan</th>
                <th className="py-3 px-4 border-b text-right">Stok Minimum</th>
                <th className="py-3 px-4 border-b text-right">Harga Beli</th>
                <th className="py-3 px-4 border-b text-center">Status</th>
                <th className="py-3 px-4 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item: any) => {
                const qty = Number(item.quantity)
                const minStock = Number(item.minimumStock)
                const isLow = qty <= minStock
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isLow ? 'bg-red-50' : ''}`}>
                    <td className="py-3 px-4 border-b font-medium">{item.product?.name || '-'}</td>
                    <td className={`py-3 px-4 border-b text-right ${isLow ? 'text-red-600 font-bold' : ''}`}>{qty}</td>
                    <td className="py-3 px-4 border-b">{item.unit || item.product?.unit || '-'}</td>
                    <td className="py-3 px-4 border-b text-right">{minStock}</td>
                    <td className="py-3 px-4 border-b text-right">{formatRupiah(Number(item.costPrice))}</td>
                    <td className="py-3 px-4 border-b text-center">
                      <span className={`px-2 py-1 rounded text-xs ${isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isLow ? 'Menipis' : 'Aman'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <button onClick={() => setShowAdjust(item)} className="text-blue-500 hover:underline text-sm">Sesuaikan Stok</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-12 rounded shadow text-center">
          <span className="text-4xl block mb-2">📦</span>
          <p className="text-gray-500">Belum ada item persediaan. Tambahkan item pertama.</p>
        </div>
      )}

      {/* Modal Tambah Item */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah Item Persediaan" size="lg">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Item *</label>
            <input name="name" type="text" required className="w-full border p-2 rounded" placeholder="Contoh: Indomie Goreng" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lini Bisnis *</label>
              <select name="businessLineId" required className="w-full border p-2 rounded">
                {businessLines.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Satuan *</label>
              <input name="unit" type="text" required className="w-full border p-2 rounded" placeholder="Bungkus / Kg / Liter" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stok Awal *</label>
              <input name="quantity" type="number" required className="w-full border p-2 rounded" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stok Minimum *</label>
              <input name="minimumStock" type="number" required className="w-full border p-2 rounded" placeholder="10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Harga Beli (Rp) *</label>
              <input name="costPrice" type="number" required className="w-full border p-2 rounded" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Harga Jual (Rp) *</label>
            <input name="sellingPrice" type="number" required className="w-full border p-2 rounded" placeholder="0" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Item'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Sesuaikan Stok */}
      <Modal isOpen={!!showAdjust} onClose={() => setShowAdjust(null)} title={`Sesuaikan Stok: ${showAdjust?.product?.name || ''}`}>
        {showAdjust && (
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kuantitas Baru *</label>
              <input name="quantity" type="number" required className="w-full border p-2 rounded" defaultValue={Number(showAdjust.quantity)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stok Minimum</label>
              <input name="minimumStock" type="number" className="w-full border p-2 rounded" defaultValue={Number(showAdjust.minimumStock)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Harga Beli (Rp)</label>
              <input name="costPrice" type="number" className="w-full border p-2 rounded" defaultValue={Number(showAdjust.costPrice)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowAdjust(null)}>Batal</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
