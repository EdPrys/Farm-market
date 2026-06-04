import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from './api'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user)
    },
  })
}
