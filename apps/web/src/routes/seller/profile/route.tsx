import { createFileRoute } from '@tanstack/react-router'
import { SellerProfilePage } from './-seller-profile-page'

export const Route = createFileRoute('/seller/profile')({
  component: SellerProfilePage,
})
