import { apiFetch } from '@/lib/api/fetch-client'
import type { User } from '@/shared/auth/types'

export interface UpdateProfileInput {
  fullName?: string | null
}

export interface BecomeSellerInput {
  isSeller: true
  farmName: string
}

export const profileApi = {
  updateProfile: (data: UpdateProfileInput) =>
    apiFetch<User>('/api/v1/account/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  becomeSeller: (data: BecomeSellerInput) =>
    apiFetch<User>('/api/v1/account/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
