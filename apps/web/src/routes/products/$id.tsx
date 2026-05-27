import { createFileRoute } from '@tanstack/react-router'
import { ProductPage } from '../../features/catalog/product-page'
import { AppLayout } from '../../features/layout/app-layout'

export const Route = createFileRoute('/products/$id')({
  component: () => (
    <AppLayout>
      <ProductPage />
    </AppLayout>
  ),
})
