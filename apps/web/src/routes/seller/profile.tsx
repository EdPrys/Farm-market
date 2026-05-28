import { createFileRoute } from '@tanstack/react-router'
import { SellerProfilePage } from '../../features/seller/seller-profile-page'

export const Route = createFileRoute('/seller/profile')({
  component: SellerProfilePage,
})
