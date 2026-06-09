# Buyer Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any logged-in user post a product request ("хочу 30 страусиних яєць"), visible to all as a tab in the catalog; sellers respond via chat or contacts.

**Architecture:** New `buyer_requests` table with FK to `users` and `categories`. AdonisJS REST controller with pagination + filtering. React frontend adds a "Запити" tab to `/catalog` via URL search param `?tab=requests`, and a "Мої запити" section in `/profile`.

**Tech Stack:** AdonisJS v6, Lucid ORM, zod validation, React 19, TanStack Query, TanStack Router, Tailwind CSS v4.

---

## File Map

**Backend (all inside `apps/api/`):**
- Create: `database/migrations/1781300000000_create_buyer_requests_table.ts`
- Create: `app/models/buyer_request.ts`
- Create: `app/transformers/buyer_request_transformer.ts`
- Create: `app/validators/buyer_request.ts`
- Create: `app/controllers/requests/buyer_requests_controller.ts`
- Modify: `start/routes.ts` — add requests routes
- Auto-updated by AdonisJS: `database/schema.ts`, `.adonisjs/server/controllers.ts`

**Frontend (all inside `apps/web/src/`):**
- Create: `routes/catalog/requests/types.ts`
- Create: `routes/catalog/requests/api.ts`
- Create: `routes/catalog/requests/__tests__/api.test.ts`
- Create: `routes/catalog/requests/use-requests.ts`
- Create: `routes/catalog/requests/-request-card.tsx`
- Create: `routes/catalog/requests/-request-form.tsx`
- Create: `routes/catalog/requests/-requests-list.tsx`
- Modify: `routes/catalog/route.tsx` — add `tab` search param to schema
- Modify: `routes/catalog/-catalog-page.tsx` — add tab switcher + render requests tab
- Modify: `routes/profile/-profile-page.tsx` — add "Мої запити" section

---

## Task 1: DB Migration

**Files:**
- Create: `apps/api/database/migrations/1781300000000_create_buyer_requests_table.ts`

- [ ] **Step 1: Create the migration file**

```typescript
// apps/api/database/migrations/1781300000000_create_buyer_requests_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'buyer_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('category_id').unsigned().notNullable().references('id').inTable('categories').onDelete('RESTRICT')
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.decimal('quantity', 10, 2).notNullable()
      table.string('unit', 50).notNullable()
      table.string('location', 255).notNullable()
      table.decimal('budget', 10, 2).nullable()
      table.timestamp('expires_at').nullable()
      table.string('status', 20).notNullable().defaultTo('active')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
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
❯ migrated   database/migrations/1781300000000_create_buyer_requests_table
```

This also auto-regenerates `database/schema.ts` — it will contain a new `BuyerRequestSchema` class.

- [ ] **Step 3: Verify schema was updated**

```bash
grep -A 5 "BuyerRequestSchema" apps/api/database/schema.ts
```

Expected: class `BuyerRequestSchema` with columns `id`, `userId`, `categoryId`, `title`, etc.

- [ ] **Step 4: Commit**

```bash
git add apps/api/database/migrations/1781300000000_create_buyer_requests_table.ts apps/api/database/schema.ts
git commit -m "feat: add buyer_requests migration"
```

---

## Task 2: Model + Transformer

**Files:**
- Create: `apps/api/app/models/buyer_request.ts`
- Create: `apps/api/app/transformers/buyer_request_transformer.ts`

- [ ] **Step 1: Create the model**

```typescript
// apps/api/app/models/buyer_request.ts
import { BuyerRequestSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Category from '#models/category'

export default class BuyerRequest extends BuyerRequestSchema {
  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Category, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof Category>
}
```

- [ ] **Step 2: Create the transformer**

