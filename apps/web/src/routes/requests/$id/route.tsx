import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/shared/layout/app-layout'
import { RequestDetailPage } from './-request-detail-page'

export const Route = createFileRoute('/requests/$id')({
  component: () => (
    <AppLayout>
      <RequestDetailPage />
    </AppLayout>
  ),
})
