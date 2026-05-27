import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage } from '../features/catalog/catalog-page'
import { AppLayout } from '../features/layout/app-layout'

export const Route = createFileRoute('/catalog')({
  component: () => (
    <AppLayout>
      <CatalogPage />
    </AppLayout>
  ),
})
