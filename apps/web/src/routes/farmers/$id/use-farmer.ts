import { useQuery } from '@tanstack/react-query'
import { farmersApi } from './api'

export function useFarmer(id: number) {
  return useQuery({
    queryKey: ['farmer', id],
    queryFn: () => farmersApi.getFarmer(id),
    enabled: !isNaN(id),
  })
}
