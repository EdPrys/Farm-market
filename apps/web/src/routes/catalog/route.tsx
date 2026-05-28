import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage } from './-catalog-page'
import { AppLayout } from '@/shared/layout/app-layout'

export const Route = createFileRoute('/catalog')({
  component: () => (
    <AppLayout>
      <CatalogPage />
    </AppLayout>
  ),
})
