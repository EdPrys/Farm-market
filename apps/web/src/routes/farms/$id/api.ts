// apps/web/src/routes/farms/$id/api.ts
import { apiFetch } from '@/lib/api/fetch-client'
import type { Product } from '../../catalog/types'

export interface FarmPhoto {
  id: number
  imagePath: string
  position: number
}

export interface Review {
  id: number
  rating: number
  text: string
  createdAt: string
  user: { id: number; fullName: string | null }
}

export interface Farm {
  id: number
  name: string
  description: string | null
  coverImagePath: string | null
  location: string | null
  activities: string[]
  instagram: string | null
  photos: FarmPhoto[]
  products: Product[]
  farmer: { id: number; fullName: string | null } | null
  avgRating: number | null
  reviewCount: number
}

export const farmsApi = {
  getFarm: (id: number) => apiFetch<Farm>(`/api/v1/farms/${id}`),
}

export const reviewsApi = {
  getReviews: (farmId: number, page = 1) =>
    apiFetch<{ data: Review[]; meta: { currentPage: number; lastPage: number; total: number } }>(
      `/api/v1/farms/${farmId}/reviews?page=${page}`
    ),
  createReview: (farmId: number, data: { rating: number; text: string }) =>
    apiFetch<Review>(`/api/v1/farms/${farmId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
