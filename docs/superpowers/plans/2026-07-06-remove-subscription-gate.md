# Remove Subscription Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the fake, frontend-only "subscription" gate on buyer requests — the buyer requests list becomes visible to all logged-in users, with no gate at all.

**Architecture:** Delete the `isSubscribed` column (via a new reversible migration + regenerating the auto-generated schema file), delete every code path that reads/writes it on both backend and frontend, and delete the `SubscribeGate` UI, replacing it with a plain "please log in" message for the one case that still needs gating (unauthenticated visitors).

**Tech Stack:** AdonisJS v6 (Lucid ORM migrations), React + TanStack Query (frontend).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-06-remove-subscription-gate-design.md`
- No new monetization mechanism — pure removal, per spec's "Out of Scope."
- The existing `!user` (not-logged-in) branch in `-requests-list.tsx` stays, stripped of subscription-specific copy — do not restructure routing or move this under the `_authenticated` route-guard pattern.
- Do not commit — the user reviews and commits manually.
- `apps/api/database/schema.ts` is auto-generated (header: "DO NOT EDIT manually — Run 'node ace migration:run' to re-generate"). Never hand-edit it; it updates automatically when the migration runs.

---

### Task 1: Backend removal

**Files:**
- Create: `apps/api/database/migrations/1781500000000_drop_is_subscribed_from_users.ts`
- Modify: `apps/api/app/transformers/user_transformer.ts:11` (remove `'isSubscribed'` from the field list)
- Modify: `apps/api/app/controllers/account/profile_controller.ts:26-31` (remove the `subscribe` method)
- Modify: `apps/api/start/routes.ts:45` (remove the `subscribe` route registration)
- Regenerated (not hand-edited): `apps/api/database/schema.ts` — the `isSubscribed` column disappears from `UserSchema` after the migration runs

**Interfaces:**
- Produces: `UserTransformer.toObject()` no longer includes `isSubscribed` in its output — Task 2's frontend `User` type must drop the matching field so the two stay in sync.

- [ ] **Step 1: Confirm the current test suite passes before making changes**

Run: `pnpm --filter api test`
Expected: all tests pass (this establishes the baseline — this task only removes dead code paths, so nothing should break)

- [ ] **Step 2: Write the migration**

Create `apps/api/database/migrations/1781500000000_drop_is_subscribed_from_users.ts`:

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_subscribed')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_subscribed').notNullable().defaultTo(false)
    })
  }
}
```

- [ ] **Step 3: Run the migration**

Run: `pnpm --filter api exec node ace migration:run`
Expected: output confirms `1781500000000_drop_is_subscribed_from_users` ran, and `apps/api/database/schema.ts` is automatically rewritten — `UserSchema.$columns` no longer contains `'isSubscribed'`, and the `declare isSubscribed: boolean` field is gone. Do not hand-edit `schema.ts` — verify the regeneration happened by re-reading the file after this command.

- [ ] **Step 4: Remove `isSubscribed` from the transformer**

Modify `apps/api/app/transformers/user_transformer.ts`. Current:

```ts
import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'fullName',
      'email',
      'isSeller',
      'isSubscribed',
      'farmName',
      'phone',
      'telegram',
      'viber',
      'createdAt',
      'updatedAt',
      'initials',
    ])
  }
}
```

New:

```ts
import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'fullName',
      'email',
      'isSeller',
      'farmName',
      'phone',
      'telegram',
      'viber',
      'createdAt',
      'updatedAt',
      'initials',
    ])
  }
}
```

- [ ] **Step 5: Remove the `subscribe` controller method**

