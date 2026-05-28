# Landing Page, Farmer Profile & Healthcheck — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public landing page with search and featured products, a farmer public profile page, and a `/health` endpoint with DB liveness check.

**Architecture:** Healthcheck is a standalone controller outside the API prefix. Landing page is a standalone React page (own header, not AppLayout). Farmer profile uses a new `FarmersController` that returns seller info + their active products. Products controller gains `limit` and `random` query params to power the landing page product strip.

**Tech Stack:** AdonisJS v6 (Japa tests, Lucid ORM, lazy controller imports), React + TanStack Router, Vitest, TailwindCSS.

---

## File Map

### Task 1 — Healthcheck
| Action | Path |
|---|---|
| Create | `apps/api/app/controllers/health_controller.ts` |
| Create | `apps/api/tests/functional/health.spec.ts` |
| Modify | `apps/api/start/routes.ts` |

### Task 2 — Products `limit` + `random` params
| Action | Path |
|---|---|
| Modify | `apps/api/app/controllers/products_controller.ts` |
| Create | `apps/api/tests/functional/products.spec.ts` |
| Modify | `apps/web/src/features/catalog/api.ts` |
| Modify | `apps/web/src/features/catalog/__tests__/api.test.ts` |

### Task 3 — Logo dark variant
| Action | Path |
|---|---|
| Modify | `apps/web/src/features/auth/logo.tsx` |
| Modify | `apps/web/src/features/layout/app-layout.tsx` |

### Task 4 — Landing page
| Action | Path |
|---|---|
| Create | `apps/web/src/features/landing/use-featured-products.ts` |
| Create | `apps/web/src/features/landing/landing-page.tsx` |
| Modify | `apps/web/src/routes/index.tsx` |

### Task 5 — Farmer profile API
| Action | Path |
|---|---|
| Create | `apps/api/app/controllers/farmers_controller.ts` |
| Create | `apps/api/tests/functional/farmers.spec.ts` |
| Modify | `apps/api/start/routes.ts` |

### Task 6 — Farmer profile frontend
| Action | Path |
|---|---|
| Create | `apps/web/src/features/farmers/api.ts` |
| Create | `apps/web/src/features/farmers/use-farmer.ts` |
| Create | `apps/web/src/features/farmers/__tests__/api.test.ts` |
| Create | `apps/web/src/features/farmers/farmer-profile-page.tsx` |
| Create | `apps/web/src/routes/farmers/$id.tsx` |
| Modify | `apps/web/src/features/catalog/product-page.tsx` |

---

## Task 1: Healthcheck

### Files
- Create: `apps/api/app/controllers/health_controller.ts`
- Create: `apps/api/tests/functional/health.spec.ts`
- Modify: `apps/api/start/routes.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/functional/health.spec.ts`:

```typescript
import { test } from '@japa/runner'

test.group('GET /health', () => {
  test('returns 200 with status ok when db is reachable', async ({ client }) => {
    const response = await client.get('/health')
    response.assertStatus(200)
    response.assertBodyContains({ status: 'ok', db: 'ok' })
  })

  test('response includes timestamp', async ({ client }) => {
    const response = await client.get('/health')
    response.assertStatus(200)
    const body = response.body() as { timestamp: string }
    expect(typeof body.timestamp).toBe('string')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/api && node ace test --files="tests/functional/health.spec.ts"
```

Expected: FAIL — route does not exist, 404.

- [ ] **Step 3: Create the controller**

Create `apps/api/app/controllers/health_controller.ts`:

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class HealthController {
  async show({ response }: HttpContext) {
    const timestamp = new Date().toISOString()
    try {
      await db.rawQuery('SELECT 1')
      return response.ok({ status: 'ok', db: 'ok', timestamp })
    } catch {
      return response.serviceUnavailable({ status: 'degraded', db: 'error', timestamp })
    }
  }
}
```

- [ ] **Step 4: Register the route**

In `apps/api/start/routes.ts`, add before the `/api/v1` group:

```typescript
router.get('/health', [() => import('#controllers/health_controller'), 'show'])
```

Full routes.ts after the addition:

```typescript
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import app from '@adonisjs/core/services/app'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/health', [() => import('#controllers/health_controller'), 'show'])

