import type { Product } from '../products/types'

export interface CartItem {
  product: Product
  quantity: number
}

export type PaymentMethod = 'Cash' | 'Card' | 'Transfer'

export interface OrderConfirmationResult {
  orderId: string
  provider: string
  method: string
  amount: number
  fee: number
  status: string
}
