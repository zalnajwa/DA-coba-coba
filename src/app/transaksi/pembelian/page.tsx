'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPurchase } from '@/actions/transactions'
import { Button, Card, Select } from '@/components/ui'

export default function PembelianPage() {
  const [category, setCategory] = useState('BAHAN_BAKU')
  const [businessLine, setBusinessLine] = useState('WARKOP')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('TUNAI')
  const [supplierName, setSupplierName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('businessLine', businessLine)
      formData.append('amount', amount)
      formData.append('description', description)
      formData.append('paymentMethod', paymentMethod)
      if (paymentMethod === 'KREDIT') {
        formData.append('isCredit', 'true')
        if (supplierName) formData.append('supplierName', supplierName)
      }
      
      await createPurchase(formData)
      router.push('/transaksi')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Gagal menyimpan transaksi pembelian')
      setLoading(false)
    }
  }

  const addAmount = (val: number) => {
    const current = Number(amount) || 0
    setAmount(String(current + val))
  }

  const categoryOptions = [
    { value: 'BAHAN_BAKU', label: '🥩 Bahan Baku (Kopi, Mie, Susu, Topping Seblak)' },
    { value: 'PERLENGKAPAN', label: '📦 Perlengkapan (Cup, Plastik, Gas, Sedotan)' },
    { value: 'ASET', label: '🏗️ Aset Tetap (Mesin Kopi, PS, Kulkas, Meja/Kursi)' },
  ]

  const businessLineOptions = [
    { value: 'WARKOP', label: '☕ Warkop' },
    { value: 'RENTAL_PS', label: '🎮 Rental PS' },
    { value: 'SEBLAK', label: '🍜 Seblak Prasmanan' },
    { value: 'UMUM', label: '🏢 Umum / Operasional Bersama' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catat Pembelian & Pengadaan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Catat pembelian persediaan bahan baku, perlengkapan, atau aset usaha</p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          ❌ {errorMsg}
        </div>
      )}
      
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Kategori Pengadaan"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
              required
            />
            <Select
              label="Peruntukan Usaha"
              name="businessLine"
              value={businessLine}
              onChange={(e) => setBusinessLine(e.target.value)}
              options={businessLineOptions}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Keterangan / Nama Barang <span className="text-maroon-600">*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="Contoh: Beli Biji Kopi Robusta 5kg & Susu UHT Diamond"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-100 focus:border-maroon-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Total Pembelian (Rp) <span className="text-maroon-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm text-gray-400 font-semibold">
                Rp
              </span>
              <input 
                type="number" 
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-maroon-100 focus:border-maroon-400"
              />
            </div>
            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[20000, 50000, 100000, 250000, 500000].map(val => (
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
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('TUNAI')}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  paymentMethod === 'TUNAI'
                    ? 'bg-maroon-900 text-white border-maroon-900 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                💵 Kas Tunai
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-maroon-900 text-white border-maroon-900 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                🏦 Transfer Bank
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('KREDIT')}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  paymentMethod === 'KREDIT'
                    ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                📝 Utang / Tempo
              </button>
            </div>
          </div>

          {paymentMethod === 'KREDIT' && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <p className="text-xs font-semibold text-amber-900">
                ℹ️ Transaksi ini akan otomatis dicatat ke buku Utang Usaha (jatuh tempo 30 hari).
              </p>
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Nama Supplier / Kontak Pemasok
                </label>
                <input 
                  type="text" 
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Contoh: Toko Bahan Kopi Sumber Rezeki"
                  className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !amount || !description}
              className="w-full"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pembelian'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
