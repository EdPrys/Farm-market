import { apiFetch } from '../../../lib/api/fetch-client'
import type { Product } from '../../catalog/types'

export interface SellerProfile {
  phone: string | null
  telegram: string | null
  viber: string | null
}

export interface ProductInput {
  name: string
  categoryId: number
  description?: string | null
  price: number
  unit: string
  quantity: number
  status?: 'active' | 'inactive' | 'archived'
}

export type ProductUpdateInput = Partial<ProductInput>

export const sellerApi = {
  getProfile: () => apiFetch<SellerProfile>('/api/v1/seller/profile'),
  updateProfile: (data: Partial<SellerProfile>) =>
    apiFetch<SellerProfile>('/api/v1/seller/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getProducts: () => apiFetch<{ data: Product[] }>('/api/v1/seller/products'),
  createProduct: (data: ProductInput) =>
    apiFetch<Product>('/api/v1/seller/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: number, data: ProductUpdateInput) =>
    apiFetch<Product>(`/api/v1/seller/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: number) =>
    apiFetch<null>(`/api/v1/seller/products/${id}`, { method: 'DELETE' }),
  uploadImage: (id: number, file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiFetch<Product>(`/api/v1/seller/products/${id}/image`, {
      method: 'POST',
      body: form,
    })
  },
}
