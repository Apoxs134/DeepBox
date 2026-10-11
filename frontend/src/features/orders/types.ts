export interface OrderFee {
  name: string
  amount: number
}

export interface OrderProductItem {
  name: string
  unitPrice: number
}

export interface OrderProviderRef {
  id: string
}

export interface Order {
  orderId: number
  externalOrderId: string
  amount: number
  fees: OrderFee[]
  products: OrderProductItem[]
  provider: OrderProviderRef
  status: string
  paymentMode: string
  createdAt: string
  updatedAt?: string | null
}

export interface CreateOrderPayload {
  PaymentMode: string
  Products: Array<{
    Name: string
    UnitPrice: number
  }>
}
