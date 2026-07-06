# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users request a password-reset email with a one-time link, then set a new password via a `/reset-password?token=…` page.

**Architecture:** A `password_reset_tokens` table stores short-lived (1h) tokens. Two new public API endpoints (`forgot-password`, `reset-password`) handle generation and consumption. Two new frontend pages mirror the existing auth pages pattern. Email is sent via the existing `sendEmail` helper (extended to support HTML).

**Tech Stack:** AdonisJS v6 + Lucid ORM (backend), React + TanStack Router + TanStack Query (frontend), Resend API (email), PostgreSQL (token storage).

---

## File Map

**Create:**
- `apps/api/database/migrations/1781200000000_create_password_reset_tokens_table.ts`
- `apps/api/app/models/password_reset_token.ts` *(after migration runs)*
- `apps/api/app/controllers/auth/password_reset_controller.ts`
- `apps/api/tests/functional/password_reset.spec.ts`
- `apps/web/src/routes/forgot-password/route.tsx`
- `apps/web/src/routes/forgot-password/-forgot-password-page.tsx`
- `apps/web/src/routes/reset-password/route.tsx`
- `apps/web/src/routes/reset-password/-reset-password-page.tsx`
- `apps/web/src/shared/auth/use-forgot-password.ts`
- `apps/web/src/shared/auth/use-reset-password.ts`

**Modify:**
- `apps/api/app/jobs/send_message_notification.ts` — add optional `html` field
- `apps/api/start/routes.ts` — add 2 routes inside the `auth` group
- `apps/api/.env.example` — add `FRONTEND_URL`
- `apps/web/src/shared/auth/api.ts` — add `forgotPassword` and `resetPassword`
- `apps/web/src/routes/login/-login-page.tsx` — fix "Забули пароль?" span → Link

---

## Task 1: Migration + PasswordResetToken model

**Files:**
- Create: `apps/api/database/migrations/1781200000000_create_password_reset_tokens_table.ts`
- Create: `apps/api/app/models/password_reset_token.ts`

- [ ] **Step 1: Create the migration file**

```ts
// apps/api/database/migrations/1781200000000_create_password_reset_tokens_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'password_reset_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('token', 64).notNullable().unique()
      table.timestamp('expires_at').notNullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

- [ ] **Step 2: Run the migration**

```bash
cd apps/api && node ace migration:run
```

Expected output:
```
[ info ] Upgrading migrations version from 1 to 1
❯ migrated database/migrations/1781200000000_create_password_reset_tokens_table
```

The `database/schema.ts` file auto-regenerates. Verify it now contains `PasswordResetTokenSchema`:

```bash
grep "PasswordResetTokenSchema" apps/api/database/schema.ts
```

Expected: `export class PasswordResetTokenSchema extends BaseModel {`

- [ ] **Step 3: Create the model**

The model class name `PasswordResetToken` → Lucid infers table `password_reset_tokens`. No `static tableName` needed. `static updatedAtColumn = null` because the table has no `updated_at`.

```ts
// apps/api/app/models/password_reset_token.ts
import { PasswordResetTokenSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class PasswordResetToken extends PasswordResetTokenSchema {
  static updatedAtColumn: string | null = null

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/database/migrations/1781200000000_create_password_reset_tokens_table.ts \
        apps/api/app/models/password_reset_token.ts \
        apps/api/database/schema.ts
git commit -m "feat: add password_reset_tokens table and model"
```

---

## Task 2: Extend sendEmail with HTML support

**Files:**
- Modify: `apps/api/app/jobs/send_message_notification.ts`

- [ ] **Step 1: Add `html` as optional parameter**

Replace the `sendEmail` function signature and body:

```ts
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  const apiKey = process.env.RESEND_API_KEY!
  const from = process.env.MAIL_FROM!

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text, ...(html ? { html } : {}) }),
  })

  if (!response.ok) {
    throw new Error(`Resend error: ${response.status} ${await response.text()}`)
  }
}
```

- [ ] **Step 2: Run existing unit tests to confirm nothing broke**

```bash
cd apps/api && node ace test unit
```

Expected: all unit tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/jobs/send_message_notification.ts
git commit -m "feat: add html support to sendEmail"
```

---

## Task 3: PasswordReset controller + routes + tests

