import { createFileRoute } from '@tanstack/react-router'
import { ProductPage } from './-product-page'
import { AppLayout } from '@/shared/layout/app-layout'

export const Route = createFileRoute('/products/$id')({
  component: () => (
    <AppLayout>
      <ProductPage />
    </AppLayout>
  ),
})
