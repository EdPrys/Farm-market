import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignupPage } from './-signup-page'

export const Route = createFileRoute('/signup')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: SignupPage,
})
