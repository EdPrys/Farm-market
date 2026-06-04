# Buyer Profile & Auth-Gated Nav Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Мої товари" / "Кошик" / "Профіль" to the navbar for logged-in users, and create a buyer profile page with name editing and "become seller" flow backed by a new PATCH endpoint.

**Architecture:** New `PATCH /api/v1/account/profile` endpoint updates `fullName` or promotes a buyer to seller (`isSeller=true`, `farmName`). The frontend `/profile` route is auth-gated and shows two forms; on success both forms invalidate the `['user']` React Query cache so the navbar updates reactively.

**Tech Stack:** AdonisJS v6 (Japa tests), React + TanStack Router + React Query, Zod (shared validators), Tailwind, Vitest

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `packages/shared/src/schemas/user.ts` | Modify | Add `updateProfileSchema` + `UpdateProfileInput` |
| `apps/api/app/validators/account.ts` | Create | Re-export schema from shared (mirrors `validators/user.ts` pattern) |
| `apps/api/app/controllers/account/profile_controller.ts` | Modify | Add `update` method |
| `apps/api/start/routes.ts` | Modify | Add `router.patch('profile', ...)` inside account group |
| `apps/api/tests/functional/account_profile.spec.ts` | Create | Japa functional tests |
| `apps/web/src/shared/layout/app-layout.tsx` | Modify | Conditional nav visibility |
| `apps/web/src/routes/profile/route.tsx` | Create | Auth-gated route (redirects to /login if not authenticated) |
| `apps/web/src/routes/profile/-profile-page.tsx` | Create | Page with two forms |
| `apps/web/src/routes/profile/api.ts` | Create | `profileApi.updateProfile` + `profileApi.becomeSeller` |
| `apps/web/src/routes/profile/use-update-profile.ts` | Create | Mutation hook — invalidates `['user']` on success |
| `apps/web/src/routes/profile/use-become-seller.ts` | Create | Mutation hook — invalidates `['user']` on success |
| `apps/web/src/routes/profile/__tests__/api.test.ts` | Create | Vitest tests for API client |

---

## Task 1: Add `updateProfileSchema` to shared package

**Files:**
- Modify: `packages/shared/src/schemas/user.ts`

- [ ] **Step 1: Add schema and type to `packages/shared/src/schemas/user.ts`**

Append after the existing `updateSellerProfileSchema` block:

```ts
export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(255).nullable().optional(),
  isSeller: z.literal(true).optional(),
  farmName: z.string().min(1).max(255).optional(),
}).refine(
  (data) => !data.isSeller || !!data.farmName,
  { message: 'farmName is required when registering as seller', path: ['farmName'] }
)
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
```

- [ ] **Step 2: Create backend validator file**

Create `apps/api/app/validators/account.ts`:

```ts
export { updateProfileSchema } from '@farm-market/shared'
export type { UpdateProfileInput } from '@farm-market/shared'
```

---

## Task 2: Write failing backend tests

**Files:**
- Create: `apps/api/tests/functional/account_profile.spec.ts`

- [ ] **Step 1: Create the test file**

```ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('PATCH /api/v1/account/profile — auth guard', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('rejects unauthenticated request', async ({ client }) => {
    const response = await client.patch('/api/v1/account/profile').json({ fullName: 'Test' })
    response.assertStatus(401)
  })
})

test.group('PATCH /api/v1/account/profile — update fullName', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('updates fullName and returns updated user', async ({ client, assert }) => {
    const user = await User.create({
      email: 'buyer@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client
      .patch('/api/v1/account/profile')
      .loginAs(user)
      .json({ fullName: 'Іван Петренко' })
    response.assertStatus(200)
    assert.equal(response.body().fullName, 'Іван Петренко')
    assert.isFalse(response.body().isSeller)
  })

  test('sets fullName to null', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Старе Імʼя',
      email: 'buyer2@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client
      .patch('/api/v1/account/profile')
      .loginAs(user)
      .json({ fullName: null })
    response.assertStatus(200)
    assert.isNull(response.body().fullName)
  })
})

test.group('PATCH /api/v1/account/profile — become seller', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('sets isSeller=true and farmName', async ({ client, assert }) => {
    const user = await User.create({
      email: 'buyer3@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client
      .patch('/api/v1/account/profile')
      .loginAs(user)
      .json({ isSeller: true, farmName: 'Ферма Тест' })
    response.assertStatus(200)
    assert.isTrue(response.body().isSeller)
    assert.equal(response.body().farmName, 'Ферма Тест')
  })

  test('rejects become-seller without farmName', async ({ client }) => {
    const user = await User.create({
      email: 'buyer4@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client
      .patch('/api/v1/account/profile')
      .loginAs(user)
      .json({ isSeller: true })
    response.assertStatus(422)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/api && node ace test --files=tests/functional/account_profile.spec.ts
```

