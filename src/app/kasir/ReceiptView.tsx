'use client'

type ReceiptItem = {
  name: string
  quantity: number
  price: number
}

type ReceiptDataType = {
  id: string
  date: string
  items: ReceiptItem[]
  subtotal: number
  total: number
  paymentMethod: string
  cashReceived: number
  change: number
}

export function ReceiptView({ data }: { data: ReceiptDataType }) {
  const formatRp = (n: number) => new Intl.NumberFormat('id-ID').format(n)
  const dateObj = new Date(data.date)
  const dateStr = dateObj.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const timeStr = dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className="receipt-print-area">
      <div
        className="receipt-container bg-white mx-auto font-mono text-[11px] leading-tight text-gray-900 p-4 border border-gray-200 rounded-lg shadow-sm"
        style={{
          width: '280px',
          minHeight: '378px', /* 10cm at 96 DPI = 377.95px */
        }}
      >
        {/* Receipt Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="text-lg font-black tracking-wider text-gray-900">CATATANKU</div>
          <div className="text-[10px] font-bold text-gray-700 mt-0.5">Warkop • Rental PS • Seblak</div>
          <div className="text-[9px] text-gray-500 mt-0.5">Jl. Raya UMKM Nusantara No. 88</div>
          <div className="text-[9px] text-gray-500">Telp/WA: 0812-3456-7890</div>
        </div>

        {/* Transaction Metadata */}
        <div className="space-y-0.5 text-[10px] text-gray-600 mb-2">
          <div className="flex justify-between">
            <span>No. Struk</span>
            <span className="font-semibold text-gray-800">{data.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal</span>
            <span>{dateStr} {timeStr}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir</span>
            <span>Kasir 01 (Admin)</span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Items List */}
        <div className="space-y-2 my-2">
          {data.items.map((item, idx) => (
            <div key={idx}>
              <div className="font-bold text-gray-900 truncate">{item.name}</div>
              <div className="flex justify-between text-[10px] text-gray-600 pl-2">
                <span>{item.quantity} x {formatRp(item.price)}</span>
                <span className="font-semibold text-gray-800">{formatRp(item.quantity * item.price)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Summary Totals */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>Rp {formatRp(data.subtotal)}</span>
          </div>
          <div className="flex justify-between font-black text-sm text-gray-900 pt-1 border-t border-dotted border-gray-300">
            <span>TOTAL</span>
            <span>Rp {formatRp(data.total)}</span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-b border-dashed border-gray-400 my-2" />

        {/* Payment & Change */}
        <div className="space-y-1 text-[10px] text-gray-700">
          <div className="flex justify-between">
            <span>Bayar ({data.paymentMethod === 'CASH' ? 'Tunai' : 'Transfer/QRIS'})</span>
            <span>Rp {formatRp(data.cashReceived)}</span>
          </div>
          {data.paymentMethod === 'CASH' && (
            <div className="flex justify-between font-bold text-gray-900">
              <span>Kembalian</span>
              <span>Rp {formatRp(Math.max(0, data.change))}</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-b border-dashed border-gray-400 my-3" />

        {/* Barcode Mock */}
        <div className="flex flex-col items-center my-2 space-y-1">
          <div className="flex items-center gap-[2px] h-7">
            {[4, 2, 6, 2, 1, 5, 2, 3, 7, 2, 4, 1, 3, 6, 2, 5, 1, 3, 2, 6, 2, 4].map((w, i) => (
              <div
                key={i}
                className="bg-gray-900 h-full"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <span className="text-[9px] tracking-widest text-gray-500 font-mono">*{data.id}*</span>
        </div>

        {/* Footer Greetings */}
        <div className="text-center text-[10px] text-gray-600 space-y-0.5 mt-2">
          <div className="font-semibold">Terima Kasih Atas Kunjungan Anda!</div>
          <div className="text-[9px] text-gray-500">Barang yang sudah dibeli tidak dapat ditukar</div>
          <div className="text-[8px] text-gray-400 pt-1">Simpan struk ini sebagai bukti pembayaran yang sah</div>
          <div className="text-[8px] text-gray-400">--- Powered by CatatanKu UMKM ---</div>
        </div>
      </div>
    </div>
  )
}
