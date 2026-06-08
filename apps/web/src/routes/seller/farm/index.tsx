import { createFileRoute } from '@tanstack/react-router'
import { SellerFarmPage } from './-seller-farm-page'

export const Route = createFileRoute('/seller/farm/')({
  component: SellerFarmPage,
})
