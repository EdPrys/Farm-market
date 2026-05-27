import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { authApi } from './api'

export function useSignup() {
  const { setToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: ({ token }) => {
      setToken(token)
      void queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