Modify `apps/api/app/controllers/account/profile_controller.ts`. Current:

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

  async subscribe({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    user.isSubscribed = true
    await user.save()
    return serialize.withoutWrapping(UserTransformer.transform(user))
  }
}
```

New (the `subscribe` method removed):

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

- [ ] **Step 6: Remove the route**

Modify `apps/api/start/routes.ts`. Current (lines 41-50):

```ts
    router
      .group(() => {
        router.get('profile', [controllers.account.Profile, 'show'])
        router.patch('profile', [controllers.account.Profile, 'update'])
        router.post('subscribe', [controllers.account.Profile, 'subscribe'])
        router.post('logout', [controllers.auth.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())
```

New (the `subscribe` line removed):

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

- [ ] **Step 7: Run the test suite and typecheck**

Run: `pnpm --filter api test`
Expected: all tests still pass (no test referenced `isSubscribed` or `/subscribe` — confirmed by grep before writing this plan)

Run: `pnpm --filter api typecheck`
Expected: PASS — no leftover references to `isSubscribed` or `.subscribe(` anywhere in `apps/api`

- [ ] **Step 8: Commit**

```bash
git add apps/api/database/migrations/1781500000000_drop_is_subscribed_from_users.ts apps/api/database/schema.ts apps/api/app/transformers/user_transformer.ts apps/api/app/controllers/account/profile_controller.ts apps/api/start/routes.ts
git commit -m "feat: remove subscription gate (backend)"
```

---

### Task 2: Frontend removal

**Files:**
- Modify: `apps/web/src/shared/auth/types.ts` (remove `isSubscribed` field)
- Modify: `apps/web/src/shared/auth/api.ts:33-34` (remove the `subscribe` entry from `authApi`)
- Delete: `apps/web/src/shared/auth/use-subscribe.ts`
- Modify: `apps/web/src/routes/catalog/requests/-requests-list.tsx` (remove `SubscribeGate`, remove the subscription check, keep and simplify the not-logged-in message)

**Interfaces:**
- Consumes: Task 1's `UserTransformer` no longer serializes `isSubscribed` — this task's `User` type must match by dropping the field.

- [ ] **Step 1: Remove `isSubscribed` from the `User` type**

Modify `apps/web/src/shared/auth/types.ts`. Current:

```ts
export interface User {
  id: number
  fullName: string | null
  email: string
  isSeller: boolean
  isSubscribed: boolean
  farmName: string | null
  phone: string | null
  telegram: string | null
  viber: string | null
  initials: string
  createdAt: string
  updatedAt: string | null
}
```

New (the `isSubscribed` line removed):

```ts
export interface User {
  id: number
  fullName: string | null
  email: string
  isSeller: boolean
  farmName: string | null
  phone: string | null
  telegram: string | null
  viber: string | null
  initials: string
  createdAt: string
  updatedAt: string | null
}
```

- [ ] **Step 2: Remove the `subscribe` API call**

Modify `apps/web/src/shared/auth/api.ts`. Remove these two lines (currently lines 33-34, between `profile:` and `forgotPassword:`):

```ts
  subscribe: () =>
    apiFetch<User>('/api/v1/account/subscribe', { method: 'POST' }),
```

The surrounding `authApi` object keeps every other entry (`login`, `signup`, `logout`, `profile`, `forgotPassword`, `resetPassword`) unchanged.

- [ ] **Step 3: Delete the `use-subscribe` hook**

Delete the file `apps/web/src/shared/auth/use-subscribe.ts` entirely (its only content was a `useSubscribe` hook wrapping `authApi.subscribe`, which no longer exists after Step 2).

- [ ] **Step 4: Remove the gate from the requests list**

Modify `apps/web/src/routes/catalog/requests/-requests-list.tsx`. Current (full file):

```tsx
import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useRequests } from './use-requests'
import { RequestCard } from './-request-card'
import { RequestForm } from './-request-form'
import { useCategories } from '../use-categories'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { useSubscribe } from '@/shared/auth/use-subscribe'

function SubscribeGate() {
  const { data: user } = useCurrentUser()
  const subscribe = useSubscribe()

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-2xl">🔒</p>
        <h3 className="text-lg font-semibold text-gray-800">Запити покупців — лише для підписників</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Увійдіть в акаунт і оформіть підписку, щоб переглядати запити від покупців та знаходити нових клієнтів.
        </p>
        <Link
          to="/login"
          className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800"
        >
          Увійти
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-2xl">🔒</p>
      <h3 className="text-lg font-semibold text-gray-800">Запити покупців — лише для підписників</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Підпишіться, щоб переглядати запити від покупців, знаходити нових клієнтів і отримувати більше замовлень.
      </p>
      <button
        onClick={() => subscribe.mutate()}
        disabled={subscribe.isPending}
        className="bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-50"
      >
        {subscribe.isPending ? 'Підключення...' : 'Підписатись безкоштовно'}
      </button>
      {subscribe.isError && (
        <p className="text-xs text-red-500">Помилка. Спробуйте ще раз.</p>
      )}
    </div>
  )
}

export function RequestsList() {
  const search = useSearch({ strict: false }) as { category?: string }
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)

  const { data: categories = [] } = useCategories()
  const { data: user } = useCurrentUser()
  const { data, isLoading } = useRequests({
    category: search.category as string | undefined,
    page,
    enabled: !!user?.isSubscribed,
  })

  if (!user?.isSubscribed) {
    return <SubscribeGate />
  }

  const requests = data?.data ?? []
  const meta = data?.meta

  const handleCategoryChange = (slug: string) => {
    setPage(1)
    void navigate({ search: (prev) => ({ ...prev, category: slug || undefined }) })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={search.category ?? ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Всі категорії</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowForm(true)}
          className="ml-auto bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800"
        >
          + Створити запит
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-gray-500">Завантаження...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">Запитів не знайдено</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex gap-2 justify-center pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40"
          >
            ← Назад
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">
            {page} / {meta.lastPage}
          </span>
          <button
            disabled={page >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40"
          >
            Далі →
          </button>
        </div>
      )}

      {showForm && <RequestForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
```

New (full file — `SubscribeGate` replaced by a plain `LoginPrompt`, no subscription check anywhere, `useRequests` always enabled once a user is present):

```tsx
import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useRequests } from './use-requests'
import { RequestCard } from './-request-card'
import { RequestForm } from './-request-form'
import { useCategories } from '../use-categories'
import { useCurrentUser } from '@/shared/auth/use-current-user'

function LoginPrompt() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-2xl">🔒</p>
      <h3 className="text-lg font-semibold text-gray-800">Запити покупців</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Увійдіть в акаунт, щоб переглядати запити від покупців.
      </p>
      <Link
        to="/login"
        className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800"
      >
        Увійти
      </Link>
    </div>
  )
}

