import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@farm-market/ui'
import { useCurrentUser } from '../../lib/auth/use-current-user'
import { useLogout } from '../../lib/auth/use-logout'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser()
  const logout = useLogout()
  const router = useRouter()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => void router.navigate({ to: '/login' }),
    })
  }

  if (isLoading) return <p className="p-8">Завантаження...</p>

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Особистий кабінет</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {user && (
            <div className="flex flex-col gap-1 text-sm">
              <p>Привіт, <span className="font-medium">{user.fullName ?? user.email}</span>!</p>
              <p className="text-muted-foreground">Email: {user.email}</p>
            </div>
          )}
          <Button variant="outline" onClick={handleLogout} disabled={logout.isPending}>
            {logout.isPending ? 'Виходимо...' : 'Вийти'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
