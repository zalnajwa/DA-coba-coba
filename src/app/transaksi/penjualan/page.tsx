'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSale } from '@/actions/transactions'
import { Button, Card } from '@/components/ui'

const BUSINESS_LINES = [
  { id: 'Warkop', name: 'Warkop', icon: '☕', desc: 'Kopi, indomie, minuman, rokok' },
  { id: 'Rental PS', name: 'Rental PS', icon: '🎮', desc: 'Sewa billing PS3/PS4/PS5 & snack' },
  { id: 'Seblak', name: 'Seblak Prasmanan', icon: '🍜', desc: 'Topping seblak & level pedas' },
]

export default function PenjualanPage() {
  const [businessLine, setBusinessLine] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('TUNAI')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('businessLine', businessLine)
      formData.append('amount', amount)
      formData.append('paymentMethod', paymentMethod)
      if (description) formData.append('description', description)
      
      await createSale(formData)
      router.push('/transaksi')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Gagal menyimpan transaksi penjualan')
      setLoading(false)
    }
  }

  const addAmount = (val: number) => {
    const current = Number(amount) || 0
    setAmount(String(current + val))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catat Penjualan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Catat pendapatan penjualan manual atau gunakan Kasir (POS)</p>
        </div>
        <Link
          href="/kasir"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-maroon-50 text-maroon-900 font-semibold text-xs hover:bg-maroon-100 transition-colors border border-maroon-200"
        >
          🧾 Buka Kasir POS →
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          ❌ {errorMsg}
        </div>
      )}

      {!businessLine ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pilih Lini Bisnis</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BUSINESS_LINES.map(b => (
              <button
                key={b.id}
                onClick={() => setBusinessLine(b.id)}
                className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-maroon-300 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-maroon-50 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                    {b.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{b.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
                </div>
                <div className="mt-4 text-xs font-semibold text-maroon-700 group-hover:text-maroon-900 flex items-center gap-1">
                  Pilih lini bisnis <span>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {BUSINESS_LINES.find(b => b.id === businessLine)?.icon || '💰'}
                </span>
                <div>
                  <p className="text-xs text-gray-500">Lini Bisnis Terpilih</p>
                  <h2 className="text-base font-bold text-gray-900">{businessLine}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBusinessLine('')}
                className="text-xs font-semibold text-maroon-700 hover:text-maroon-900 bg-maroon-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Ganti Bisnis
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Keterangan / Catatan (opsional)
              </label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Misal: Penjualan ${businessLine} meja 2`}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-100 focus:border-maroon-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Penjualan (Rp) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm text-gray-400 font-semibold">
                  Rp
                </span>
                <input 
                  type="number" 
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-maroon-100 focus:border-maroon-400"
                />
              </div>
              {/* Quick amount chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[10000, 20000, 50000, 100000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => addAmount(val)}
                    className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200 transition-colors"
                  >
                    +{val.toLocaleString('id-ID')}
                  </button>
                ))}
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-xs font-medium text-red-600 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TUNAI')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    paymentMethod === 'TUNAI'
                      ? 'bg-maroon-900 text-white border-maroon-900 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  💵 Tunai / Kas
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    paymentMethod === 'TRANSFER'
                      ? 'bg-maroon-900 text-white border-maroon-900 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  🏦 Transfer / QRIS
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !amount}
                className="w-full"
              >
                {loading ? 'Menyimpan...' : 'Simpan Penjualan'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
