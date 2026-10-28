'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getSeblakToppings, updateSeblakTopping, createSeblakTopping } from '@/actions/inventory'
import { Modal, Button } from '@/components/ui'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function SeblakPage() {
  const [activeTab, setActiveTab] = useState('topping')
  const [toppings, setToppings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const data = await getSeblakToppings()
      setToppings(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    getSeblakToppings().then(data => {
      if (!ignore) {
        setToppings(data)
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

  const handleAddTopping = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData(e.currentTarget)
      await createSeblakTopping({
        name: fd.get('name') as string,
        sellingPrice: Number(fd.get('sellingPrice')),
      })
      setShowAdd(false)
      setMessage('✅ Topping baru berhasil ditambahkan')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal menambahkan topping')
    } finally {
      setSaving(false)
    }
  }

  const handleEditTopping = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData(e.currentTarget)
      await updateSeblakTopping(editItem.id, {
        name: fd.get('name') as string,
        sellingPrice: Number(fd.get('sellingPrice')),
      })
      setEditItem(null)
      setMessage('✅ Topping berhasil diperbarui')
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal memperbarui topping')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (topping: any) => {
    const newState = !topping.isActive
    if (!newState && !confirm(`Yakin nonaktifkan topping "${topping.name}"?`)) return
    try {
      await updateSeblakTopping(topping.id, { isActive: newState })
      setMessage(`✅ Topping "${topping.name}" ${newState ? 'diaktifkan' : 'dinonaktifkan'}`)
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal mengubah status topping')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manajemen Seblak</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="flex space-x-4 mb-4 border-b">
        <button className={`py-2 px-4 ${activeTab === 'topping' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={() => setActiveTab('topping')}>Daftar Topping</button>
        <button className={`py-2 px-4 ${activeTab === 'bom' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={() => setActiveTab('bom')}>Bill of Materials</button>
        <button className={`py-2 px-4 ${activeTab === 'waste' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={() => setActiveTab('waste')}>Waste / Buangan</button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'topping' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Daftar Topping</h2>
                <Button variant="primary" onClick={() => setShowAdd(true)}>+ Tambah Topping</Button>
              </div>
              {toppings.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded shadow">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 border-b text-left">Nama</th>
                        <th className="py-2 px-4 border-b text-right">Harga Jual</th>
                        <th className="py-2 px-4 border-b text-center">Status</th>
                        <th className="py-2 px-4 border-b text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {toppings.map((t: any) => (
                        <tr key={t.id} className={`hover:bg-gray-50 ${!t.isActive ? 'opacity-50' : ''}`}>
                          <td className="py-2 px-4 border-b font-medium">{t.name}</td>
                          <td className="py-2 px-4 border-b text-right">{formatRupiah(Number(t.sellingPrice))}</td>
                          <td className="py-2 px-4 border-b text-center">
                            <span className={`px-2 py-1 rounded text-xs ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                              {t.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b text-center space-x-2">
                            <button onClick={() => setEditItem(t)} className="text-blue-500 hover:underline text-sm">Edit</button>
                            <button onClick={() => handleToggleActive(t)} className={`text-sm hover:underline ${t.isActive ? 'text-red-500' : 'text-green-500'}`}>
                              {t.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white p-12 rounded shadow text-center">
                  <span className="text-4xl block mb-2">🍜</span>
                  <p className="text-gray-500">Belum ada topping. Tambahkan topping pertama.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bom' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Bill of Materials (BOM)</h2>
              {toppings.filter(t => t.seblakBOMs && t.seblakBOMs.length > 0).length > 0 ? (
                <div className="space-y-4">
                  {toppings.filter(t => t.seblakBOMs && t.seblakBOMs.length > 0).map((t: any) => (
                    <div key={t.id} className="bg-white p-4 rounded shadow">
                      <h3 className="font-bold mb-2">{t.name} — {formatRupiah(Number(t.sellingPrice))}</h3>
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-1 px-3 text-left text-sm">Bahan Baku</th>
                            <th className="py-1 px-3 text-right text-sm">Kuantitas/Porsi</th>
                            <th className="py-1 px-3 text-left text-sm">Satuan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.seblakBOMs.map((bom: any) => (
                            <tr key={bom.id}>
                              <td className="py-1 px-3 text-sm">{bom.inventory?.product?.name || '-'}</td>
                              <td className="py-1 px-3 text-right text-sm">{Number(bom.quantityUsed)}</td>
                              <td className="py-1 px-3 text-sm">{bom.unit || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded shadow text-center">
                  <p className="text-gray-500">Belum ada BOM yang dikonfigurasi. BOM menentukan bahan baku yang digunakan per porsi topping.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'waste' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Waste / Buangan</h2>
              <a href="/seblak/waste" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                📋 Ke halaman pencatatan Waste →
              </a>
            </div>
          )}
        </>
      )}

      {/* Modal Tambah Topping */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah Topping Baru">
        <form onSubmit={handleAddTopping} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Topping *</label>
            <input name="name" type="text" required className="w-full border p-2 rounded" placeholder="Contoh: Kerupuk Mawar" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Harga Jual (Rp) *</label>
            <input name="sellingPrice" type="number" required className="w-full border p-2 rounded" placeholder="0" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Topping */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title={`Edit Topping: ${editItem?.name || ''}`}>
        {editItem && (
          <form onSubmit={handleEditTopping} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Topping *</label>
              <input name="name" type="text" required className="w-full border p-2 rounded" defaultValue={editItem.name} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Harga Jual (Rp) *</label>
              <input name="sellingPrice" type="number" required className="w-full border p-2 rounded" defaultValue={Number(editItem.sellingPrice)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditItem(null)}>Batal</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
