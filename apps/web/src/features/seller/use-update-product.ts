import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi, type ProductUpdateInput } from './api'

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdateInput }) =>
      sellerApi.updateProduct(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
