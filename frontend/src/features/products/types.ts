export interface Product {
  id: number
  name: string
  details: string
  unitPrice: number
  isAvailable: boolean
  createdAt: string
}

export interface CreateProductDto {
  name: string
  details: string
  unitPrice: number
  isAvailable?: boolean
}
