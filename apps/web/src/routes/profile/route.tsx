import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/shared/layout/app-layout'
import { ProfilePage } from './-profile-page'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <AppLayout>
      <ProfilePage />
    </AppLayout>
  ),
})