router.get('/uploads/*', async ({ request, response }) => {
  const parts = request.param('*') as string[]
  const absolutePath = app.makePath('storage', 'uploads', ...parts)
  try {
    const stats = await stat(absolutePath)
    response.header('Content-Length', String(stats.size))
    return response.stream(createReadStream(absolutePath))
  } catch {
    return response.notFound({ message: 'File not found' })
  }
})

router
  .group(() => {
    router.get('categories', [controllers.Categories, 'index'])

    router
      .group(() => {
        router.get('/', [controllers.Products, 'index'])
        router.get('/:id', [controllers.Products, 'show'])
      })
      .prefix('products')

    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('products', [controllers.seller.SellerProducts, 'index'])
        router.post('products', [controllers.seller.SellerProducts, 'store'])
        router.put('products/:id', [controllers.seller.SellerProducts, 'update'])
        router.delete('products/:id', [controllers.seller.SellerProducts, 'destroy'])
        router.post('products/:id/image', [controllers.seller.SellerProducts, 'uploadImage'])
      })
      .prefix('seller')
      .use([middleware.auth(), middleware.seller()])

    router
      .group(() => {
        router.get('/:id', [() => import('#controllers/farmers_controller'), 'show'])
      })
      .prefix('farmers')
  })
  .prefix('/api/v1')
```

> Note: the `farmers` group is pre-added here so routes.ts only needs one modification total.

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/api && node ace test --files="tests/functional/health.spec.ts"
```

Expected: PASS — 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/controllers/health_controller.ts \
        apps/api/tests/functional/health.spec.ts \
        apps/api/start/routes.ts
git commit -m "feat(api): add GET /health endpoint with db liveness check"
```

---

## Task 2: Products `limit` + `random` params

### Files
- Modify: `apps/api/app/controllers/products_controller.ts`
- Create: `apps/api/tests/functional/products.spec.ts`
- Modify: `apps/web/src/features/catalog/api.ts`
- Modify: `apps/web/src/features/catalog/__tests__/api.test.ts`

- [ ] **Step 1: Write the failing API test**

Create `apps/api/tests/functional/products.spec.ts`:

```typescript
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

async function seedProduct(name: string, categoryId: number, sellerId: number) {
  await db.table('products').insert({
    name,
    price: '10',
    unit: 'кг',
    quantity: '5',
    status: 'active',
    category_id: categoryId,
    seller_id: sellerId,
    created_at: new Date(),
    updated_at: new Date(),
  })
}

