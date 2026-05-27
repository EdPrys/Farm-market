import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppLayout } from '../../features/layout/app-layout'
import { useCurrentUser } from '../../features/auth/use-current-user'

function SellerGuard() {
  const { data: user, isLoading } = useCurrentUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user && !user.isSeller) {
      void navigate({ to: '/catalog' })
    }
  }, [user, isLoading, navigate])

  if (isLoading) return null

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

export const Route = createFileRoute('/seller')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: SellerGuard,
})
