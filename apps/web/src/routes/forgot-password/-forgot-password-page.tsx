import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, Input, Label } from '@farm-market/ui'
import { useForgotPassword } from '@/shared/auth/use-forgot-password'
import { AuthLayout } from '@/shared/auth/auth-layout'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const forgotPassword = useForgotPassword()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await forgotPassword.mutateAsync({ email })
    } catch {
      // always show success to prevent user enumeration
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Перевірте пошту</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Якщо email зареєстрований — лист з інструкціями надіслано.
          </p>
          <Link to="/login" className="text-sm text-primary font-medium hover:underline">
            Повернутись до входу
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Забули пароль?</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Введіть email — надішлемо посилання для скидання
        </p>
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
          <Button type="submit" disabled={forgotPassword.isPending} className="w-full">
            {forgotPassword.isPending ? 'Надсилаємо...' : 'Надіслати посилання'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/login" className="text-primary font-medium hover:underline">
            Повернутись до входу
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
