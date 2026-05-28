import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi } from '../api'

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sellerApi.createProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
