import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordPage } from './-reset-password-page'

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/reset-password')({
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: ResetPasswordPage,
})
