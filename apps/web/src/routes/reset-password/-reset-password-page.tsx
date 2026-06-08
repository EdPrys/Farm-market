import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Button, Input, Label } from '@farm-market/ui'
import { useResetPassword } from '@/shared/auth/use-reset-password'
import { AuthLayout } from '@/shared/auth/auth-layout'
import { Route } from './route'

export function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const resetPassword = useResetPassword()
  const router = useRouter()

  if (!token) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Недійсне посилання</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Посилання для скидання паролю відсутнє або пошкоджене.
          </p>
          <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
            Запросити нове посилання
          </Link>
        </div>
      </AuthLayout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (password !== passwordConfirmation) {
      setValidationError('Паролі не збігаються')
      return
    }

    await resetPassword.mutateAsync({ token, password })
    await router.navigate({ to: '/login' })
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Новий пароль</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Введіть новий пароль для вашого акаунту
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Новий пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="мін. 8 символів"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-2">
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
          {(validationError || resetPassword.isError) && (
            <p className="text-sm text-destructive">
              {validationError ??
                (resetPassword.error instanceof Error
                  ? resetPassword.error.message
                  : 'Помилка скидання паролю')}
            </p>
          )}
          <Button type="submit" disabled={resetPassword.isPending} className="w-full">
            {resetPassword.isPending ? 'Завантаження...' : 'Змінити пароль'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
