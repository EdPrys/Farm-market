import { createFileRoute } from '@tanstack/react-router'
import { EditProductPage } from './-edit-product-page'

export const Route = createFileRoute('/seller/products/$id/edit')({
  component: EditProductPage,
})
