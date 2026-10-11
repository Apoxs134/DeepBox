import type { Order, CreateOrderPayload } from '../types'

const BASE_URL = '/api/orders'

export async function getOrders(): Promise<Order[]> {
  const res = await fetch(BASE_URL)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to fetch orders')
  }
  return res.json()
}

export async function getOrderById(id: number): Promise<Order> {
  const res = await fetch(`${BASE_URL}/${id}`)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `Failed to fetch order ${id}`)
  }
  return res.json()
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
  return res.json()
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
  return res.json()
}