```typescript
// apps/api/app/transformers/buyer_request_transformer.ts
import type BuyerRequest from '#models/buyer_request'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class BuyerRequestTransformer extends BaseTransformer<BuyerRequest> {
  toObject() {
    return {
      id: this.resource.id,
      title: this.resource.title,
      description: this.resource.description ?? null,
      quantity: Number(this.resource.quantity),
      unit: this.resource.unit,
      location: this.resource.location,
      budget: this.resource.budget != null ? Number(this.resource.budget) : null,
      expiresAt: this.resource.expiresAt?.toISO() ?? null,
      status: this.resource.status,
      createdAt: this.resource.createdAt.toISO(),
      category: this.resource.category
        ? {
            id: this.resource.category.id,
            name: this.resource.category.name,
            slug: this.resource.category.slug,
          }
        : null,
      user: this.resource.user
        ? {
            id: this.resource.user.id,
            fullName: this.resource.user.fullName ?? null,
            phone: this.resource.user.phone ?? null,
            telegram: this.resource.user.telegram ?? null,
            viber: this.resource.user.viber ?? null,
          }
        : null,
    }
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/api && node ace ts:check 2>&1 | grep -E "error|Error" | head -10
```

Expected: no output (no errors).

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/models/buyer_request.ts apps/api/app/transformers/buyer_request_transformer.ts
git commit -m "feat: add BuyerRequest model and transformer"
```

---

## Task 3: Validator

**Files:**
- Create: `apps/api/app/validators/buyer_request.ts`

- [ ] **Step 1: Create the validator**

```typescript
// apps/api/app/validators/buyer_request.ts
import { z } from 'zod'

export const createBuyerRequestSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(2000).optional(),
  categoryId: z.number().int().positive(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  location: z.string().min(2).max(255),
  budget: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
})

export const updateBuyerRequestSchema = z.object({
  status: z.enum(['active', 'closed']).optional(),
  title: z.string().min(3).max(255).optional(),
  description: z.string().max(2000).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).max(50).optional(),
  location: z.string().min(2).max(255).optional(),
  budget: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
})

