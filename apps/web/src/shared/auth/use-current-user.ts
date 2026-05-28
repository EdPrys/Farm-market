import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { authApi } from './api'

export function useCurrentUser() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['user'],
    queryFn: authApi.profile,
    enabled: !!token,
    retry: false,
  })
}
