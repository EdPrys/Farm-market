import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from './-login-page'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})
