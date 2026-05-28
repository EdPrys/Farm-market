import { useQuery } from '@tanstack/react-query'
import { sellerApi } from '../products/api'

export function useSellerProfile() {
  return useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => sellerApi.getProfile(),
  })
}
