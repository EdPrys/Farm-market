import { apiFetch } from '../../lib/api/fetch-client'
import type { Category, Product } from './types'

interface GetProductsParams {
  category?: string
  search?: string
}

export const catalogApi = {
  getProducts: ({ category, search }: GetProductsParams) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    const qs = params.toString()
    return apiFetch<{ data: Product[] }>(`/api/v1/products${qs ? `?${qs}` : ''}`)
  },
  getProduct: (id: number) => apiFetch<Product>(`/api/v1/products/${id}`),
  getCategories: () => apiFetch<{ data: Category[] }>('/api/v1/categories'),
}
