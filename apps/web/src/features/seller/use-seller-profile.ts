import { useQuery } from '@tanstack/react-query'
import { sellerApi } from './api'

export function useSellerProfile() {
  return useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => sellerApi.getProfile(),
  })
}
