import type { Product, CreateProductDto } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/items`)
  if (!response.ok) {
    throw new Error(`Failed to fetch products (${response.status})`)
  }
  return response.json()
}

export async function createProduct(dto: CreateProductDto): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Failed to create product (${response.status})`)
  }

  return response.json()
}
