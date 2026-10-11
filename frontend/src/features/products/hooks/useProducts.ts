import { useState, useEffect, useCallback } from 'react'
import type { Product, CreateProductDto } from '../types'
import { fetchProducts, createProduct as apiCreateProduct } from '../api/productsApi'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchProducts()
      setProducts(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const addProduct = async (dto: CreateProductDto): Promise<Product> => {
    try {
      setIsSubmitting(true)
      const newProduct = await apiCreateProduct(dto)
      setProducts((prev) => [...prev, newProduct])
      return newProduct
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    products,
    loading,
    error,
    isSubmitting,
    reload: loadProducts,
    addProduct,
  }
}