test.group('GET /api/v1/products — limit + random', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('respects limit param', async ({ client, assert }) => {
    const [cat] = await db
      .table('categories')
      .insert({ name: 'Т', slug: 'test', created_at: new Date(), updated_at: new Date() })
      .returning(['id'])
    const [seller] = await db
      .table('users')
      .insert({ email: 'a@b.com', password: 'x', is_seller: true, created_at: new Date(), updated_at: new Date() })
      .returning(['id'])

    await seedProduct('A', cat.id, seller.id)
    await seedProduct('B', cat.id, seller.id)
    await seedProduct('C', cat.id, seller.id)

    const response = await client.get('/api/v1/products?limit=2')
    response.assertStatus(200)
    const body = response.body() as { data: unknown[] }
    assert.lengthOf(body.data, 2)
  })

  test('random param does not break the query', async ({ client }) => {
    const [cat] = await db
      .table('categories')
      .insert({ name: 'Т', slug: 'test2', created_at: new Date(), updated_at: new Date() })
      .returning(['id'])
    const [seller] = await db
      .table('users')
      .insert({ email: 'c@d.com', password: 'x', is_seller: true, created_at: new Date(), updated_at: new Date() })
      .returning(['id'])

    await seedProduct('X', cat.id, seller.id)

    const response = await client.get('/api/v1/products?random=true')
    response.assertStatus(200)
    response.assertBodyContains({ data: [{ name: 'X' }] })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/api && node ace test --files="tests/functional/products.spec.ts"
```

Expected: FAIL — `limit` and `random` params ignored.

- [ ] **Step 3: Update products controller**

Full replacement for `apps/api/app/controllers/products_controller.ts`:

```typescript
import Product from '#models/product'
import ProductTransformer from '#transformers/product_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductsController {
  async index({ request, serialize }: HttpContext) {
    const { category, search, limit, random } = request.qs() as {
      category?: string
      search?: string
      limit?: string
      random?: string
    }

    const query = Product.query()
      .where('status', 'active')
      .preload('category')
      .preload('seller')

    if (random === 'true') {
      query.orderByRaw('RANDOM()')
    } else {
      query.orderBy('created_at', 'desc')
    }

    if (category) {
      query.whereHas('category', (q) => q.where('slug', category))
    }

    if (search) {
      query.whereILike('name', `%${search}%`)
    }

    if (limit) {
      query.limit(Number(limit))
    }

    const products = await query
    return serialize(ProductTransformer.transform(products))
  }

  async show({ params, serialize, response }: HttpContext) {
    const product = await Product.query()
      .where('id', params.id)
      .preload('category')
      .preload('seller')
      .first()

    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    return serialize.withoutWrapping(ProductTransformer.transform(product))
  }
}
```

- [ ] **Step 4: Run API test to verify it passes**

```bash
cd apps/api && node ace test --files="tests/functional/products.spec.ts"
```

Expected: PASS — 2 tests pass.

- [ ] **Step 5: Write failing frontend unit tests for new params**

Add to `apps/web/src/features/catalog/__tests__/api.test.ts` inside the `getProducts` describe block:

```typescript
it('appends limit param when provided', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
  await catalogApi.getProducts({ limit: 8 })
  const [url] = mockFetch.mock.calls[0] as [string]
  expect(url).toContain('limit=8')
})

it('appends random=true when random is true', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
  await catalogApi.getProducts({ random: true })
  const [url] = mockFetch.mock.calls[0] as [string]
  expect(url).toContain('random=true')
})
```

- [ ] **Step 6: Run frontend tests to verify they fail**

```bash
cd apps/web && pnpm test -- --reporter=verbose
```

Expected: FAIL — `limit` and `random` not yet in `GetProductsParams`.

- [ ] **Step 7: Update catalog API to accept new params**

Full replacement for `apps/web/src/features/catalog/api.ts`:

```typescript
import { apiFetch } from '../../lib/api/fetch-client'
import type { Category, Product } from './types'

interface GetProductsParams {
  category?: string
  search?: string
  limit?: number
  random?: boolean
}

export const catalogApi = {
  getProducts: ({ category, search, limit, random }: GetProductsParams) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    if (limit !== undefined) params.set('limit', String(limit))
    if (random) params.set('random', 'true')
    const qs = params.toString()
    return apiFetch<{ data: Product[] }>(`/api/v1/products${qs ? `?${qs}` : ''}`)
  },
  getProduct: (id: number) => apiFetch<Product>(`/api/v1/products/${id}`),
  getCategories: () => apiFetch<{ data: Category[] }>('/api/v1/categories'),
}
```

- [ ] **Step 8: Run frontend tests to verify they pass**

```bash
cd apps/web && pnpm test -- --reporter=verbose
```

Expected: PASS — all tests pass including the 2 new ones.

- [ ] **Step 9: Commit**

```bash
git add apps/api/app/controllers/products_controller.ts \
        apps/api/tests/functional/products.spec.ts \
        apps/web/src/features/catalog/api.ts \
        apps/web/src/features/catalog/__tests__/api.test.ts
git commit -m "feat(api,web): add limit and random params to products endpoint"
```

---

## Task 3: Logo dark variant + AppLayout fix

### Files
- Modify: `apps/web/src/features/auth/logo.tsx`
- Modify: `apps/web/src/features/layout/app-layout.tsx`

No automated tests — visual component.

- [ ] **Step 1: Update Logo to support dark variant**

Full replacement for `apps/web/src/features/auth/logo.tsx`:

```tsx
interface LogoProps {
  variant?: 'light' | 'dark'
}

