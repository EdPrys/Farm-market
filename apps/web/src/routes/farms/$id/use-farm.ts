import { useQuery } from '@tanstack/react-query'
import { farmsApi } from './api'

export function useFarm(id: number) {
  return useQuery({
    queryKey: ['farm', id],
    queryFn: () => farmsApi.getFarm(id),
    enabled: !isNaN(id),
  })
}
