import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Button, Input, Label } from '@farm-market/ui'
import { useLogin } from '@/shared/auth/use-login'
import { AuthLayout } from '@/shared/auth/auth-layout'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login.mutateAsync({ email, password })
    await router.navigate({ to: '/dashboard' })
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Вхід</h1>
        <p className="text-sm text-muted-foreground mb-8">Раді вас бачити знову</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="text-right -mt-1">
            <span className="text-sm text-primary font-medium cursor-default">Забули пароль?</span>
          </div>
          {login.isError && (
            <p className="text-sm text-destructive">
              {login.error instanceof Error ? login.error.message : 'Помилка входу'}
            </p>
          )}
          <Button type="submit" disabled={login.isPending} className="w-full">
            {login.isPending ? 'Завантаження...' : 'Увійти'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Немає акаунту?{' '}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            Зареєструватись
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
