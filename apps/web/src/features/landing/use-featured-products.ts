import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '../catalog/api'

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: () => catalogApi.getProducts({ limit: 8, random: true }).then((r) => r.data),
  })
}
