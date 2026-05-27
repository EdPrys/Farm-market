import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@farm-market/ui'
import { useSignup } from './use-signup'

export function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const signup = useSignup()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signup.mutateAsync({ fullName: fullName || null, email, password, passwordConfirmation })
    await router.navigate({ to: '/dashboard' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Реєстрація</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName">Повне ім'я</Label>
              <Input
                id="fullName"
                placeholder="Іван Петренко"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
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
                placeholder="мін. 8 символів"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="passwordConfirmation">Підтвердження пароля</Label>
              <Input
                id="passwordConfirmation"
                type="password"
                placeholder="••••••••"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />
            </div>
            {signup.isError && (
              <p className="text-sm text-destructive">
                {signup.error instanceof Error ? signup.error.message : 'Помилка реєстрації'}
              </p>
            )}
            <Button type="submit" disabled={signup.isPending}>
              {signup.isPending ? 'Завантаження...' : 'Зареєструватись'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
