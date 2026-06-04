import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

  export const Route = createFileRoute('/chat')({
    beforeLoad: ({ context }) => {
      if (!context.auth.isAuthenticated) {
        throw redirect({ to: '/login' }) 
      }
    },
    component: () => <Outlet />,
  })