export type CreateBuyerRequestInput = z.infer<typeof createBuyerRequestSchema>
export type UpdateBuyerRequestInput = z.infer<typeof updateBuyerRequestSchema>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/api && node ace ts:check 2>&1 | grep -E "error|Error" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/validators/buyer_request.ts
git commit -m "feat: add buyer request zod validators"
```

---

## Task 4: Controller

**Files:**
- Create: `apps/api/app/controllers/requests/buyer_requests_controller.ts`

- [ ] **Step 1: Create the controller**

```typescript
// apps/api/app/controllers/requests/buyer_requests_controller.ts
import BuyerRequest from '#models/buyer_request'
import BuyerRequestTransformer from '#transformers/buyer_request_transformer'
import { zodValidate } from '#lib/zod_validate'
import { createBuyerRequestSchema, updateBuyerRequestSchema } from '#validators/buyer_request'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class BuyerRequestsController {
  async index({ request, serialize }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const category = request.input('category') as string | undefined
    const location = request.input('location') as string | undefined

    const query = BuyerRequest.query()
      .where('status', 'active')
      .preload('user')
      .preload('category')
      .orderBy('created_at', 'desc')

    if (category) {
      query.whereHas('category', (q) => q.where('slug', category))
    }

    if (location) {
      query.whereILike('location', `%${location}%`)
    }

    const requests = await query.paginate(page, 20)
    return serialize(BuyerRequestTransformer.transform(requests.all()), {
      meta: requests.getMeta(),
    })
  }

  async show({ params, response, serialize }: HttpContext) {
    const buyerRequest = await BuyerRequest.query()
      .where('id', params.id)
      .preload('user')
      .preload('category')
      .first()

    if (!buyerRequest) return response.notFound({ message: 'Request not found' })
    return serialize.withoutWrapping(BuyerRequestTransformer.transform(buyerRequest))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = zodValidate(createBuyerRequestSchema, request.body())

    const buyerRequest = await BuyerRequest.create({
      userId: user.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description ?? null,
      quantity: data.quantity,
      unit: data.unit,
      location: data.location,
      budget: data.budget ?? null,
      expiresAt: data.expiresAt ? DateTime.fromISO(data.expiresAt) : null,
      status: 'active',
    })

    await buyerRequest.load('user')
    await buyerRequest.load('category')
    return serialize.withoutWrapping(BuyerRequestTransformer.transform(buyerRequest))
  }

  async update({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const buyerRequest = await BuyerRequest.find(params.id)

    if (!buyerRequest) return response.notFound({ message: 'Request not found' })
    if (buyerRequest.userId !== user.id) return response.forbidden({ message: 'Forbidden' })

    const data = zodValidate(updateBuyerRequestSchema, request.body())

    buyerRequest.merge({
      ...(data.status !== undefined && { status: data.status }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.expiresAt !== undefined && { expiresAt: DateTime.fromISO(data.expiresAt) }),
    })
    await buyerRequest.save()
    await buyerRequest.load('user')
    await buyerRequest.load('category')
    return serialize.withoutWrapping(BuyerRequestTransformer.transform(buyerRequest))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const buyerRequest = await BuyerRequest.find(params.id)

    if (!buyerRequest) return response.notFound({ message: 'Request not found' })
    if (buyerRequest.userId !== user.id) return response.forbidden({ message: 'Forbidden' })

    await buyerRequest.delete()
    return response.noContent()
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/api && node ace ts:check 2>&1 | grep -E "error|Error" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/controllers/requests/buyer_requests_controller.ts
git commit -m "feat: add BuyerRequestsController"
```

---

## Task 5: Routes + Manifest

**Files:**
- Modify: `apps/api/start/routes.ts`
- Auto-updated: `apps/api/.adonisjs/server/controllers.ts`

- [ ] **Step 1: Add routes to `start/routes.ts`**

Add this block inside the `/api/v1` group, after the `farms` group:

```typescript
// after the farms group, before the conversations group:
router
  .group(() => {
    router.get('/', [controllers.requests.BuyerRequests, 'index'])
    router.get('/:id', [controllers.requests.BuyerRequests, 'show'])
    router
      .group(() => {
        router.post('/', [controllers.requests.BuyerRequests, 'store'])
        router.patch('/:id', [controllers.requests.BuyerRequests, 'update'])
        router.delete('/:id', [controllers.requests.BuyerRequests, 'destroy'])
      })
      .use(middleware.auth())
  })
  .prefix('requests')
```

- [ ] **Step 2: Regenerate controllers manifest**

```bash
cd apps/api && node ace generate:manifest
```

Expected output includes: `controllers.requests.BuyerRequests`

- [ ] **Step 3: Start dev server and test the endpoint**

```bash
curl -s http://localhost:3333/api/v1/requests | python3 -c "import json,sys; d=json.load(sys.stdin); print('OK, items:', len(d['data']))"
```

Expected: `OK, items: 0`

- [ ] **Step 4: Commit**

```bash
git add apps/api/start/routes.ts apps/api/.adonisjs/server/controllers.ts
git commit -m "feat: add /api/v1/requests routes"
```

---

## Task 6: Frontend Types + API

**Files:**
- Create: `apps/web/src/routes/catalog/requests/types.ts`
- Create: `apps/web/src/routes/catalog/requests/api.ts`

- [ ] **Step 1: Create types**

```typescript
// apps/web/src/routes/catalog/requests/types.ts
export interface BuyerRequestUser {
  id: number
  fullName: string | null
  phone: string | null
  telegram: string | null
  viber: string | null
}

export interface BuyerRequestCategory {
  id: number
  name: string
  slug: string
}

export interface BuyerRequest {
  id: number
  title: string
  description: string | null
  quantity: number
  unit: string
  location: string
  budget: number | null
  expiresAt: string | null
  status: 'active' | 'closed'
  createdAt: string
  category: BuyerRequestCategory | null
  user: BuyerRequestUser | null
}

export interface BuyerRequestsMeta {
  currentPage: number
  lastPage: number
  total: number
}

export interface CreateBuyerRequestPayload {
  title: string
  description?: string
  categoryId: number
  quantity: number
  unit: string
  location: string
  budget?: number
  expiresAt?: string
}
```

- [ ] **Step 2: Create API module**

```typescript
// apps/web/src/routes/catalog/requests/api.ts
import { apiFetch } from '@/lib/api/fetch-client'
import type { BuyerRequest, BuyerRequestsMeta, CreateBuyerRequestPayload } from './types'

export const requestsApi = {
  getRequests: (params: { category?: string; location?: string; page?: number }) => {
    const p = new URLSearchParams()
    if (params.category) p.set('category', params.category)
    if (params.location) p.set('location', params.location)
    if (params.page && params.page > 1) p.set('page', String(params.page))
    const qs = p.toString()
    return apiFetch<{ data: BuyerRequest[]; meta: BuyerRequestsMeta }>(
      `/api/v1/requests${qs ? `?${qs}` : ''}`
    )
  },

  createRequest: (payload: CreateBuyerRequestPayload) =>
    apiFetch<BuyerRequest>('/api/v1/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  closeRequest: (id: number) =>
    apiFetch<BuyerRequest>(`/api/v1/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed' }),
    }),

  deleteRequest: (id: number) =>
    apiFetch<void>(`/api/v1/requests/${id}`, { method: 'DELETE' }),
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/catalog/requests/types.ts apps/web/src/routes/catalog/requests/api.ts
git commit -m "feat: add buyer requests frontend types and api"
```

---

## Task 7: Frontend API Tests

**Files:**
- Create: `apps/web/src/routes/catalog/requests/__tests__/api.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// apps/web/src/routes/catalog/requests/__tests__/api.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestsApi } from '../api'

const mockFetch = vi.fn()

describe('requestsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('getRequests', () => {
    it('calls GET /api/v1/requests with no params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: {} }),
      })
      await requestsApi.getRequests({})
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/requests')
    })

    it('appends category param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: {} }),
      })
      await requestsApi.getRequests({ category: 'fish' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('category=fish')
    })

    it('appends location param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: {} }),
      })
      await requestsApi.getRequests({ location: 'Київ' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(decodeURIComponent(url)).toContain('location=Київ')
    })
  })

  describe('createRequest', () => {
    it('calls POST /api/v1/requests with payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, title: 'Test' }),
      })
      await requestsApi.createRequest({
        title: 'Test',
        categoryId: 1,
        quantity: 5,
        unit: 'кг',
        location: 'Київ',
      })
      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/requests')
      expect(opts.method).toBe('POST')
      expect(JSON.parse(opts.body as string)).toMatchObject({ title: 'Test', quantity: 5 })
    })
  })

  describe('closeRequest', () => {
    it('calls PATCH /api/v1/requests/:id with status closed', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      await requestsApi.closeRequest(42)
      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/requests/42')
      expect(opts.method).toBe('PATCH')
      expect(JSON.parse(opts.body as string)).toEqual({ status: 'closed' })
    })
  })

  describe('deleteRequest', () => {
    it('calls DELETE /api/v1/requests/:id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) })
      await requestsApi.deleteRequest(7)
      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/requests/7')
      expect(opts.method).toBe('DELETE')
    })
  })
})
```

- [ ] **Step 2: Run tests**

```bash
cd apps/web && pnpm test --run src/routes/catalog/requests/__tests__/api.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/catalog/requests/__tests__/api.test.ts
git commit -m "test: add buyer requests api tests"
```

---

## Task 8: useRequests Hooks

**Files:**
- Create: `apps/web/src/routes/catalog/requests/use-requests.ts`

- [ ] **Step 1: Create hooks**

```typescript
// apps/web/src/routes/catalog/requests/use-requests.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requestsApi } from './api'
import type { CreateBuyerRequestPayload } from './types'

export function useRequests(params: { category?: string; page?: number }) {
  return useQuery({
    queryKey: ['requests', params],
    queryFn: () => requestsApi.getRequests(params).then((r) => r),
  })
}

export function useCreateRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBuyerRequestPayload) => requestsApi.createRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
      void queryClient.invalidateQueries({ queryKey: ['my-requests'] })
    },
  })
}

export function useMyRequests(userId: number | undefined) {
  return useQuery({
    queryKey: ['my-requests', userId],
    queryFn: () => requestsApi.getRequests({ page: 1 }).then((r) => ({
      ...r,
      data: r.data.filter((req) => req.user?.id === userId),
    })),
    enabled: userId !== undefined,
  })
}

export function useCloseRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => requestsApi.closeRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
      void queryClient.invalidateQueries({ queryKey: ['my-requests'] })
    },
  })
}

export function useDeleteRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => requestsApi.deleteRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
      void queryClient.invalidateQueries({ queryKey: ['my-requests'] })
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/catalog/requests/use-requests.ts
git commit -m "feat: add useRequests hooks"
```

---

## Task 9: RequestCard Component

**Files:**
- Create: `apps/web/src/routes/catalog/requests/-request-card.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/routes/catalog/requests/-request-card.tsx
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { BuyerRequest } from './types'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { chatApi } from '../../chat/api'

interface Props {
  request: BuyerRequest
  isOwn?: boolean
  onClose?: (id: number) => void
  onDelete?: (id: number) => void
}

export function RequestCard({ request, isOwn, onClose, onDelete }: Props) {
  const { data: user } = useCurrentUser()
  const navigate = useNavigate()
  const [showContacts, setShowContacts] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)

  const handleChat = async () => {
    if (!request.user) return
    setChatLoading(true)
    try {
      const conv = await chatApi.createConversation(request.user.id)
      void navigate({ to: '/chat/$id', params: { id: String(conv.id) } })
    } finally {
      setChatLoading(false)
    }
  }

  const expiryLabel = request.expiresAt
    ? `до ${new Date(request.expiresAt).toLocaleDateString('uk-UA')}`
    : null

  const hasContacts =
    request.user && (request.user.phone || request.user.telegram || request.user.viber)

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col gap-3">
      {/* Header row */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 items-center mb-1">
            {request.category && (
              <span className="bg-green-50 text-green-800 border border-green-200 rounded-full px-2.5 py-0.5 text-xs">
                {request.category.name}
              </span>
            )}
            <span className="text-xs text-gray-400">📍 {request.location}</span>
            {expiryLabel && <span className="text-xs text-gray-400">{expiryLabel}</span>}
          </div>
          <h3 className="font-semibold text-gray-900 leading-snug">{request.title}</h3>
          {request.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{request.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-green-700">
            {request.quantity} {request.unit}
          </p>
          {request.budget != null ? (
            <p className="text-xs text-gray-500">до {request.budget} ₴</p>
          ) : (
            <p className="text-xs text-gray-400">ціна договірна</p>
          )}
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400 flex-1">
          {request.user?.fullName ?? 'Анонім'}
        </span>

        {isOwn ? (
          <div className="flex gap-2">
            {request.status === 'active' && onClose && (
              <button
                onClick={() => onClose(request.id)}
                className="text-xs border border-gray-300 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50"
              >
                Закрити
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(request.id)}
                className="text-xs border border-red-200 text-red-600 px-3 py-1 rounded-lg hover:bg-red-50"
              >
                Видалити
              </button>
            )}
          </div>
        ) : (
          user && user.id !== request.user?.id && (
            <div className="flex gap-2 relative">
              {hasContacts && (
                <div className="relative">
                  <button
                    onClick={() => setShowContacts((v) => !v)}
                    className="text-xs border border-green-600 text-green-700 px-3 py-1 rounded-lg hover:bg-green-50"
                  >
                    📞 Контакти
                  </button>
                  {showContacts && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-40 z-10 flex flex-col gap-1">
                      {request.user?.phone && (
                        <a href={`tel:${request.user.phone}`} className="text-sm text-gray-700 hover:text-green-700">
                          📞 {request.user.phone}
                        </a>
                      )}
                      {request.user?.telegram && (
                        <a
                          href={`https://t.me/${request.user.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-700 hover:text-green-700"
                        >
                          ✈️ {request.user.telegram}
                        </a>
                      )}
                      {request.user?.viber && (
                        <a href={`viber://chat?number=${request.user.viber}`} className="text-sm text-gray-700 hover:text-green-700">
                          📲 {request.user.viber}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => void handleChat()}
                disabled={chatLoading}
                className="text-xs bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                {chatLoading ? '...' : '💬 Написати'}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && pnpm typecheck 2>&1 | grep -E "error TS" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/catalog/requests/-request-card.tsx
git commit -m "feat: add RequestCard component"
```

---

## Task 10: RequestForm Modal

**Files:**
- Create: `apps/web/src/routes/catalog/requests/-request-form.tsx`

- [ ] **Step 1: Create the form**

```tsx
// apps/web/src/routes/catalog/requests/-request-form.tsx
import { useState } from 'react'
import { Button, Input, Label } from '@farm-market/ui'
import { useCategories } from '../use-categories'
import { useCreateRequest } from './use-requests'
import { useCurrentUser } from '@/shared/auth/use-current-user'

interface Props {
  onClose: () => void
}

export function RequestForm({ onClose }: Props) {
  const { data: categories = [] } = useCategories()
  const { data: user } = useCurrentUser()
  const createRequest = useCreateRequest()

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createRequest.mutate(
      {
        title: title.trim(),
        categoryId: Number(categoryId),
        quantity: Number(quantity),
        unit: unit.trim(),
        location: location.trim(),
        description: description.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Новий запит</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="req-title">Що шукаєте?*</Label>
            <Input
              id="req-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Шукаю 30 страусиних яєць"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="req-category">Категорія*</Label>
            <select
              id="req-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Оберіть категорію</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="req-quantity">Кількість*</Label>
              <Input
                id="req-quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="30"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="req-unit">Одиниця*</Label>
              <Input
                id="req-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="шт, кг, л..."
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="req-location">Локація*</Label>
            <Input
              id="req-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Київ"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="req-description">Опис (опційно)</Label>
            <textarea
              id="req-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Додаткові деталі..."
              rows={3}
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="req-budget">Бюджет, ₴ (опційно)</Label>
              <Input
                id="req-budget"
                type="number"
                min="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="req-expires">Актуально до (опційно)</Label>
              <Input
                id="req-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {user && (user.phone || user.telegram || user.viber) && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p className="font-medium mb-1">Ваші контакти (підтягнуться автоматично):</p>
              {user.phone && <p>📞 {user.phone}</p>}
              {user.telegram && <p>✈️ {user.telegram}</p>}
              {user.viber && <p>📲 {user.viber}</p>}
            </div>
          )}

          {createRequest.isError && (
            <p className="text-sm text-red-500">Помилка. Спробуйте ще раз.</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Скасувати
            </button>
            <Button type="submit" disabled={createRequest.isPending} className="flex-1">
              {createRequest.isPending ? 'Публікація...' : 'Опублікувати'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && pnpm typecheck 2>&1 | grep -E "error TS" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/catalog/requests/-request-form.tsx
git commit -m "feat: add RequestForm modal"
```

---

## Task 11: RequestsList Component

**Files:**
- Create: `apps/web/src/routes/catalog/requests/-requests-list.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/routes/catalog/requests/-requests-list.tsx
import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useRequests } from './use-requests'
import { RequestCard } from './-request-card'
import { RequestForm } from './-request-form'
import { useCategories } from '../../catalog/use-categories'
import { useCurrentUser } from '@/shared/auth/use-current-user'

export function RequestsList() {
  const search = useSearch({ strict: false }) as { category?: string }
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)

  const { data: categories = [] } = useCategories()
  const { data: user } = useCurrentUser()
  const { data, isLoading } = useRequests({ category: search.category as string | undefined, page })

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

        {user && (
          <button
            onClick={() => setShowForm(true)}
            className="ml-auto bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800"
          >
            + Створити запит
          </button>
        )}
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

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && pnpm typecheck 2>&1 | grep -E "error TS" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/catalog/requests/-requests-list.tsx
git commit -m "feat: add RequestsList component"
```

---

## Task 12: Catalog Tab Integration

**Files:**
- Modify: `apps/web/src/routes/catalog/route.tsx`
- Modify: `apps/web/src/routes/catalog/-catalog-page.tsx`

- [ ] **Step 1: Update `route.tsx` to add `tab` search param**

Replace the entire file:

```tsx
// apps/web/src/routes/catalog/route.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { CatalogPage } from './-catalog-page'
import { AppLayout } from '@/shared/layout/app-layout'

const searchSchema = z.object({
  tab: z.enum(['products', 'requests']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/catalog')({
  validateSearch: searchSchema,
  component: () => (
    <AppLayout>
      <CatalogPage />
    </AppLayout>
  ),
})
```

- [ ] **Step 2: Update `-catalog-page.tsx` to add tab switcher**

Replace the entire file:

```tsx
// apps/web/src/routes/catalog/-catalog-page.tsx
import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCategories } from './use-categories'
import { useProducts } from './use-products'
import { ProductCard } from './-product-card'
import { RequestsList } from './requests/-requests-list'

export function CatalogPage() {
  const search = useSearch({ from: '/catalog' })
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(search.search ?? '')

  const tab = search.tab ?? 'products'
  const activeCategory = search.category
  const activeSearch = search.search

  const { data: categories = [] } = useCategories()
  const { data: products = [], isLoading } = useProducts({
    category: activeCategory,
    search: activeSearch,
  })

  const handleTabChange = (newTab: 'products' | 'requests') => {
    void navigate({ search: (prev) => ({ ...prev, tab: newTab, search: undefined }) })
  }

  const handleCategoryClick = (slug?: string) => {
    void navigate({ search: (prev) => ({ ...prev, category: slug, search: undefined }) })
  }

  const handleSearch = (value: string) => {
    setSearchInput(value)
    void navigate({ search: (prev) => ({ ...prev, search: value || undefined }) })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange('products')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'products'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Товари
        </button>
        <button
          onClick={() => handleTabChange('requests')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'requests'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Запити покупців
        </button>
      </div>

      {tab === 'products' ? (
        <div className="flex gap-6">
          <aside className="w-44 shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Категорії
            </p>
            <ul className="flex flex-col gap-1">
              <li>
                <button
                  onClick={() => handleCategoryClick(undefined)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    !activeCategory
                      ? 'bg-green-100 text-green-800 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Всі
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      activeCategory === cat.slug
                        ? 'bg-green-100 text-green-800 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="flex-1 min-w-0">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Пошук товарів..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {isLoading ? (
              <p className="text-sm text-gray-500">Завантаження...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-gray-500">Товарів не знайдено</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <RequestsList />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm typecheck 2>&1 | grep -E "error TS" | head -10
```

Expected: no output.

- [ ] **Step 4: Run dev server and manually test**

Open `http://localhost:5173/catalog` — verify "Товари" and "Запити покупців" tabs appear and switch correctly. Clicking "+ Створити запит" should open the modal.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/catalog/route.tsx apps/web/src/routes/catalog/-catalog-page.tsx
git commit -m "feat: add requests tab to catalog page"
```

---

## Task 13: My Requests in Profile

**Files:**
- Modify: `apps/web/src/routes/profile/-profile-page.tsx`

- [ ] **Step 1: Add import and section to profile page**

At the top of the file add these imports after existing imports:

```tsx
import { useMyRequests, useCloseRequest, useDeleteRequest } from '../catalog/requests/use-requests'
import { RequestCard } from '../catalog/requests/-request-card'
```

Then add this section at the bottom of the returned JSX, after the last `</section>` and before the closing `</div>`:

```tsx
{user && (
  <MyRequestsSection userId={user.id} />
)}
```

Add this component at the bottom of the file (outside `ProfilePage`):

```tsx
function MyRequestsSection({ userId }: { userId: number }) {
  const { data, isLoading } = useMyRequests(userId)
  const closeRequest = useCloseRequest()
  const deleteRequest = useDeleteRequest()

  const requests = data?.data ?? []

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-900">Мої запити</h2>
      {isLoading ? (
        <p className="text-sm text-gray-500">Завантаження...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">
          У вас ще немає запитів.{' '}
          <a href="/catalog?tab=requests" className="text-green-700 underline">
            Перейти до каталогу
          </a>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              isOwn
              onClose={(id) => closeRequest.mutate(id)}
              onDelete={(id) => deleteRequest.mutate(id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && pnpm typecheck 2>&1 | grep -E "error TS" | head -10
```

Expected: no output.

- [ ] **Step 3: Run all tests**

```bash
cd apps/web && pnpm test --run
```

Expected: all tests pass.

- [ ] **Step 4: Final manual check**

1. Open `http://localhost:5173/catalog?tab=requests` — requests tab visible
2. Log in → click "+ Створити запит" → fill form → submit → request appears in list
3. Open `http://localhost:5173/profile` → "Мої запити" section visible with your request
4. Click "Закрити" — request disappears from active list
5. As different user: see "📞 Контакти" and "💬 Написати" buttons on request cards

- [ ] **Step 5: Commit and push**

```bash
git add apps/web/src/routes/profile/-profile-page.tsx
git commit -m "feat: add my requests section to profile"
git push
```
