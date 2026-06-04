import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/shared/layout/app-layout'
import { CartPage } from './-cart-page'

export const Route = createFileRoute('/cart')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <AppLayout>
      <CartPage />
    </AppLayout>
  ),
})
