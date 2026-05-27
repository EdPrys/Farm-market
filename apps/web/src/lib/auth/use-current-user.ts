import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/fetch-client'
import { useAuth } from './use-auth'
import type { User } from './types'

export function useCurrentUser() {
  const { token } = useAuth()
  return useQuery<User>({
    queryKey: ['user'],
    queryFn: () => apiFetch<User>('/api/v1/account/profile'),
    enabled: !!token,
    retry: false,
  })
}
