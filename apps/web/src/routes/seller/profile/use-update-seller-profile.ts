import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi } from '../products/api'

export function useUpdateSellerProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sellerApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['seller', 'profile'], data)
    },
  })
}
