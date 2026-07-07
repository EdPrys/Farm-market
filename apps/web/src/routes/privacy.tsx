import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPage } from '@/features/legal/privacy-page'
import { AppLayout } from '@/shared/layout/app-layout'

export const Route = createFileRoute('/privacy')({
  component: () => (
    <AppLayout>
      <PrivacyPage />
    </AppLayout>
  ),
})
