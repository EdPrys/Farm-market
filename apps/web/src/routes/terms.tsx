import { createFileRoute } from '@tanstack/react-router'
import { TermsPage } from '@/features/legal/terms-page'
import { AppLayout } from '@/shared/layout/app-layout'

export const Route = createFileRoute('/terms')({
  component: () => (
    <AppLayout>
      <TermsPage />
    </AppLayout>
  ),
})
