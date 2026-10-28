'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createExpense } from '@/actions/transactions'
import { Button, Card, Select } from '@/components/ui'

const EXPENSE_CATEGORIES = [
  { code: '6930', label: '⚡ Listrik & Token PLN', defaultDesc: 'Listrik & Token Usaha' },
  { code: '6910', label: '👥 Gaji & Upah Karyawan', defaultDesc: 'Gaji & Upah Karyawan' },
  { code: '6950', label: '📶 Wifi & Internet', defaultDesc: 'Wifi & Internet Bulanan' },
  { code: '6920', label: '🏠 Sewa Tempat / Lapak', defaultDesc: 'Sewa Tempat / Lapak Usaha' },
  { code: '6960', label: '🧹 Kebersihan & Keamanan', defaultDesc: 'Iuran Kebersihan & Keamanan' },
  { code: '6330', label: '🔥 Gas LPG Usaha', defaultDesc: 'Beli Gas LPG 3kg' },
  { code: '6940', label: '💧 Air / PDAM', defaultDesc: 'Tagihan Air PDAM' },
  { code: '6990', label: '📦 Beban Operasional Lainnya', defaultDesc: 'Pengeluaran operasional lain' },
]

export default function PengeluaranPage() {
  const [accountCode, setAccountCode] = useState('6930')
  const [description, setDescription] = useState('Listrik & Token Usaha')
  const [amount, setAmount] = useState('')
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
      formData.append('accountCode', accountCode)
      formData.append('description', description)
      formData.append('amount', amount)
      formData.append('paymentMethod', paymentMethod)
      
      await createExpense(formData)
      router.push('/transaksi')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Gagal menyimpan transaksi pengeluaran')
      setLoading(false)
    }
  }

  const handleSelectPreset = (cat: typeof EXPENSE_CATEGORIES[0]) => {
    setAccountCode(cat.code)
    setDescription(cat.defaultDesc)
  }

  const addAmount = (val: number) => {
    const current = Number(amount) || 0
    setAmount(String(current + val))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catat Pengeluaran Operasional</h1>
        <p className="text-sm text-gray-500 mt-0.5">Catat beban operasional rutin usaha (listrik, wifi, gaji, sewa, dll)</p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          ❌ {errorMsg}
        </div>
      )}
      
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Kategori Beban Operasional"
            name="accountCode"
            value={accountCode}
            onChange={(e) => {
              const code = e.target.value
              setAccountCode(code)
              const matched = EXPENSE_CATEGORIES.find(c => c.code === code)
              if (matched && (!description || EXPENSE_CATEGORIES.some(c => c.defaultDesc === description))) {
                setDescription(matched.defaultDesc)
              }
            }}
            options={EXPENSE_CATEGORIES.map(c => ({ value: c.code, label: c.label }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Keterangan Beban / Pengeluaran <span className="text-maroon-600">*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="Misal: Token Listrik 100k, Wifi Bulanan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-100 focus:border-maroon-400"
            />
            {/* Quick description chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat.code}
                  type="button"
                  onClick={() => handleSelectPreset(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    accountCode === cat.code
                      ? 'bg-maroon-50 text-maroon-900 border-maroon-300 font-semibold'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-100'
                  }`}
                >
                  + {cat.label.split(' ')[1] || cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jumlah Pengeluaran (Rp) <span className="text-maroon-600">*</span>
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
              {[20000, 50000, 100000, 200000, 500000].map(val => (
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sumber Dana / Pembayaran</label>
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
                💵 Kas Tunai (Kasir)
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
                🏦 Rekening Bank
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !amount || !description}
              className="w-full"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
