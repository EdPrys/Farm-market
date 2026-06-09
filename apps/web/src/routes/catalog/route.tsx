// apps/web/src/routes/catalog/route.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { CatalogPage } from './-catalog-page'
import { AppLayout } from '@/shared/layout/app-layout'

const searchSchema = z.object({
  tab: z.enum(['products', 'requests']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/catalog')({
  validateSearch: searchSchema,
  component: () => (
    <AppLayout>
      <CatalogPage />
    </AppLayout>
  ),
})