**Files:**
- Create: `apps/api/app/controllers/auth/password_reset_controller.ts`
- Create: `apps/api/tests/functional/password_reset.spec.ts`
- Modify: `apps/api/start/routes.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// apps/api/tests/functional/password_reset.spec.ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import { DateTime } from 'luxon'

let savedFetch: typeof global.fetch

function mockFetch() {
  savedFetch = global.fetch
  global.fetch = async (_url: unknown, _init?: RequestInit) =>
    new Response(JSON.stringify({ id: 'test-id' }), { status: 200 })
}

function restoreFetch() {
  global.fetch = savedFetch
}

test.group('POST /api/v1/auth/forgot-password', (group) => {
  group.each.setup(() => {
    mockFetch()
    return testUtils.db().truncate()
  })
  group.each.teardown(restoreFetch)

  test('returns ok when email is not registered', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/forgot-password')
      .json({ email: 'nobody@example.com' })

    response.assertStatus(200)
    assert.equal(response.body().message, 'ok')
  })

  test('creates token and sends email when user exists', async ({ client, assert }) => {
    process.env.FRONTEND_URL = 'http://localhost:5173'
    const user = await User.create({ email: 'user@example.com', password: 'secret123' })

    const response = await client
      .post('/api/v1/auth/forgot-password')
      .json({ email: 'user@example.com' })

    response.assertStatus(200)
    assert.equal(response.body().message, 'ok')

    const token = await PasswordResetToken.findBy('userId', user.id)
    assert.isNotNull(token)
    assert.equal(token!.token.length, 64)
    assert.isTrue(token!.expiresAt > DateTime.now())
  })

  test('replaces existing token on second request', async ({ client, assert }) => {
    process.env.FRONTEND_URL = 'http://localhost:5173'
    const user = await User.create({ email: 'user2@example.com', password: 'secret123' })
    await PasswordResetToken.create({
      userId: user.id,
      token: 'a'.repeat(64),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    await client.post('/api/v1/auth/forgot-password').json({ email: 'user2@example.com' })

    const tokens = await PasswordResetToken.query().where('userId', user.id)
    assert.equal(tokens.length, 1)
    assert.notEqual(tokens[0].token, 'a'.repeat(64))
  })
})

test.group('POST /api/v1/auth/reset-password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('resets password with a valid token', async ({ client, assert }) => {
    const user = await User.create({ email: 'user3@example.com', password: 'oldpassword' })
    const tokenRecord = await PasswordResetToken.create({
      userId: user.id,
      token: 'b'.repeat(64),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const response = await client
      .post('/api/v1/auth/reset-password')
      .json({ token: 'b'.repeat(64), password: 'newpassword123' })

    response.assertStatus(200)
    assert.equal(response.body().message, 'ok')

    const remaining = await PasswordResetToken.find(tokenRecord.id)
    assert.isNull(remaining)

    await assert.doesNotReject(() =>
      User.verifyCredentials('user3@example.com', 'newpassword123')
    )
  })

  test('returns 422 for an expired token', async ({ client }) => {
    const user = await User.create({ email: 'user4@example.com', password: 'secret123' })
    await PasswordResetToken.create({
      userId: user.id,
      token: 'c'.repeat(64),
      expiresAt: DateTime.now().minus({ hours: 2 }),
    })

    const response = await client
      .post('/api/v1/auth/reset-password')
      .json({ token: 'c'.repeat(64), password: 'newpassword123' })

    response.assertStatus(422)
  })

  test('returns 422 for an unknown token', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/reset-password')
      .json({ token: 'd'.repeat(64), password: 'newpassword123' })

    response.assertStatus(422)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/api && node ace test functional --files "tests/functional/password_reset.spec.ts"
```

Expected: tests fail with route-not-found or import errors. This confirms TDD baseline.

- [ ] **Step 3: Create the controller**

```ts
// apps/api/app/controllers/auth/password_reset_controller.ts
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import { sendEmail } from '#jobs/send_message_notification'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import { z } from 'zod'
import { zodValidate } from '#lib/zod_validate'
import type { HttpContext } from '@adonisjs/core/http'

const forgotSchema = z.object({ email: z.string().email() })
const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export default class PasswordResetController {
  async forgot({ request }: HttpContext) {
    const { email } = zodValidate(forgotSchema, request.body())

    const user = await User.findBy('email', email)

    if (user) {
      await PasswordResetToken.query().where('userId', user.id).delete()

      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = DateTime.now().plus({ hours: 1 })
      await PasswordResetToken.create({ userId: user.id, token, expiresAt })

      const frontendUrl = process.env.FRONTEND_URL!
      const resetLink = `${frontendUrl}/reset-password?token=${token}`
      const name = user.fullName ?? user.email

      await sendEmail({
        to: user.email,
        subject: 'Скидання паролю — Farm Market',
        text: `Привіт, ${name}!\n\nДля скидання паролю перейдіть за посиланням:\n${resetLink}\n\nПосилання дійсне 1 годину.\n\nЯкщо ви не запитували скидання паролю, проігноруйте цей лист.`,
        html: `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
  <h2 style="font-size:20px;margin-bottom:8px">Скидання паролю</h2>
  <p>Привіт, ${name}!</p>
  <p>Ми отримали запит на скидання паролю для вашого акаунту.</p>
  <p style="margin:32px 0">
    <a href="${resetLink}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
      Скинути пароль
    </a>
  </p>
  <p style="color:#666;font-size:14px">Посилання дійсне 1 годину. Якщо ви не запитували скидання — проігноруйте цей лист.</p>
</body>
</html>`,
      })
    }

    return { message: 'ok' }
  }

  async reset({ request, response }: HttpContext) {
    const { token, password } = zodValidate(resetSchema, request.body())

    const resetToken = await PasswordResetToken.query()
      .where('token', token)
      .whereRaw('expires_at > NOW()')
      .first()

    if (!resetToken) {
      return response.unprocessableEntity({
        errors: [{ message: 'Посилання недійсне або застаріло' }],
      })
    }

    const user = await User.findOrFail(resetToken.userId)
    user.password = password
    await user.save()

    await resetToken.delete()

    return { message: 'ok' }
  }
}
```

