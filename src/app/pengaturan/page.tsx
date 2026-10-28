'use client'

import React, { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '@/actions/settings'
import { Button } from '@/components/ui'

export default function PengaturanPage() {
  const [tab, setTab] = useState('profil')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Form state for profil
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [taxId, setTaxId] = useState('')

  useEffect(() => {
    let ignore = false
    getSettings().then((s) => {
      if (!ignore) {
        setBusinessName(s['business_name'] || '')
        setOwnerName(s['owner_name'] || '')
        setAddress(s['address'] || '')
        setPhone(s['phone'] || '')
        setTaxId(s['tax_id'] || '')
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSettings({
        business_name: businessName,
        owner_name: ownerName,
        address: address,
        phone: phone,
        tax_id: taxId,
      })
      setMessage('✅ Profil usaha berhasil disimpan')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal menyimpan profil usaha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pengaturan</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="flex space-x-4 mb-6 border-b">
        <button onClick={() => setTab('profil')} className={`py-2 px-4 ${tab === 'profil' ? 'border-b-2 border-blue-500 font-bold' : ''}`}>Profil Usaha</button>
        <button onClick={() => setTab('link')} className={`py-2 px-4 ${tab === 'link' ? 'border-b-2 border-blue-500 font-bold' : ''}`}>Pemeliharaan & Alat</button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded shadow text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Memuat pengaturan...</p>
        </div>
      ) : (
        <>
          {tab === 'profil' && (
            <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded shadow space-y-4">
              <h2 className="text-lg font-bold mb-2">Profil Usaha</h2>
              <p className="text-sm text-gray-500 mb-4">Data ini akan digunakan pada laporan keuangan dan struk.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Usaha</label>
                  <input type="text" className="w-full border p-2 rounded" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="UMKM CatatanKu" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Pemilik</label>
                  <input type="text" className="w-full border p-2 rounded" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Nama pemilik usaha" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No. Telepon</label>
                  <input type="text" className="w-full border p-2 rounded" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NPWP (opsional)</label>
                  <input type="text" className="w-full border p-2 rounded" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="XX.XXX.XXX.X-XXX.XXX" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <textarea className="w-full border p-2 rounded" rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap usaha" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Profil'}</Button>
              </div>
            </form>
          )}

          {tab === 'link' && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-bold mb-4">Pemeliharaan & Alat</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="/pengaturan/backup" className="border p-4 rounded hover:shadow-md transition-shadow flex items-center gap-3">
                  <span className="text-2xl">💾</span>
                  <div>
                    <p className="font-bold">Backup & Restore</p>
                    <p className="text-sm text-gray-500">Backup database atau pulihkan dari backup</p>
                  </div>
                </a>
                <a href="/pengaturan/tutup-buku" className="border p-4 rounded hover:shadow-md transition-shadow flex items-center gap-3">
                  <span className="text-2xl">📕</span>
                  <div>
                    <p className="font-bold">Tutup Buku</p>
                    <p className="text-sm text-gray-500">Tutup periode akuntansi bulanan</p>
                  </div>
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
