import { useState, useEffect, useCallback } from 'react'
import type { Order, CreateOrderPayload } from '../types'
import { getOrders, getOrderById, createOrder, cancelOrder } from '../api/ordersApi'

export function useOrders(autoFetch = false) {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getOrders()
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      loadOrders()
    }
  }, [autoFetch, loadOrders])

  const selectOrder = useCallback(async (order: Order) => {
    setSelectedOrder(order)
    // Optional refresh from server
    try {
      const fresh = await getOrderById(order.orderId)
      setSelectedOrder(fresh)
    } catch {
      // keep current selection
    }
  }, [])

  const deselectOrder = useCallback(() => {
    setSelectedOrder(null)
  }, [])

  const cancelOrderAction = useCallback(async (orderId: number) => {
    try {
      setIsSubmitting(true)
      setError(null)
      const updated = await cancelOrder(orderId)
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? updated : o)))
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(updated)
      }
      return updated
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cancelling order'
      setError(msg)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedOrder])

  const createOrderAction = useCallback(async (payload: CreateOrderPayload) => {
    try {
      setIsSubmitting(true)
      setError(null)
      const created = await createOrder(payload)
      setOrders((prev) => [created, ...prev])
      return created
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error creating order'
      setError(msg)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return {
    orders,
    selectedOrder,
    loading,
    error,
    isSubmitting,
    loadOrders,
    selectOrder,
    deselectOrder,
    cancelOrderAction,
    createOrderAction,
  }
}
