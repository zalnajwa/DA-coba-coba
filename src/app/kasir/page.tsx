import { getProductsForPOS, getBusinessLines } from '@/actions/cashier'
import CashierClient from './CashierClient'

export const metadata = {
  title: 'Kasir (POS) — CatatanKu',
  description: 'Point of Sale / Kasir untuk transaksi cepat',
}

export default async function KasirPage() {
  const [products, businessLines] = await Promise.all([
    getProductsForPOS(),
    getBusinessLines(),
  ])

  return (
    <CashierClient
      initialProducts={products}
      businessLines={businessLines.map(bl => ({ id: bl.id, code: bl.code, name: bl.name }))}
    />
  )
}
