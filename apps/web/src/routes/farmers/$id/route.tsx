import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/shared/layout/app-layout'
import { FarmerProfilePage } from './-farmer-profile-page'

export const Route = createFileRoute('/farmers/$id')({
  component: () => (
    <AppLayout>
      <FarmerProfilePage />
    </AppLayout>
  ),
})
