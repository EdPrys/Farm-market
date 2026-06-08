import { apiFetch } from '@/lib/api/fetch-client'

export interface FarmSummary {
  id: number
  name: string
  location: string | null
  coverImagePath: string | null
  activities: string[]
  reviewCount: number
  avgRating: number | null
}

export interface FarmsMeta {
  currentPage: number
  lastPage: number
  total: number
}

export const farmsListApi = {
  getFarms: (page = 1) =>
    apiFetch<{ data: FarmSummary[]; meta: FarmsMeta }>(`/api/v1/farms?page=${page}`),
}
