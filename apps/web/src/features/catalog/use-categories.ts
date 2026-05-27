import { useQuery } from '@tanstack/react-query'
import { catalogApi } from './api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories().then((r) => r.data),
    staleTime: Infinity,
  })
}
