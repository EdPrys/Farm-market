import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi } from './api'

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sellerApi.deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
