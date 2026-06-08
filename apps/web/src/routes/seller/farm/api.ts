import { apiFetch } from '@/lib/api/fetch-client'
import type { FarmPhoto } from '../../farms/$id/api'

export interface SellerFarm {
  id: number
  name: string
  description: string | null
  coverImagePath: string | null
  location: string | null
  activities: string[]
  instagram: string | null
  photos: FarmPhoto[]
}

export interface FarmInput {
  name: string
  description?: string | null
  location?: string | null
  activities?: string[]
  instagram?: string | null
}

export const sellerFarmApi = {
  getFarm: () => apiFetch<SellerFarm>('/api/v1/seller/farm'),
  createFarm: (data: FarmInput) =>
    apiFetch<SellerFarm>('/api/v1/seller/farm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFarm: (data: Partial<FarmInput>) =>
    apiFetch<SellerFarm>('/api/v1/seller/farm', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  uploadCover: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiFetch<SellerFarm>('/api/v1/seller/farm/cover', { method: 'POST', body: form })
  },
  addPhoto: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiFetch<SellerFarm>('/api/v1/seller/farm/photos', { method: 'POST', body: form })
  },
  deletePhoto: (photoId: number) =>
    apiFetch<null>(`/api/v1/seller/farm/photos/${photoId}`, { method: 'DELETE' }),
}
