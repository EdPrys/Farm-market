export interface BuyerRequestUser {
  id: number
  fullName: string | null
  phone: string | null
  telegram: string | null
  viber: string | null
}

export interface BuyerRequestCategory {
  id: number
  name: string
  slug: string
}

export interface BuyerRequest {
  id: number
  title: string
  description: string | null
  quantity: number
  unit: string
  location: string
  budget: number | null
  expiresAt: string | null
  status: 'active' | 'closed'
  createdAt: string
  category: BuyerRequestCategory | null
  user: BuyerRequestUser | null
}

export interface BuyerRequestsMeta {
  currentPage: number
  lastPage: number
  total: number
}

export interface CreateBuyerRequestPayload {
  title: string
  description?: string
  categoryId: number
  quantity: number
  unit: string
  location: string
  budget?: number
  expiresAt?: string
}
