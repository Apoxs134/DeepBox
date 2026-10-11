import { useState, useCallback, useMemo } from 'react'
import type { Product } from '../../products/types'
import type { CartItem } from '../types'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = useCallback((product: Product) => {
    if (!product.isAvailable) return

    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.product.id === productId) {
            const nextQty = i.quantity + delta
            return nextQty > 0 ? { ...i, quantity: nextQty } : null
          }
          return i
        })
        .filter((i): i is CartItem => i !== null)
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.product.unitPrice * item.quantity, 0),
    [items]
  )

  return {
    items,
    totalCount,
    totalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }
}