export function Logo({ variant = 'light' }: LogoProps) {
  const isDark = variant === 'dark'

  return (
    <div className="flex items-center gap-3">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d="M20 4C20 4 8 10 8 22C8 28.627 13.373 34 20 34C26.627 34 32 28.627 32 22C32 10 20 4 20 4Z"
          fill={isDark ? '#dcfce7' : 'white'}
          opacity="0.9"
        />
        <path d="M20 14L20 34" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 20C14 20 17 19 20 21" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div>
        <div className={isDark ? 'text-green-900 text-xl font-extrabold tracking-tight leading-none' : 'text-white text-xl font-extrabold tracking-tight leading-none'}>
          Farm
        </div>
        <div className={isDark ? 'text-green-600 text-[11px] font-semibold tracking-[3px] uppercase' : 'text-green-300 text-[11px] font-semibold tracking-[3px] uppercase'}>
          Market
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Pass variant="dark" in AppLayout**

In `apps/web/src/features/layout/app-layout.tsx`, change:

```tsx
<Logo />
```

to:

```tsx
<Logo variant="dark" />
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/auth/logo.tsx \
        apps/web/src/features/layout/app-layout.tsx
git commit -m "feat(web): add dark variant to Logo, fix AppLayout navbar logo"
```

---

## Task 4: Landing page

### Files
- Create: `apps/web/src/features/landing/use-featured-products.ts`
- Create: `apps/web/src/features/landing/landing-page.tsx`
- Modify: `apps/web/src/routes/index.tsx`

- [ ] **Step 1: Create the featured products hook**

Create `apps/web/src/features/landing/use-featured-products.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '../catalog/api'

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: () => catalogApi.getProducts({ limit: 8, random: true }).then((r) => r.data),
  })
}
```

- [ ] **Step 2: Create the landing page component**

Create `apps/web/src/features/landing/landing-page.tsx`:

```tsx
import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Logo } from '../auth/logo'
import { useCurrentUser } from '../auth/use-current-user'
import { useLogout } from '../auth/use-logout'
import { ProductCard } from '../catalog/product-card'
import { useFeaturedProducts } from './use-featured-products'

const QUICK_CATEGORIES = [
  { label: '🥕 Овочі', slug: 'vegetables' },
  { label: '🍎 Фрукти', slug: 'fruits' },
  { label: '🍯 Мед', slug: 'honey' },
  { label: '🥛 Молочні', slug: 'dairy' },
]

export function LandingPage() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: products = [] } = useFeaturedProducts()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    void navigate({
      to: '/catalog',
      search: search.trim() ? { search: search.trim() } : {},
    } as Parameters<typeof navigate>[0])
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo variant="dark" />
          <nav className="flex items-center gap-4 text-sm font-medium">
            {user ? (
              <>
                <Link to="/catalog" className="text-gray-700 hover:text-green-700">
                  Каталог
                </Link>
                <button
                  onClick={() =>
                    void logout.mutate(undefined, {
                      onSettled: () => void navigate({ to: '/catalog' }),
                    })
                  }
                  className="text-gray-700 hover:text-red-600"
                >
                  Вийти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-green-700">
                  Увійти
                </Link>
                <Link
                  to="/signup"
                  className="bg-green-700 text-white px-4 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Реєстрація
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-green-50 to-green-100 py-16 px-4 text-center">
        <p className="text-xs font-semibold text-green-600 tracking-widest uppercase mb-3">
          Свіжо з поля
        </p>
        <h1 className="text-3xl font-extrabold text-green-900 mb-2">
          Знаходьте продукти від українських фермерів
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Фрукти, овочі, мед і більше — прямо від виробника
        </p>
        <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук товарів (картопля, мед...)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800"
          >
            Знайти
          </button>
        </form>
        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          {QUICK_CATEGORIES.map(({ label, slug }) => (
            <Link
              key={slug}
              to="/catalog"
              search={{ category: slug } as Record<string, string>}
              className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 flex-1 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-gray-900">Нові оголошення</h2>
            <Link to="/catalog" className="text-sm text-green-700 font-medium hover:underline">
              Всі товари →
            </Link>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Завантаження...</p>
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Replace the redirect in the index route**

Full replacement for `apps/web/src/routes/index.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '../features/landing/landing-page'

export const Route = createFileRoute('/')({
  component: LandingPage,
})
```

- [ ] **Step 4: Verify the page renders and typecheck passes**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors (or only pre-existing ones unrelated to this task).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/landing/use-featured-products.ts \
        apps/web/src/features/landing/landing-page.tsx \
        apps/web/src/routes/index.tsx
git commit -m "feat(web): add landing page with hero search and featured products"
```

---

## Task 5: Farmer profile API

### Files
- Create: `apps/api/app/controllers/farmers_controller.ts`
- Create: `apps/api/tests/functional/farmers.spec.ts`
- Note: `apps/api/start/routes.ts` already has the farmers route from Task 1 Step 4.

- [ ] **Step 1: Write the failing tests**

Create `apps/api/tests/functional/farmers.spec.ts`:

```typescript
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

test.group('GET /api/v1/farmers/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns 404 when user does not exist', async ({ client }) => {
    const response = await client.get('/api/v1/farmers/999')
    response.assertStatus(404)
  })

  test('returns 404 when user is not a seller', async ({ client }) => {
    const [user] = await db
      .table('users')
      .insert({
        email: 'buyer@test.com',
        password: 'x',
        is_seller: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id'])

    const response = await client.get(`/api/v1/farmers/${user.id}`)
    response.assertStatus(404)
  })

  test('returns farmer profile with products', async ({ client, assert }) => {
    const [seller] = await db
      .table('users')
      .insert({
        email: 'farmer@test.com',
        password: 'x',
        full_name: 'Іван Петренко',
        farm_name: 'Ферма Петренко',
        is_seller: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id'])

    const [cat] = await db
      .table('categories')
      .insert({ name: 'Овочі', slug: 'veg', created_at: new Date(), updated_at: new Date() })
      .returning(['id'])

    await db.table('products').insert({
      name: 'Картопля',
      price: '20',
      unit: 'кг',
      quantity: '100',
      status: 'active',
      category_id: cat.id,
      seller_id: seller.id,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const response = await client.get(`/api/v1/farmers/${seller.id}`)
    response.assertStatus(200)
    response.assertBodyContains({
      id: seller.id,
      fullName: 'Іван Петренко',
      farmName: 'Ферма Петренко',
    })
    const body = response.body() as { products: { name: string }[] }
    assert.lengthOf(body.products, 1)
    assert.equal(body.products[0].name, 'Картопля')
  })

  test('does not include inactive products', async ({ client, assert }) => {
    const [seller] = await db
      .table('users')
      .insert({
        email: 'farm2@test.com',
        password: 'x',
        is_seller: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id'])

    const [cat] = await db
      .table('categories')
      .insert({ name: 'Фрукти', slug: 'fr', created_at: new Date(), updated_at: new Date() })
      .returning(['id'])

    await db.table('products').insert({
      name: 'Архівний товар',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'archived',
      category_id: cat.id,
      seller_id: seller.id,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const response = await client.get(`/api/v1/farmers/${seller.id}`)
    response.assertStatus(200)
    const body = response.body() as { products: unknown[] }
    assert.lengthOf(body.products, 0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && node ace test --files="tests/functional/farmers.spec.ts"
```

Expected: FAIL — controller does not exist.

- [ ] **Step 3: Create the farmers controller**

Create `apps/api/app/controllers/farmers_controller.ts`:

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Product from '#models/product'

export default class FarmersController {
  async show({ params, response }: HttpContext) {
    const farmer = await User.query()
      .where('id', params.id)
      .where('is_seller', true)
      .first()

    if (!farmer) {
      return response.notFound({ message: 'Farmer not found' })
    }

    const products = await Product.query()
      .where('seller_id', farmer.id)
      .where('status', 'active')
      .preload('category')
      .preload('seller')
      .orderBy('created_at', 'desc')

    return response.ok({
      id: farmer.id,
      fullName: farmer.fullName,
      farmName: farmer.farmName,
      memberSince: farmer.createdAt,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        quantity: p.quantity,
        imagePath: p.imagePath,
        status: p.status,
        category: p.category
          ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
          : null,
        seller: p.seller
          ? { id: p.seller.id, fullName: p.seller.fullName, farmName: p.seller.farmName }
          : null,
      })),
    })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/api && node ace test --files="tests/functional/farmers.spec.ts"
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Run all API tests to check no regressions**

```bash
cd apps/api && node ace test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/controllers/farmers_controller.ts \
        apps/api/tests/functional/farmers.spec.ts
git commit -m "feat(api): add GET /api/v1/farmers/:id for public farmer profiles"
```

---

## Task 6: Farmer profile frontend

### Files
- Create: `apps/web/src/features/farmers/api.ts`
- Create: `apps/web/src/features/farmers/use-farmer.ts`
- Create: `apps/web/src/features/farmers/__tests__/api.test.ts`
- Create: `apps/web/src/features/farmers/farmer-profile-page.tsx`
- Create: `apps/web/src/routes/farmers/$id.tsx`
- Modify: `apps/web/src/features/catalog/product-page.tsx`

- [ ] **Step 1: Write failing frontend unit tests**

Create `apps/web/src/features/farmers/__tests__/api.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { farmersApi } from '../api'

const mockFetch = vi.fn()

describe('farmersApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('getFarmer', () => {
    it('calls GET /api/v1/farmers/:id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      await farmersApi.getFarmer(7)
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/farmers/7')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm test -- --reporter=verbose
```

Expected: FAIL — `farmersApi` does not exist.

- [ ] **Step 3: Create the farmers API module**

Create `apps/web/src/features/farmers/api.ts`:

```typescript
import { apiFetch } from '../../lib/api/fetch-client'
import type { Product } from '../catalog/types'

export interface Farmer {
  id: number
  fullName: string | null
  farmName: string | null
  memberSince: string
  products: Product[]
}

export const farmersApi = {
  getFarmer: (id: number) => apiFetch<Farmer>(`/api/v1/farmers/${id}`),
}
```

- [ ] **Step 4: Create the use-farmer hook**

Create `apps/web/src/features/farmers/use-farmer.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { farmersApi } from './api'

export function useFarmer(id: number) {
  return useQuery({
    queryKey: ['farmer', id],
    queryFn: () => farmersApi.getFarmer(id),
    enabled: !isNaN(id),
  })
}
```

- [ ] **Step 5: Run frontend tests to verify they pass**

```bash
cd apps/web && pnpm test -- --reporter=verbose
```

Expected: PASS — all tests pass.

- [ ] **Step 6: Create the farmer profile page component**

Create `apps/web/src/features/farmers/farmer-profile-page.tsx`:

```tsx
import { useParams } from '@tanstack/react-router'
import { useFarmer } from './use-farmer'
import { ProductCard } from '../catalog/product-card'

export function FarmerProfilePage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { data: farmer, isLoading, isError } = useFarmer(Number(id))

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>
  if (isError || !farmer) return <div className="p-8 text-sm text-red-500">Фермера не знайдено</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white border rounded-xl p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {farmer.farmName ?? farmer.fullName ?? 'Ферма'}
        </h1>
        {farmer.farmName && farmer.fullName && (
          <p className="text-sm text-gray-500 mt-1">{farmer.fullName}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Учасник з{' '}
          {new Date(farmer.memberSince).toLocaleDateString('uk-UA', {
            year: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <h2 className="text-base font-semibold text-gray-800 mb-4">
        Товари ({farmer.products.length})
      </h2>

      {farmer.products.length === 0 ? (
        <p className="text-sm text-gray-500">Немає активних товарів</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {farmer.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Create the route**

Create `apps/web/src/routes/farmers/$id.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '../../features/layout/app-layout'
import { FarmerProfilePage } from '../../features/farmers/farmer-profile-page'

export const Route = createFileRoute('/farmers/$id')({
  component: () => (
    <AppLayout>
      <FarmerProfilePage />
    </AppLayout>
  ),
})
```

- [ ] **Step 8: Link seller name on product page to farmer profile**

In `apps/web/src/features/catalog/product-page.tsx`, replace:

```tsx
<div className="text-sm text-gray-600">
  <p className="font-medium">
    {product.seller.farmName ?? product.seller.fullName ?? 'Продавець'}
  </p>
</div>
```

with:

```tsx
<div className="text-sm text-gray-600">
  <Link
    to="/farmers/$id"
    params={{ id: String(product.seller.id) }}
    className="font-medium hover:text-green-700 hover:underline"
  >
    {product.seller.farmName ?? product.seller.fullName ?? 'Продавець'}
  </Link>
</div>
```

Also add the import at the top of `product-page.tsx`:

```typescript
import { useParams, Link } from '@tanstack/react-router'
```

(replaces the existing `import { useParams } from '@tanstack/react-router'`)

- [ ] **Step 9: Run typecheck to verify no errors**

```bash
cd apps/web && pnpm typecheck
```

Expected: no new errors.

- [ ] **Step 10: Run all frontend tests**

```bash
cd apps/web && pnpm test -- --reporter=verbose
```

Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/features/farmers/ \
        apps/web/src/routes/farmers/ \
        apps/web/src/features/catalog/product-page.tsx
git commit -m "feat(web): add farmer public profile page at /farmers/:id"
```
