'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getFixedAssets, createFixedAsset, runDepreciation } from '@/actions/assets'
import { getBusinessLines } from '@/actions/cashier'
import { Modal, Button } from '@/components/ui'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function AsetPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [businessLines, setBusinessLines] = useState<any[]>([])
  const [filterBL, setFilterBL] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [depreciating, setDepreciating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [a, bl] = await Promise.all([getFixedAssets(filterBL), getBusinessLines()])
      setAssets(a)
      setBusinessLines(bl)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterBL])

  useEffect(() => {
    let ignore = false
    Promise.all([getFixedAssets(filterBL), getBusinessLines()]).then(([a, bl]) => {
      if (!ignore) {
        setAssets(a)
        setBusinessLines(bl)
        setLoading(false)
      }
    }).catch((err) => {
      console.error(err)
      if (!ignore) setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [filterBL])

  const handleAddAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createFixedAsset(formData)
      setShowAdd(false)
      setMessage('✅ Aset baru berhasil ditambahkan')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal menambahkan aset')
    } finally {
      setSaving(false)
    }
  }

  const handleDepreciation = async () => {
    if (!confirm('Yakin menjalankan penyusutan bulanan untuk semua aset aktif?')) return
    setDepreciating(true)
    try {
      await runDepreciation()
      setMessage('✅ Penyusutan bulanan berhasil dijalankan')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal menjalankan penyusutan')
    } finally {
      setDepreciating(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manajemen Aset Tetap</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setShowAdd(true)}>+ Tambah Aset Baru</Button>
          <Button variant="outline" onClick={handleDepreciation} disabled={depreciating}>
            {depreciating ? 'Memproses...' : '⚙️ Jalankan Penyusutan Bulanan'}
          </Button>
        </div>
        <select className="border p-2 rounded text-sm" value={filterBL ?? ''} onChange={e => setFilterBL(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">Semua Lini Bisnis</option>
          {businessLines.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data aset...</p>
        </div>
      ) : assets.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 border-b text-left">Nama Aset</th>
                <th className="py-3 px-4 border-b text-left">Lini Bisnis</th>
                <th className="py-3 px-4 border-b text-left">Tgl Pembelian</th>
                <th className="py-3 px-4 border-b text-right">Harga Perolehan</th>
                <th className="py-3 px-4 border-b text-right">Umur (Bulan)</th>
                <th className="py-3 px-4 border-b text-right">Akum. Penyusutan</th>
                <th className="py-3 px-4 border-b text-right">Nilai Buku</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset: any) => {
                const bookValue = Number(asset.purchaseCost) - Number(asset.accumulatedDepreciation)
                return (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 border-b font-medium">{asset.name}</td>
                    <td className="py-3 px-4 border-b">{asset.businessLine?.name || '-'}</td>
                    <td className="py-3 px-4 border-b">{new Date(asset.purchaseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3 px-4 border-b text-right">{formatRupiah(Number(asset.purchaseCost))}</td>
                    <td className="py-3 px-4 border-b text-right">{asset.usefulLifeMonths}</td>
                    <td className="py-3 px-4 border-b text-right text-red-600">{formatRupiah(Number(asset.accumulatedDepreciation))}</td>
                    <td className="py-3 px-4 border-b text-right font-medium">{formatRupiah(bookValue)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-12 rounded shadow text-center">
          <span className="text-4xl block mb-2">🏗️</span>
          <p className="text-gray-500">Belum ada aset tetap. Tambahkan aset pertama Anda.</p>
        </div>
      )}

      {/* Modal Tambah Aset */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah Aset Baru" size="lg">
        <form onSubmit={handleAddAsset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Aset *</label>
            <input name="name" type="text" required className="w-full border p-2 rounded" placeholder="Contoh: PS5 Digital Edition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lini Bisnis *</label>
              <select name="businessLineId" required className="w-full border p-2 rounded">
                {businessLines.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal Pembelian *</label>
              <input name="purchaseDate" type="date" required className="w-full border p-2 rounded" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Harga Perolehan (Rp) *</label>
              <input name="purchaseCost" type="number" required className="w-full border p-2 rounded" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Umur Ekonomis (Bulan) *</label>
              <input name="usefulLifeMonths" type="number" required className="w-full border p-2 rounded" defaultValue="48" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nilai Sisa / Residu (Rp)</label>
            <input name="salvageValue" type="number" className="w-full border p-2 rounded" defaultValue="0" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Aset'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
