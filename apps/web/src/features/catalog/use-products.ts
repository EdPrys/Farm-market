import { useQuery } from '@tanstack/react-query'
import { catalogApi } from './api'

interface UseProductsParams {
  category?: string
  search?: string
}

export function useProducts(params: UseProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => catalogApi.getProducts(params).then((r) => r.data),
  })
}