export function RequestsList() {
  const search = useSearch({ strict: false }) as { category?: string }
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)

  const { data: categories = [] } = useCategories()
  const { data: user } = useCurrentUser()
  const { data, isLoading } = useRequests({
    category: search.category as string | undefined,
    page,
    enabled: !!user,
  })

  if (!user) {
    return <LoginPrompt />
  }

  const requests = data?.data ?? []
  const meta = data?.meta

  const handleCategoryChange = (slug: string) => {
    setPage(1)
    void navigate({ search: (prev) => ({ ...prev, category: slug || undefined }) })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={search.category ?? ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Всі категорії</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowForm(true)}
          className="ml-auto bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800"
        >
          + Створити запит
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-gray-500">Завантаження...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">Запитів не знайдено</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex gap-2 justify-center pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40"
          >
            ← Назад
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">
            {page} / {meta.lastPage}
          </span>
          <button
            disabled={page >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40"
          >
            Далі →
          </button>
        </div>
      )}

      {showForm && <RequestForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
```

- [ ] **Step 5: Run typecheck and lint**

Run: `pnpm --filter web typecheck`
Expected: PASS — no leftover references to `isSubscribed`, `useSubscribe`, or `authApi.subscribe`

Run: `pnpm --filter web lint`
Expected: no new errors (the 3 pre-existing `react-refresh/only-export-components` warnings in unrelated files are expected and unrelated to this change)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/shared/auth/types.ts apps/web/src/shared/auth/api.ts apps/web/src/routes/catalog/requests/-requests-list.tsx
git rm apps/web/src/shared/auth/use-subscribe.ts
git commit -m "feat: remove subscription gate (frontend)"
```

---

### Task 3: Final verification

**Files:**
- None expected — this task verifies Tasks 1-2 left no stray references.

- [ ] **Step 1: Grep for leftover references across the whole repo**

Run:
```bash
grep -rniE "isSubscribed|useSubscribe|/subscribe" apps/api/app apps/api/start apps/api/database/schema.ts apps/web/src --include="*.ts" --include="*.tsx" 2>/dev/null
```
Expected: no output.

- [ ] **Step 2: Run both full test suites and typechecks**

Run: `pnpm --filter api test && pnpm --filter api typecheck`
Expected: PASS

Run: `pnpm --filter web typecheck && pnpm --filter web lint`
Expected: PASS (only the 3 pre-existing unrelated warnings)

- [ ] **Step 3: Manual smoke test**

With the API and web dev servers running, log in as any user and open the buyer-requests page (`/catalog` → requests tab). Confirm:
- The list of requests shows immediately — no "Підписатись" wall.
- Logging out and revisiting shows the plain "Увійдіть в акаунт" message with a working "Увійти" link — no mention of subscribing.

- [ ] **Step 4: Report to the user**

Summarize what changed and stop — do not commit this task's verification (nothing to commit, it's read-only checks). The user reviews and commits/pushes manually per project convention.
