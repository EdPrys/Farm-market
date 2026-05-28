import { createFileRoute } from '@tanstack/react-router'
import { NewProductPage } from './-new-product-page'

export const Route = createFileRoute('/seller/products/new')({
  component: NewProductPage,
})
