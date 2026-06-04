import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from './api'

export function useBecomeSeller() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApi.becomeSeller,
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user)
    },
  })
}
