import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/shared/layout/app-layout'
import { FarmPage } from './-farm-page'

export const Route = createFileRoute('/farms/$id')({
  component: () => (
    <AppLayout>
      <FarmPage />
    </AppLayout>
  ),
})