Expected: all tests fail with 404 (route does not exist yet).

---

## Task 3: Implement backend controller method + route

**Files:**
- Modify: `apps/api/app/controllers/account/profile_controller.ts`
- Modify: `apps/api/start/routes.ts`

- [ ] **Step 1: Add `update` method to `ProfileController`**

Replace the entire file:

```ts
import UserTransformer from '#transformers/user_transformer'
import { updateProfileSchema } from '#validators/account'
import { zodValidate } from '#lib/zod_validate'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth, serialize }: HttpContext) {
    return serialize.withoutWrapping(UserTransformer.transform(auth.getUserOrFail()))
  }

  async update({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = zodValidate(updateProfileSchema, request.body())

    if (data.fullName !== undefined) {
      user.fullName = data.fullName
    }
    if (data.isSeller) {
      user.isSeller = true
      user.farmName = data.farmName!
    }
    await user.save()
    return serialize.withoutWrapping(UserTransformer.transform(user))
  }
}
```

- [ ] **Step 2: Add PATCH route in `apps/api/start/routes.ts`**

Inside the `account` group (alongside the existing `router.get('profile', ...)`), add:

```ts
router.patch('profile', [controllers.account.Profile, 'update'])
```

The account group should look like:

```ts
router
  .group(() => {
    router.get('profile', [controllers.account.Profile, 'show'])
    router.patch('profile', [controllers.account.Profile, 'update'])
    router.post('logout', [controllers.auth.AccessTokens, 'destroy'])
  })
  .prefix('account')
  .as('profile')
  .use(middleware.auth())
```

- [ ] **Step 3: Run backend tests to confirm they pass**

```bash
cd apps/api && node ace test --files=tests/functional/account_profile.spec.ts
```

Expected: all 5 tests pass.

---

## Task 4: Update navbar

**Files:**
- Modify: `apps/web/src/shared/layout/app-layout.tsx`

- [ ] **Step 1: Replace the `<nav>` block**

Replace the entire `<nav>` element with:

```tsx
<nav className="flex items-center gap-6 text-sm font-medium">
  <Link
    to="/catalog"
    className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
  >
    Каталог
  </Link>
  {user?.isSeller && (
    <Link
      to="/seller/products"
      className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
    >
      Мої товари
    </Link>
  )}
  {user && (
    <>
      <button className="text-gray-400 cursor-not-allowed" disabled>
        Кошик
      </button>
      <Link
        to={user.isSeller ? '/seller/profile' : '/profile'}
        className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
      >
        Профіль
      </Link>
      <button
        onClick={() => void logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })}
        className="text-gray-700 hover:text-red-600"
      >
        Вийти
      </button>
    </>
  )}
</nav>
```

---

## Task 5: Write failing frontend API tests

**Files:**
- Create: `apps/web/src/routes/profile/__tests__/api.test.ts`

- [ ] **Step 1: Create the test file**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { profileApi } from '../api'

const mockFetch = vi.fn()

describe('profileApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('updateProfile', () => {
    it('sends PATCH to /api/v1/account/profile with fullName', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, fullName: 'Іван', isSeller: false }),
      })
      await profileApi.updateProfile({ fullName: 'Іван' })
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/account/profile')
      expect(init.method).toBe('PATCH')
      expect(JSON.parse(init.body as string)).toEqual({ fullName: 'Іван' })
    })

    it('sends fullName: null to clear name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, fullName: null, isSeller: false }),
      })
      await profileApi.updateProfile({ fullName: null })
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(JSON.parse(init.body as string)).toEqual({ fullName: null })
    })
  })

  describe('becomeSeller', () => {
    it('sends PATCH to /api/v1/account/profile with isSeller and farmName', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, isSeller: true, farmName: 'Ферма Тест' }),
      })
      await profileApi.becomeSeller({ isSeller: true, farmName: 'Ферма Тест' })
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/account/profile')
      expect(init.method).toBe('PATCH')
      expect(JSON.parse(init.body as string)).toEqual({ isSeller: true, farmName: 'Ферма Тест' })
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/web && pnpm test -- --run src/routes/profile/__tests__/api.test.ts
```

Expected: fails with "Cannot find module '../api'".

---

## Task 6: Create frontend API client

**Files:**
- Create: `apps/web/src/routes/profile/api.ts`

- [ ] **Step 1: Create `api.ts`**

```ts
import { apiFetch } from '@/lib/api/fetch-client'
import type { User } from '@/shared/auth/types'

export interface UpdateProfileInput {
  fullName?: string | null
}

export interface BecomeSellerInput {
  isSeller: true
  farmName: string
}

