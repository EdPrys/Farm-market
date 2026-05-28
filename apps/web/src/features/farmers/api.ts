import { apiFetch } from '../../lib/api/fetch-client'
import type { Product } from '../catalog/types'

export interface Farmer {
  id: number
  fullName: string | null
  farmName: string | null
  memberSince: string
  products: Product[]
}

export const farmersApi = {
  getFarmer: (id: number) => apiFetch<Farmer>(`/api/v1/farmers/${id}`),
}
