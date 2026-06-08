import { createFileRoute, redirect } from '@tanstack/react-router'
import { ForgotPasswordPage } from './-forgot-password-page'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: ForgotPasswordPage,
})
