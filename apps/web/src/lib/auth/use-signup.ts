import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/fetch-client'
import { useAuth } from './use-auth'
import type { AuthResponse } from './types'

interface SignupInput {
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export function useSignup() {
  const { setToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SignupInput) =>
      apiFetch<AuthResponse>('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: ({ token }) => {
      setToken(token)
      void queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
