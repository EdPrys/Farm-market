import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Button, Input, Label, Checkbox } from '@farm-market/ui'
import { getFieldError, ApiValidationError } from '@/lib/api/errors'
import { useSignup } from '@/shared/auth/use-signup'
import { AuthLayout } from '@/shared/auth/auth-layout'

export function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isSeller, setIsSeller] = useState(false)
  const [farmName, setFarmName] = useState('')
  const signup = useSignup()
  const router = useRouter()

  const fieldError = (field: string) => getFieldError(signup.error, field)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signup.mutateAsync({
      fullName: fullName || null,
      email,
      password,
      passwordConfirmation,
      isSeller,
      farmName: isSeller && farmName ? farmName : null,
    })
    await router.navigate({ to: '/catalog' })
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Реєстрація</h1>
        <p className="text-sm text-muted-foreground mb-8">Створіть свій акаунт</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Повне ім'я</Label>
            <Input
              id="fullName"
              placeholder="Іван Петренко"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {fieldError('fullName') && (
              <p className="text-xs text-red-500 mt-0.5">{fieldError('fullName')}</p>
            )}
          </div>
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
            {fieldError('email') && (
              <p className="text-xs text-red-500 mt-0.5">{fieldError('email')}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="мін. 8 символів"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {fieldError('password') && (
              <p className="text-xs text-red-500 mt-0.5">{fieldError('password')}</p>
            )}
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
            {fieldError('passwordConfirmation') && (
              <p className="text-xs text-red-500 mt-0.5">{fieldError('passwordConfirmation')}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isSeller"
              checked={isSeller}
              onCheckedChange={(checked) => setIsSeller(checked === true)}
            />
            <Label htmlFor="isSeller" className="cursor-pointer">
              Я продавець — хочу продавати товари
            </Label>
          </div>
          {isSeller && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="farmName">Назва ферми або господарства</Label>
              <Input
                id="farmName"
                placeholder="Ферма Петренків"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
              />
            </div>
          )}
          {signup.isError && !(signup.error instanceof ApiValidationError) && (
            <p className="text-sm text-destructive">
              {signup.error instanceof Error ? signup.error.message : 'Помилка реєстрації'}
            </p>
          )}
          <Button type="submit" disabled={signup.isPending} className="w-full">
            {signup.isPending ? 'Завантаження...' : 'Зареєструватись'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Вже є акаунт?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
