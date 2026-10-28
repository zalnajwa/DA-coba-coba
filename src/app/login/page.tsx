'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleKeyClick = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit)
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!pin) return

    setError('')
    setLoading(true)

    // Check PIN (default is 1234 or 123456)
    if (pin === '1234' || pin === '123456') {
      document.cookie = 'catatanku_session=authenticated; path=/; max-age=86400;'
      router.push('/')
      router.refresh()
    } else {
      setError('PIN salah. Silakan coba lagi (PIN bawaan: 1234).')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="bg-white p-7 sm:p-8 rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full animate-fade-in-up">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-maroon-900 to-maroon-800 text-white shadow-md shadow-maroon-900/20 text-2xl mb-3">
            📊
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">CatatanKu</h1>
          <p className="text-xs text-maroon-700 font-medium mt-1">Pencatatan Keuangan & Kasir UMKM</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center font-medium animate-slide-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 text-center mb-2">
              Masukkan PIN Keamanan
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center text-3xl tracking-[0.4em] py-3 px-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-maroon-100 focus:border-maroon-400 focus:outline-none bg-gray-50/70 font-mono text-gray-800 transition-all"
                placeholder="••••"
                autoFocus
                required
              />
            </div>
            <p className="text-[11px] text-center text-gray-400 mt-2">
              PIN default: <span className="font-semibold text-maroon-800 bg-maroon-50 px-1.5 py-0.5 rounded">1234</span>
            </p>
          </div>

          {/* Quick numpad for POS / tablet ease */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyClick(num)}
                className="py-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 text-lg font-bold text-gray-700 border border-gray-100 transition-all"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 text-xs font-semibold text-gray-500 border border-gray-100 transition-all"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="py-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 text-lg font-bold text-gray-700 border border-gray-100 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="py-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 text-sm font-semibold text-gray-500 border border-gray-100 transition-all"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="w-full bg-maroon-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-maroon-800 transition-all disabled:opacity-50 shadow-md shadow-maroon-900/15 active:scale-[0.98]"
          >
            {loading ? 'Memverifikasi...' : 'Masuk Aplikasi →'}
          </button>
        </form>
      </div>
    </div>
  )
}
