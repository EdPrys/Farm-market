import { createFileRoute } from '@tanstack/react-router'
import { SellerProductsPage } from './-seller-products-page'

export const Route = createFileRoute('/seller/products/')({
  component: SellerProductsPage,
})
