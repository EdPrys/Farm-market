import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from './api'

export function useSubscribe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.subscribe,
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user)
    },
  })
}
