import { apiFetch } from '../../../lib/api/fetch-client'
import type { Product, SellerContacts } from '../../catalog/types'

export interface Farmer {
  id: number
  fullName: string | null
  farmName: string | null
  memberSince: string
  farmId: number | null
  contacts: SellerContacts | null
  products: Product[]
}

export const farmersApi = {
  getFarmer: (id: number) => apiFetch<Farmer>(`/api/v1/farmers/${id}`),
}
