import { apiFetch } from '@/lib/api/fetch-client'
import type { BuyerRequest, BuyerRequestsMeta, CreateBuyerRequestPayload, UpdateBuyerRequestPayload } from './types'

export const requestsApi = {
  getRequests: (params: { category?: string; location?: string; page?: number }) => {
    const p = new URLSearchParams()
    if (params.category) p.set('category', params.category)
    if (params.location) p.set('location', params.location)
    if (params.page && params.page > 1) p.set('page', String(params.page))
    const qs = p.toString()
    return apiFetch<{ data: BuyerRequest[]; meta: BuyerRequestsMeta }>(
      `/api/v1/requests${qs ? `?${qs}` : ''}`
    )
  },

  createRequest: (payload: CreateBuyerRequestPayload) =>
    apiFetch<BuyerRequest>('/api/v1/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  closeRequest: (id: number) =>
    apiFetch<BuyerRequest>(`/api/v1/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed' }),
    }),

  getRequest: (id: number) =>
    apiFetch<BuyerRequest>(`/api/v1/requests/${id}`),

  updateRequest: (id: number, payload: UpdateBuyerRequestPayload) =>
    apiFetch<BuyerRequest>(`/api/v1/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteRequest: (id: number) =>
    apiFetch<void>(`/api/v1/requests/${id}`, { method: 'DELETE' }),
}
