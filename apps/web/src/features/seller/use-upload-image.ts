import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi } from './api'

export function useUploadImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => sellerApi.uploadImage(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] })
    },
  })
}
