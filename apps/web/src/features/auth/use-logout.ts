import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { authApi } from './api'

export function useLogout() {
  const { clearToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearToken()
      queryClient.clear()
    },
  })
}
