import { useRouter } from '@tanstack/react-router'
import { Button } from '@farm-market/ui'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { useLogout } from '@/shared/auth/use-logout'
import { AuthLayout } from '@/shared/auth/auth-layout'

export function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser()
  const logout = useLogout()
  const router = useRouter()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => void router.navigate({ to: '/login' }),
    })
  }

  if (isLoading) {
    return (
      <AuthLayout>
        <p className="text-muted-foreground">Завантаження...</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Особистий кабінет</h1>
          <p className="text-sm text-muted-foreground">Керуйте своїм акаунтом</p>
        </div>
        {user && (
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {user.initials}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.fullName ?? user.email}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        <Button variant="outline" onClick={handleLogout} disabled={logout.isPending} className="w-full">
          {logout.isPending ? 'Виходимо...' : 'Вийти'}
        </Button>
      </div>
    </AuthLayout>
  )
}