export const profileApi = {
  updateProfile: (data: UpdateProfileInput) =>
    apiFetch<User>('/api/v1/account/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  becomeSeller: (data: BecomeSellerInput) =>
    apiFetch<User>('/api/v1/account/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
```

- [ ] **Step 2: Run tests to confirm they pass**

```bash
cd apps/web && pnpm test -- --run src/routes/profile/__tests__/api.test.ts
```

Expected: all 3 tests pass.

---

## Task 7: Create mutation hooks

**Files:**
- Create: `apps/web/src/routes/profile/use-update-profile.ts`
- Create: `apps/web/src/routes/profile/use-become-seller.ts`

- [ ] **Step 1: Create `use-update-profile.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from './api'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user)
    },
  })
}
```

- [ ] **Step 2: Create `use-become-seller.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from './api'

export function useBecomeSeller() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApi.becomeSeller,
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user)
    },
  })
}
```

---

## Task 8: Create profile route and page

**Files:**
- Create: `apps/web/src/routes/profile/route.tsx`
- Create: `apps/web/src/routes/profile/-profile-page.tsx`

- [ ] **Step 1: Create `route.tsx`**

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/shared/layout/app-layout'
import { ProfilePage } from './-profile-page'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <AppLayout>
      <ProfilePage />
    </AppLayout>
  ),
})
```

- [ ] **Step 2: Create `-profile-page.tsx`**

```tsx
import { useState } from 'react'
import { Button, Input, Label } from '@farm-market/ui'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { useUpdateProfile } from './use-update-profile'
import { useBecomeSeller } from './use-become-seller'

export function ProfilePage() {
  const { data: user } = useCurrentUser()
  const updateProfile = useUpdateProfile()
  const becomeSeller = useBecomeSeller()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [farmName, setFarmName] = useState('')

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate({ fullName: fullName.trim() || null })
  }

  const handleBecomeSeller = (e: React.FormEvent) => {
    e.preventDefault()
    becomeSeller.mutate({ isSeller: true, farmName: farmName.trim() })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-10">
      <section className="flex flex-col gap-5">
        <h1 className="text-xl font-bold text-gray-900">Особиста інформація</h1>
        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Імʼя та прізвище</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Іван Петренко"
            />
          </div>
          {updateProfile.isError && (
            <p className="text-sm text-red-500">
              {updateProfile.error instanceof Error
                ? updateProfile.error.message
                : 'Помилка збереження'}
            </p>
          )}
          {updateProfile.isSuccess && (
            <p className="text-sm text-green-600">Збережено</p>
          )}
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Збереження...' : 'Зберегти'}
          </Button>
        </form>
      </section>

      {!user?.isSeller && (
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Стати продавцем</h2>
            <p className="text-sm text-gray-500 mt-1">
              Вкажіть назву господарства — після цього зможете додавати товари.
            </p>
          </div>
          <form onSubmit={handleBecomeSeller} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="farmName">Назва господарства</Label>
              <Input
                id="farmName"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Ферма Петренко"
                required
              />
            </div>
            {becomeSeller.isError && (
              <p className="text-sm text-red-500">
                {becomeSeller.error instanceof Error
                  ? becomeSeller.error.message
                  : 'Помилка реєстрації'}
              </p>
            )}
            {becomeSeller.isSuccess && (
              <p className="text-sm text-green-600">
                Вітаємо! Тепер ви можете додавати товари.
              </p>
            )}
            <Button
              type="submit"
              disabled={becomeSeller.isPending || !farmName.trim()}
            >
              {becomeSeller.isPending ? 'Реєстрація...' : 'Зареєструватись як продавець'}
            </Button>
          </form>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Regenerate TanStack Router route tree**

The Vite plugin auto-regenerates `routeTree.gen.ts` when the dev server runs. Start the dev server once to trigger it:

```bash
cd apps/web && pnpm dev
```

Wait for "Generated route tree" in the output, then stop (Ctrl+C). The `/profile` route is now registered.

- [ ] **Step 4: Run all frontend tests**

```bash
cd apps/web && pnpm test -- --run
```

Expected: all tests pass including the new `api.test.ts`.

- [ ] **Step 5: Run TypeScript check**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors.

---

## Manual Verification

After all tasks are complete:

1. Start API + web: `pnpm dev` from root
2. Log in as a **buyer** (non-seller):
   - Nav shows: Каталог | Кошик (disabled) | Профіль | Вийти
   - "Мої товари" is NOT visible
   - Click "Профіль" → goes to `/profile`
   - Edit name → submit → name updates
   - Fill "Назва господарства" → "Зареєструватись" → success message appears
   - Nav immediately shows "Мої товари" and "Профіль" now routes to `/seller/profile`
3. Log in as a **seller**:
   - Nav shows: Каталог | Мої товари | Кошик (disabled) | Профіль | Вийти
   - Click "Профіль" → goes to `/seller/profile`
4. Log out:
   - Nav shows only: Каталог
