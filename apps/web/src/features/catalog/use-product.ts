import { useQuery } from '@tanstack/react-query'
import { catalogApi } from './api'

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => catalogApi.getProduct(id),
  })
}
