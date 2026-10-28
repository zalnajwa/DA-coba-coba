'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createBackup, getBackupHistory, restoreBackup } from '@/actions/settings'
import { Button } from '@/components/ui'

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export default function BackupPage() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const h = await getBackupHistory()
      setHistory(h)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    getBackupHistory().then(h => {
      if (!ignore) {
        setHistory(h)
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

  const handleBackup = async () => {
    setBackingUp(true)
    try {
      const result = await createBackup()
      setMessage(`✅ Backup berhasil dibuat: ${result.filename} (${formatBytes(result.size)})`)
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal membuat backup')
    } finally {
      setBackingUp(false)
    }
  }

  const handleRestore = async (filename: string) => {
    if (!confirm(`⚠️ PERINGATAN: Memulihkan backup "${filename}" akan MENGGANTI seluruh data saat ini.\n\nBackup keamanan otomatis akan dibuat sebelum restore.\n\nYakin ingin melanjutkan?`)) return
    setRestoring(true)
    try {
      const result = await restoreBackup(filename)
      setMessage(`✅ Restore berhasil dari "${result.restored}". Backup keamanan: ${result.safetyBackup}`)
      setLoading(true)
      await fetchData()
      setTimeout(() => setMessage(''), 10000)
    } catch (err) {
      console.error(err)
      setMessage('❌ Gagal melakukan restore. Pastikan file backup masih ada.')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Backup & Restore</h1>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-bold mb-2">Buat Backup Baru</h2>
        <p className="text-sm text-gray-500 mb-4">Membuat salinan database SQLite lengkap ke folder <code className="bg-gray-100 px-1 rounded">/backups/</code>. Backup berisi seluruh data akuntansi, inventaris, dan pengaturan.</p>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-sm">
          <strong>Tips:</strong> Lakukan backup rutin, terutama sebelum tutup buku atau update aplikasi.
        </div>

        <Button variant="primary" onClick={handleBackup} disabled={backingUp} className="w-full">
          {backingUp ? '⏳ Membuat backup...' : '💾 Buat Backup Sekarang'}
        </Button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Riwayat Backup</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-maroon-600 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Memuat riwayat...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((b: any) => (
              <div key={b.id} className="flex justify-between items-center border p-4 rounded hover:shadow-sm transition-shadow">
                <div>
                  <p className="font-medium text-sm">{b.filename}</p>
                  <p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {formatBytes(b.sizeBytes)} · <span className={`font-medium ${b.type === 'AUTO' ? 'text-blue-600' : 'text-green-600'}`}>{b.type === 'AUTO' ? 'Otomatis' : 'Manual'}</span></p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRestore(b.filename)} disabled={restoring}>
                  {restoring ? 'Restoring...' : '♻️ Restore'}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl block mb-2">📁</span>
            <p>Belum ada riwayat backup.</p>
          </div>
        )}
      </div>
    </div>
  )
}
