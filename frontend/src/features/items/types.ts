export interface Item {
  id: number
  name: string
  details: string
  unitPrice: number
  isAvailable: boolean
  createdAt: string
}

export interface CreateItemDto {
  name: string
  details: string
  unitPrice: number
  isAvailable?: boolean
}
