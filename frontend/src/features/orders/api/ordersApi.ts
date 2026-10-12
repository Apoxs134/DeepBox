import type { Order, CreateOrderPayload } from '../types'

const BASE_URL = '/api/orders'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrder(raw: any): Order {
  if (!raw) return raw
  return {
    orderId: raw.orderId ?? raw.OrderId ?? 0,
    externalOrderId: raw.externalOrderId ?? raw.ExternalOrderId ?? '',
    amount: Number(raw.amount ?? raw.Amount ?? 0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fees: (raw.fees ?? raw.Fees ?? []).map((f: any) => ({
      name: f.name ?? f.Name ?? f.title ?? f.Title ?? 'Fee',
      amount: Number(f.amount ?? f.Amount ?? 0),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: (raw.products ?? raw.Products ?? []).map((p: any) => ({
      name: p.name ?? p.Name ?? '',
      unitPrice: Number(p.unitPrice ?? p.UnitPrice ?? 0),
    })),
    provider: {
      id: raw.provider?.id ?? raw.Provider?.Id ?? raw.providerId ?? raw.ProviderId ?? 'Provider',
    },
    status: raw.status ?? raw.Status ?? 'Created',
    paymentMode: raw.paymentMode ?? raw.PaymentMode ?? 'Cash',
    createdAt: raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.UpdatedAt ?? null,
  }
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch(BASE_URL)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to fetch orders')
  }
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Array.isArray(data) ? data.map((item: any) => normalizeOrder(item)) : []
}

export async function getOrderById(id: number): Promise<Order> {
  const res = await fetch(`${BASE_URL}/${id}`)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `Failed to fetch order ${id}`)
  }
  const data = await res.json()
  return normalizeOrder(data)
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to create order')
  }
  const data = await res.json()
  return normalizeOrder(data)
}

export async function cancelOrder(id: number): Promise<Order> {
  const res = await fetch(`${BASE_URL}/${id}/cancel`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to cancel order')
  }
  const data = await res.json()
  return normalizeOrder(data)
}

export async function approveOrder(id: number): Promise<Order> {
  const res = await fetch(`${BASE_URL}/${id}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to approve order')
  }
  const data = await res.json()
  return normalizeOrder(data)
}

export async function rejectOrder(id: number): Promise<Order> {
  const res = await fetch(`${BASE_URL}/${id}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to reject order')
  }
  const data = await res.json()
  return normalizeOrder(data)
}
