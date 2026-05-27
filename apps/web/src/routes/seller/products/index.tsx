import { createFileRoute } from '@tanstack/react-router'
import { SellerProductsPage } from '../../../features/seller/seller-products-page'

export const Route = createFileRoute('/seller/products/')({
  component: SellerProductsPage,
})