- [ ] **Step 4: Add routes inside the existing `auth` group in `start/routes.ts`**

Find the block:
```ts
router
  .group(() => {
    router.post('signup', [controllers.auth.NewAccount, 'store'])
    router.post('login', [controllers.auth.AccessTokens, 'store'])
  })
  .prefix('auth')
  .as('auth')
```

Replace with:
```ts
router
  .group(() => {
    router.post('signup', [controllers.auth.NewAccount, 'store'])
    router.post('login', [controllers.auth.AccessTokens, 'store'])
    router.post('forgot-password', [controllers.auth.PasswordReset, 'forgot'])
    router.post('reset-password', [controllers.auth.PasswordReset, 'reset'])
  })
  .prefix('auth')
  .as('auth')
```

- [ ] **Step 5: Run tests — this also triggers registry regeneration**

The `generateRegistry()` init hook runs when the app boots, scanning `app/controllers/` and regenerating `.adonisjs/server/controllers.ts` to include `PasswordReset`.

```bash
cd apps/api && node ace test functional --files "tests/functional/password_reset.spec.ts"
```

Expected: all 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/controllers/auth/password_reset_controller.ts \
        apps/api/tests/functional/password_reset.spec.ts \
        apps/api/start/routes.ts \
        apps/api/.adonisjs/server/controllers.ts
git commit -m "feat: add forgot-password and reset-password API endpoints"
```

---

## Task 4: Frontend — API methods + /forgot-password page

**Files:**
- Modify: `apps/web/src/shared/auth/api.ts`
- Create: `apps/web/src/shared/auth/use-forgot-password.ts`
- Create: `apps/web/src/routes/forgot-password/route.tsx`
- Create: `apps/web/src/routes/forgot-password/-forgot-password-page.tsx`

- [ ] **Step 1: Add API methods to `apps/web/src/shared/auth/api.ts`**

Append inside the `authApi` object (after `profile`):
```ts
  forgotPassword: (data: { email: string }) =>
    apiFetch<{ message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetPassword: (data: { token: string; password: string }) =>
    apiFetch<{ message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
```

- [ ] **Step 2: Create the useForgotPassword hook**

```ts
// apps/web/src/shared/auth/use-forgot-password.ts
import { useMutation } from '@tanstack/react-query'
import { authApi } from './api'

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword })
}
```

- [ ] **Step 3: Create the route file**

```tsx
// apps/web/src/routes/forgot-password/route.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { ForgotPasswordPage } from './-forgot-password-page'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: ForgotPasswordPage,
})
```

- [ ] **Step 4: Create the page component**

```tsx
// apps/web/src/routes/forgot-password/-forgot-password-page.tsx
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
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/auth/api.ts \
        apps/web/src/shared/auth/use-forgot-password.ts \
        apps/web/src/routes/forgot-password/
git commit -m "feat: add forgot-password page"
```

---

## Task 5: Frontend — /reset-password page

**Files:**
- Create: `apps/web/src/shared/auth/use-reset-password.ts`
- Create: `apps/web/src/routes/reset-password/route.tsx`
- Create: `apps/web/src/routes/reset-password/-reset-password-page.tsx`

- [ ] **Step 1: Create the useResetPassword hook**

```ts
// apps/web/src/shared/auth/use-reset-password.ts
import { useMutation } from '@tanstack/react-query'
import { authApi } from './api'

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword })
}
```

- [ ] **Step 2: Create the route file**

`validateSearch` makes `token` available as a typed search param via `Route.useSearch()`.

```tsx
// apps/web/src/routes/reset-password/route.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordPage } from './-reset-password-page'

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/reset-password')({
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: ResetPasswordPage,
})
```

- [ ] **Step 3: Create the page component**

```tsx
// apps/web/src/routes/reset-password/-reset-password-page.tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/shared/auth/use-reset-password.ts \
        apps/web/src/routes/reset-password/
git commit -m "feat: add reset-password page"
```

---

## Task 6: Fix login page link + add FRONTEND_URL to env

**Files:**
- Modify: `apps/web/src/routes/login/-login-page.tsx`
- Modify: `apps/api/.env.example`

- [ ] **Step 1: Fix "Забули пароль?" in login page**

In `apps/web/src/routes/login/-login-page.tsx`, replace:
```tsx
<span className="text-sm text-primary font-medium cursor-default">Забули пароль?</span>
```

With:
```tsx
<Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
  Забули пароль?
</Link>
```

`Link` is already imported from `@tanstack/react-router` at the top of the file.

- [ ] **Step 2: Add FRONTEND_URL to .env.example**

In `apps/api/.env.example`, after the `APP_URL=http://localhost:3333` line, add:
```
FRONTEND_URL=http://localhost:5173
```

Also add `FRONTEND_URL` to the Railway environment variables (do this in Railway dashboard for the API service).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/login/-login-page.tsx \
        apps/api/.env.example
git commit -m "feat: wire up forgot-password link on login page"
```
