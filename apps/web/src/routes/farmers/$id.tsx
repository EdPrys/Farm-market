import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '../../features/layout/app-layout'
import { FarmerProfilePage } from '../../features/farmers/farmer-profile-page'

export const Route = createFileRoute('/farmers/$id')({
  component: () => (
    <AppLayout>
      <FarmerProfilePage />
    </AppLayout>
  ),
})
