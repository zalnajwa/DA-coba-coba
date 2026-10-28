'use client'

import { useState, useEffect, useCallback } from 'react'
import { processPOSSale } from '@/actions/cashier'
import { Button, Modal } from '@/components/ui'
import { ReceiptView } from './ReceiptView'

type Product = {
  id: number; name: string; code: string | null; price: number; costPrice: number;
  businessLine: string; businessLineName: string; stock: number | null; unit: string;
}

type CartItem = {
  productId: number; name: string; quantity: number; price: number; subtotal: number;
}

type ReceiptData = {
  id: string; date: string; items: { name: string; quantity: number; price: number }[];
  subtotal: number; total: number; paymentMethod: string; cashReceived: number; change: number;
}

export default function CashierClient({ initialProducts, businessLines }: {
  initialProducts: Product[]
  businessLines: { id: number; code: string; name: string }[]
}) {
  const [products] = useState<Product[]>(initialProducts)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBL, setSelectedBL] = useState<string>('ALL')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH')
  const [cashReceived, setCashReceived] = useState<string>('')
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const changeAmount = Number(cashReceived) - totalAmount

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchBL = selectedBL === 'ALL' || p.businessLine === selectedBL
    return matchSearch && matchBL
  })

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        )
      }
      return [...prev, {
        productId: product.id, name: product.name,
        quantity: 1, price: product.price, subtotal: product.price,
      }]
    })
  }, [])

  const updateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.productId !== productId))
    } else {
      setCart(prev => prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQty, subtotal: newQty * item.price }
          : item
      ))
    }
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
    setCashReceived('')
  }

  const openPayment = () => {
    if (cart.length === 0) return
    setCashReceived(String(totalAmount))
    setShowPayment(true)
  }

  const processPayment = async () => {
    if (isProcessing) return
    if (paymentMethod === 'CASH' && changeAmount < 0) return
    setIsProcessing(true)
    try {
      const blId = businessLines.find(bl => bl.code === (selectedBL === 'ALL' ? cart[0] ? products.find(p => p.id === cart[0].productId)?.businessLine : 'WARKOP' : selectedBL))?.id || businessLines[0]?.id || 1
      const result = await processPOSSale({
        items: cart.map(item => ({ productId: item.productId, name: item.name, quantity: item.quantity, price: item.price })),
        paymentMethod, businessLineId: blId, cashReceived: Number(cashReceived), totalAmount,
      })
      if (result.success) {
        setReceiptData(result.receiptData as ReceiptData)
        setShowPayment(false)
        setShowReceipt(true)
      }
    } catch (err) {
      console.error('Payment error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const closeReceipt = () => {
    setShowReceipt(false)
    setReceiptData(null)
    clearCart()
  }

  const quickCashAmounts = [5000, 10000, 20000, 50000, 100000]

  const formatRp = (n: number) => new Intl.NumberFormat('id-ID').format(n)

  // Keyboard shortcut: F2 to pay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2' && cart.length > 0 && !showPayment && !showReceipt) {
        e.preventDefault()
        openPayment()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* LEFT — Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-100 focus:border-maroon-400 transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto shrink-0">
            <button
              onClick={() => setSelectedBL('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBL === 'ALL' ? 'bg-maroon-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            {businessLines.map(bl => (
              <button
                key={bl.code}
                onClick={() => setSelectedBL(bl.code)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedBL === bl.code ? 'bg-maroon-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {bl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map(product => {
                const inCart = cart.find(c => c.productId === product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`relative bg-white rounded-xl border p-3 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] ${
                      inCart ? 'border-maroon-300 ring-1 ring-maroon-200 bg-maroon-50/30' : 'border-gray-100'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute -top-1.5 -right-1.5 bg-maroon-800 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                        {inCart.quantity}
                      </span>
                    )}
                    <div className="text-sm font-semibold text-gray-900 truncate">{product.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{product.businessLineName}</div>
                    <div className="text-sm font-bold text-maroon-800 mt-1.5">Rp {formatRp(product.price)}</div>
                    {product.stock !== null && (
                      <div className={`text-[10px] font-medium mt-1 ${product.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                        Stok: {product.stock} {product.unit}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-4xl mb-2">🔍</span>
              <p className="text-sm font-medium">Produk tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Cart / Order Summary */}
      <div className="w-full lg:w-[360px] bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col shrink-0 overflow-hidden">
        {/* Cart header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🛒</span>
            <h2 className="font-bold text-gray-900 text-sm">Keranjang</h2>
            {cart.length > 0 && (
              <span className="bg-maroon-100 text-maroon-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} item
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 font-semibold hover:text-red-700 transition-colors">
              Hapus Semua
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <span className="text-4xl mb-2">🧾</span>
              <p className="text-sm font-medium">Keranjang kosong</p>
              <p className="text-xs text-gray-400 mt-1">Pilih produk dari panel kiri</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">Rp {formatRp(item.price)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="text-right shrink-0 w-20">
                  <p className="text-sm font-bold text-gray-900">Rp {formatRp(item.subtotal)}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-[10px] text-red-400 hover:text-red-600 font-medium">
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart footer / Pay button */}
        <div className="border-t border-gray-100 p-4 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">Total</span>
            <span className="text-xl font-bold text-maroon-900">Rp {formatRp(totalAmount)}</span>
          </div>
          <button
            onClick={openPayment}
            disabled={cart.length === 0}
            className="w-full bg-maroon-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-maroon-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            💳 Bayar (F2)
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Pembayaran" size="md">
        <div className="space-y-5">
          <div className="bg-maroon-50 rounded-xl p-4 text-center">
            <p className="text-xs text-maroon-600 font-semibold uppercase tracking-wide mb-1">Total Bayar</p>
            <p className="text-3xl font-bold text-maroon-900">Rp {formatRp(totalAmount)}</p>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  paymentMethod === 'CASH' ? 'bg-maroon-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💵 Tunai
              </button>
              <button
                onClick={() => setPaymentMethod('BANK')}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  paymentMethod === 'BANK' ? 'bg-maroon-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏦 Transfer
              </button>
            </div>
          </div>

          {/* Cash received */}
          {paymentMethod === 'CASH' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Uang Diterima</label>
              <input
                type="number"
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-maroon-100 focus:border-maroon-400"
                placeholder="0"
              />
              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {quickCashAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(String(amount))}
                    className="py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {formatRp(amount)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCashReceived(String(totalAmount))}
                className="w-full mt-1.5 py-1.5 rounded-lg bg-maroon-50 text-xs font-semibold text-maroon-700 hover:bg-maroon-100 transition-colors"
              >
                Uang Pas
              </button>

              {Number(cashReceived) >= totalAmount && (
                <div className="mt-3 bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600 font-semibold">Kembalian</p>
                  <p className="text-xl font-bold text-emerald-700">Rp {formatRp(changeAmount)}</p>
                </div>
              )}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={processPayment}
            disabled={isProcessing || (paymentMethod === 'CASH' && changeAmount < 0)}
            className="w-full"
          >
            {isProcessing ? '⏳ Memproses...' : '✅ Proses Pembayaran'}
          </Button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Struk Transaksi</h3>
              <button onClick={closeReceipt} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <ReceiptView data={receiptData} />
            </div>
            <div className="p-4 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => window.print()}
                className="py-2.5 rounded-xl bg-maroon-900 text-white text-sm font-semibold hover:bg-maroon-800 transition-colors"
              >
                🖨️ Cetak Struk
              </button>
              <button
                onClick={closeReceipt}
                className="py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
