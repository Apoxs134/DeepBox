import { useState, useEffect, useCallback } from 'react'
import type { Item, CreateItemDto } from '../types'
import { fetchItems, createItem as apiCreateItem } from '../api/itemsApi'

export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchItems()
      setItems(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const addItem = async (dto: CreateItemDto): Promise<Item> => {
    try {
      setIsSubmitting(true)
      const newItem = await apiCreateItem(dto)
      setItems((prev) => [...prev, newItem])
      return newItem
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    items,
    loading,
    error,
    isSubmitting,
    reload: loadItems,
    addItem,
  }
}
