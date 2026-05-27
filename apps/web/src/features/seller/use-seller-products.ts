import { useQuery } from '@tanstack/react-query'
import { sellerApi } from './api'

export function useSellerProducts() {
  return useQuery({
    queryKey: ['seller-products'],
    queryFn: () => sellerApi.getProducts().then((r) => r.data),
  })
}
