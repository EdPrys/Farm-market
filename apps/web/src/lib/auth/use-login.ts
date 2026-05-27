import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/fetch-client'
import { useAuth } from './use-auth'
import type { AuthResponse } from './types'

interface LoginInput {
  email: string
  password: string
}

export function useLogin() {
  const { setToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginInput) =>
      apiFetch<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: ({ token }) => {
      setToken(token)
      void queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
