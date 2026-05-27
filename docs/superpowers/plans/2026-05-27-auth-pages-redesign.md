# Auth Pages Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign login, signup, and dashboard pages with a split-panel layout (green brand panel left, form right) and a Farm Market SVG logo.

**Architecture:** Extract a shared `Logo` component and `AuthLayout` wrapper. Each page imports `AuthLayout` and renders its content inside it. Primary brand color updated in the shared CSS to green to unify all shadcn buttons and focus rings.

**Tech Stack:** React 19, Tailwind v4, shadcn/ui (`@farm-market/ui`), TanStack Router `<Link>`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/ui/src/styles.css` | Modify | Update `--primary` CSS variable to green |
| `apps/web/src/features/auth/logo.tsx` | Create | SVG leaf + "Farm / MARKET" wordmark |
| `apps/web/src/features/auth/auth-layout.tsx` | Create | Split layout: green left panel + white right panel |
| `apps/web/src/features/auth/login-page.tsx` | Modify | Use AuthLayout, add forgot-password link, signup link |
| `apps/web/src/features/auth/signup-page.tsx` | Modify | Use AuthLayout, add login link |
| `apps/web/src/features/auth/dashboard-page.tsx` | Modify | Use AuthLayout, centered user card |

---

### Task 1: Update primary color to green

**Files:**
- Modify: `packages/ui/src/styles.css:35-36`

- [ ] **Step 1: Update `--primary` and `--ring` CSS variables**

Open `packages/ui/src/styles.css`. Replace the current black primary with green-700:

```css
/* Before */
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
```

```css
/* After — green-700 (#15803d) */
--primary: oklch(0.448 0.15 145.5);
--primary-foreground: oklch(0.985 0 0);
--ring: oklch(0.448 0.15 145.5);
```

- [ ] **Step 2: Start the dev server and verify**

```bash
cd apps/web && pnpm dev
```

Open `http://localhost:5173/login`. The "Увійти" button should now be green instead of black.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/styles.css
git commit -m "feat(ui): set green as primary brand color"
```

---

### Task 2: Logo component

**Files:**
- Create: `apps/web/src/features/auth/logo.tsx`

- [ ] **Step 1: Create the file**

```tsx
export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d="M20 4C20 4 8 10 8 22C8 28.627 13.373 34 20 34C26.627 34 32 28.627 32 22C32 10 20 4 20 4Z"
          fill="white"
          opacity="0.9"
        />
        <path d="M20 14L20 34" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 20C14 20 17 19 20 21" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div>
        <div className="text-white text-xl font-extrabold tracking-tight leading-none">Farm</div>
        <div className="text-green-300 text-[11px] font-semibold tracking-[3px] uppercase">Market</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
pnpm -F web typecheck
```

Expected: no errors.

---

### Task 3: AuthLayout component

**Files:**
- Create: `apps/web/src/features/auth/auth-layout.tsx`

- [ ] **Step 1: Create the file**

```tsx
import type { ReactNode } from 'react'
import { Logo } from './logo'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[480px] flex-col justify-between bg-gradient-to-br from-[#14532d] via-[#15803d] to-[#16a34a] p-12">
        <Logo />
        <div>
          <p className="text-white text-3xl font-bold leading-snug mb-3">
            Свіжі продукти<br />від місцевих<br />фермерів
          </p>
          <p className="text-green-300 text-sm leading-relaxed">
            Приєднуйтесь до спільноти<br />здорового харчування
          </p>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/50" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
pnpm -F web typecheck
```

Expected: no errors.

---

### Task 4: Redesign login page

**Files:**
- Modify: `apps/web/src/features/auth/login-page.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Button, Input, Label } from '@farm-market/ui'
import { useLogin } from './use-login'
import { AuthLayout } from './auth-layout'

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
```

- [ ] **Step 2: Verify and view in browser**

```bash
pnpm -F web typecheck
```

Open `http://localhost:5173/login` — split layout with green panel on left, form on right.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/auth/logo.tsx \
        apps/web/src/features/auth/auth-layout.tsx \
        apps/web/src/features/auth/login-page.tsx
git commit -m "feat(web): auth layout with split panel and logo"
```

---

### Task 5: Redesign signup page

**Files:**
- Modify: `apps/web/src/features/auth/signup-page.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Button, Input, Label } from '@farm-market/ui'
import { useSignup } from './use-signup'
import { AuthLayout } from './auth-layout'

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
    <AuthLayout>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Реєстрація</h1>
        <p className="text-sm text-muted-foreground mb-8">Створіть свій акаунт</p>
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
```

- [ ] **Step 2: Verify and view in browser**

```bash
pnpm -F web typecheck
```

Open `http://localhost:5173/signup` — same split layout, 4 fields, link to login.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/auth/signup-page.tsx
git commit -m "feat(web): redesign signup page"
```

---

### Task 6: Redesign dashboard page

**Files:**
- Modify: `apps/web/src/features/auth/dashboard-page.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import { Link, useRouter } from '@tanstack/react-router'
import { Button } from '@farm-market/ui'
import { useCurrentUser } from './use-current-user'
import { useLogout } from './use-logout'
import { AuthLayout } from './auth-layout'

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
```

- [ ] **Step 2: Verify and view in browser**

```bash
pnpm -F web typecheck
```

Open `http://localhost:5173/dashboard` (після логіну) — split layout, avatar з ініціалами, кнопка виходу.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/auth/dashboard-page.tsx
git commit -m "feat(web): redesign dashboard page"
```
