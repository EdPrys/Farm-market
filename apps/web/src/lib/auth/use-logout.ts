import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/fetch-client'
import { useAuth } from './use-auth'

export function useLogout() {
  const { clearToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiFetch('/api/v1/account/logout', { method: 'POST' }),
    onSuccess: () => {
      clearToken()
      queryClient.clear()
    },
  })
}
