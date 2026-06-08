import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/shared/layout/app-layout'
import { FarmsPage } from './-farms-page'

export const Route = createFileRoute('/farms/')({
  component: () => (
    <AppLayout>
      <FarmsPage />
    </AppLayout>
  ),
})
