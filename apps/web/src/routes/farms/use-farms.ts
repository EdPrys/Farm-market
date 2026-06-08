import { useQuery } from '@tanstack/react-query'
import { farmsListApi } from './api'

export function useFarms(page = 1) {
  return useQuery({
    queryKey: ['farms', page],
    queryFn: () => farmsListApi.getFarms(page),
  })
}
