import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@farm-market/ui'
import { useLogin } from './use-login'

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вхід</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
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
            <div className="flex flex-col gap-1.5">
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
            {login.isError && (
              <p className="text-sm text-destructive">
                {login.error instanceof Error ? login.error.message : 'Помилка входу'}
              </p>
            )}
            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? 'Завантаження...' : 'Увійти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
