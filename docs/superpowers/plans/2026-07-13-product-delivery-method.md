# Product Delivery Method Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let sellers declare which delivery methods (Nova Poshta, Ukrposhta, in-person pickup) a product supports, and let buyers filter the catalog by delivery method.

**Architecture:** A `delivery_methods` JSONB string-array column on `products`, following the existing `farms.activities` pattern exactly (same `prepare`/`consume` column decorator, same jsonb-containment query filter approach). No external API calls — this is a declarative tag on the listing; address/cost negotiation stays in chat, unchanged.

**Tech Stack:** AdonisJS v6 (Lucid ORM, Postgres jsonb), Zod (`packages/shared`), Japa (API tests), React + TanStack Router/Query (frontend), Vitest (frontend API-layer tests).

## Global Constraints

- No Nova Poshta (or any carrier) API integration — this is a tag, not a shipping/label system. Spec: `docs/superpowers/specs/2026-07-13-product-delivery-method-design.md`.
- Allowed values are a fixed enum: `nova_poshta`, `ukrposhta`, `pickup` — not free text.
- `deliveryMethods` is optional/defaults to `[]` — existing products must keep working unmodified.
- Catalog filter is single-value only (matches the existing category filter's behavior) — no multi-select filter in this iteration.
- Do NOT run `git commit` in any step — the user commits manually after reviewing each task's diff.

---

### Task 1: Backend — data model, API, and filtering

**Files:**
- Create: `apps/api/database/migrations/1781600000000_add_delivery_methods_to_products.ts`
- Modify: `packages/shared/src/schemas/product.ts`
- Modify: `apps/api/app/models/product.ts`
- Modify: `apps/api/app/transformers/product_transformer.ts`
- Modify: `apps/api/app/controllers/seller/seller_products_controller.ts`
- Modify: `apps/api/app/controllers/catalog/products_controller.ts`
- Test: `apps/api/tests/functional/seller_products.spec.ts`
- Test: `apps/api/tests/functional/products.spec.ts`

**Interfaces:**
- Produces: `Product.deliveryMethods: string[]` (model field), `deliveryMethod` Zod enum + `deliveryMethods?: DeliveryMethod[]` on `createProductSchema`/`updateProductSchema` (`packages/shared`), `deliveryMethods` key on the JSON returned by `GET /api/v1/products`, `GET /api/v1/products/:id`, `POST /api/v1/seller/products`, `PUT /api/v1/seller/products/:id`. Query param `?deliveryMethod=<value>` accepted by `GET /api/v1/products`.
- Consumes: nothing from other tasks (this is the foundation task).

- [ ] **Step 1: Write failing test — create product with delivery methods**

In `apps/api/tests/functional/seller_products.spec.ts`, add inside the existing `test.group('POST /api/v1/seller/products', ...)` block (after the `'creates a product'` test):

```ts
  test('creates a product with delivery methods', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()

    const response = await client
      .post('/api/v1/seller/products')
      .json({
        name: 'Кролятина',
        categoryId: category.id,
        price: 200,
        unit: 'кг',
        quantity: 10,
        deliveryMethods: ['nova_poshta', 'pickup'],
      })
      .loginAs(seller)

    response.assertStatus(201)
    const body = response.body() as { deliveryMethods: string[] }
    assert.deepEqual(body.deliveryMethods, ['nova_poshta', 'pickup'])
  })
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd apps/api && node ace test functional --files="seller_products"`
Expected: FAIL — `body.deliveryMethods` is `undefined` (the field doesn't exist yet anywhere in the stack), not `['nova_poshta', 'pickup']`.

- [ ] **Step 3: Implement — migration, shared schema, model column, transformer, store()**

Create `apps/api/database/migrations/1781600000000_add_delivery_methods_to_products.ts`:

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('delivery_methods').notNullable().defaultTo('[]')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('delivery_methods')
    })
  }
}
```

Run the migration (also regenerates `apps/api/database/schema.ts`):

```bash
cd apps/api && node ace migration:run
```

In `packages/shared/src/schemas/product.ts`, replace the full file with:

```ts
import { z } from 'zod'

export const productStatus = z.enum(['active', 'inactive', 'archived'])
export const deliveryMethod = z.enum(['nova_poshta', 'ukrposhta', 'pickup'])

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  categoryId: z.number().int().positive(),
  description: z.string().nullable().optional(),
  price: z.number().positive(),
  unit: z.string().min(1).max(50),
  quantity: z.number().min(0),
  status: productStatus.optional(),
  deliveryMethods: z.array(deliveryMethod).optional(),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductStatus = z.infer<typeof productStatus>
export type DeliveryMethod = z.infer<typeof deliveryMethod>
```

In `apps/api/app/models/product.ts`, replace the full file with:

```ts
import { ProductSchema } from '#database/schema'
import { column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Category from '#models/category'

export default class Product extends ProductSchema {
  declare status: 'active' | 'inactive' | 'archived'

  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: string | string[]) =>
      typeof value === 'string' ? JSON.parse(value) : (value ?? []),
  })
  declare deliveryMethods: string[]

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => User, { foreignKey: 'sellerId' })
  declare seller: BelongsTo<typeof User>
}
```

In `apps/api/app/transformers/product_transformer.ts:7-15`, add `'deliveryMethods'` to the pick list:

```ts
      ...this.pick(this.resource, [
        'id',
        'name',
        'price',
        'unit',
        'quantity',
        'imagePath',
        'status',
        'deliveryMethods',
      ]),
```

In `apps/api/app/controllers/seller/seller_products_controller.ts:24-33`, add `deliveryMethods` to `store()`'s `Product.create(...)` call:

```ts
    const product = await Product.create({
      name: data.name,
      categoryId: data.categoryId,
      description: data.description ?? null,
      price: String(data.price),
      unit: data.unit,
      quantity: String(data.quantity),
      status: data.status ?? 'active',
      deliveryMethods: data.deliveryMethods ?? [],
      sellerId: seller.id,
    })
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd apps/api && node ace test functional --files="seller_products"`
Expected: PASS

- [ ] **Step 5: Write failing test — update delivery methods**

In `apps/api/tests/functional/seller_products.spec.ts`, add inside `test.group('PUT /api/v1/seller/products/:id', ...)` (after `'updates own product'`):

```ts
  test('updates delivery methods', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    const product = await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Old',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
      deliveryMethods: ['pickup'],
    })

    const response = await client
      .put(`/api/v1/seller/products/${product.id}`)
      .json({ deliveryMethods: ['nova_poshta', 'ukrposhta'] })
      .loginAs(seller)

    response.assertStatus(200)
    const body = response.body() as { deliveryMethods: string[] }
    assert.deepEqual(body.deliveryMethods, ['nova_poshta', 'ukrposhta'])
  })
```

- [ ] **Step 6: Run test, verify it fails**

Run: `cd apps/api && node ace test functional --files="seller_products"`
Expected: FAIL — `body.deliveryMethods` is still `['pickup']` (the original value), because `update()` never assigns the new value.

- [ ] **Step 7: Implement — update()**

In `apps/api/app/controllers/seller/seller_products_controller.ts:52-58`, add one line to the `update()` field-assignment block:

```ts
    if (data.name !== undefined) product.name = data.name
    if (data.categoryId !== undefined) product.categoryId = data.categoryId
    if (data.description !== undefined) product.description = data.description ?? null
    if (data.price !== undefined) product.price = String(data.price)
    if (data.unit !== undefined) product.unit = data.unit
    if (data.quantity !== undefined) product.quantity = String(data.quantity)
    if (data.status !== undefined) product.status = data.status
    if (data.deliveryMethods !== undefined) product.deliveryMethods = data.deliveryMethods
```

- [ ] **Step 8: Run test, verify it passes**

Run: `cd apps/api && node ace test functional --files="seller_products"`
Expected: PASS

- [ ] **Step 9: Write failing test — show endpoint returns delivery methods**

In `apps/api/tests/functional/products.spec.ts`, add inside `test.group('GET /api/v1/products/:id', ...)` (after `'returns single product'`):

```ts
  test('returns delivery methods', async ({ client }) => {
    const seller = await User.create({
      fullName: 'Іван',
      email: 'ivan4@test.com',
      password: 'secret123',
      isSeller: true,
    })
    const category = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    const product = await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Кролятина',
      price: '200',
      unit: 'кг',
      quantity: '10',
      status: 'active',
      deliveryMethods: ['nova_poshta'],
    })

    const response = await client.get(`/api/v1/products/${product.id}`)
    response.assertStatus(200)
    response.assertBodyContains({ deliveryMethods: ['nova_poshta'] })
  })
```

- [ ] **Step 10: Run test, verify it fails**

Run: `cd apps/api && node ace test functional --files="products"`
Expected: FAIL — `deliveryMethods` key is absent from the response body (`show()` builds its response object manually and doesn't include it).

- [ ] **Step 11: Implement — show()**

In `apps/api/app/controllers/catalog/products_controller.ts:51-77`, add `deliveryMethods` to the response object:

```ts
    return response.ok({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      quantity: product.quantity,
      imagePath: product.imagePath,
      status: product.status,
      deliveryMethods: product.deliveryMethods,
      category: product.category
        ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
        : null,
      seller: product.seller
        ? {
            id: product.seller.id,
            fullName: product.seller.fullName,
            farmName: product.seller.farmName,
            contacts: isAuthenticated
              ? {
                  phone: product.seller.phone ?? null,
                  telegram: product.seller.telegram ?? null,
                  viber: product.seller.viber ?? null,
                }
              : null,
          }
        : null,
    })
```

- [ ] **Step 12: Run test, verify it passes**

Run: `cd apps/api && node ace test functional --files="products"`
Expected: PASS

- [ ] **Step 13: Write failing test — filter by delivery method**

In `apps/api/tests/functional/products.spec.ts`, add inside `test.group('GET /api/v1/products', ...)` (after `'filters by name search'`):

```ts
  test('filters by delivery method', async ({ client, assert }) => {
    const seller = await User.create({
      fullName: 'Y',
      email: 'y@test.com',
      password: 'secret123',
      isSeller: true,
    })
    const category = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Кролятина',
      price: '200',
      unit: 'кг',
      quantity: '10',
      status: 'active',
      deliveryMethods: ['nova_poshta'],
    })
    await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Огірки',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
      deliveryMethods: ['pickup'],
    })

    const response = await client.get('/api/v1/products?deliveryMethod=nova_poshta')
    response.assertStatus(200)
    const body = response.body() as { data: { name: string }[] }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0]!.name, 'Кролятина')
  })
```

- [ ] **Step 14: Run test, verify it fails**

Run: `cd apps/api && node ace test functional --files="products"`
Expected: FAIL — both products are returned (`body.data` has length 2), because `index()` ignores the `deliveryMethod` query param.

- [ ] **Step 15: Implement — index()**

In `apps/api/app/controllers/catalog/products_controller.ts:6-24`, replace `index()` with:

```ts
  async index({ request, serialize }: HttpContext) {
    const { category, search, limit, random, deliveryMethod } = request.qs() as {
      category?: string
      search?: string
      limit?: string
      random?: string
      deliveryMethod?: string
    }

    const query = Product.query().where('status', 'active').preload('category').preload('seller')

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

    if (deliveryMethod) {
      query.whereRaw('delivery_methods @> ?', [JSON.stringify([deliveryMethod])])
    }

    if (limit) {
      query.limit(Number(limit))
    }

    const products = await query
    return serialize(ProductTransformer.transform(products))
  }
```

- [ ] **Step 16: Run test, verify it passes**

Run: `cd apps/api && node ace test functional --files="products"`
Expected: PASS

- [ ] **Step 17: Run the full API test suite and typecheck**

Run: `cd apps/api && node ace test && pnpm typecheck`
Expected: all tests pass, no type errors.

- [ ] **Step 18: Report back — do NOT commit**

Show the diff to the user and stop. Do not run `git commit`.

---

### Task 2: Frontend — shared delivery-method constant, types, and seller product form

**Files:**
- Create: `apps/web/src/routes/catalog/delivery-methods.ts`
- Modify: `apps/web/src/routes/catalog/types.ts`
- Modify: `apps/web/src/routes/seller/products/api.ts`
- Modify: `apps/web/src/routes/seller/products/-product-form.tsx`

**Interfaces:**
- Consumes: `apps/api` response shape from Task 1 (`deliveryMethods: string[]` on `Product`; `POST`/`PUT /api/v1/seller/products` accept `deliveryMethods: string[]` in the request body).
- Produces: `DELIVERY_METHODS: { value: string; label: string }[]` and `deliveryMethodLabel(value: string): string` (exported from `catalog/delivery-methods.ts`, consumed by Task 3 and Task 4). `Product.deliveryMethods: string[]` and `ProductInput.deliveryMethods: string[]` types.

There is no established component-rendering test pattern in this repo (frontend tests only cover the API/hook layer — see `apps/web/src/routes/catalog/__tests__/api.test.ts`). This task is verified via typecheck, not a new test file.

- [ ] **Step 1: Create the shared delivery-methods constant**

Create `apps/web/src/routes/catalog/delivery-methods.ts`:

```ts
export const DELIVERY_METHODS = [
  { value: 'nova_poshta', label: 'Нова Пошта' },
  { value: 'ukrposhta', label: 'Укрпошта' },
  { value: 'pickup', label: 'Особиста зустріч' },
] as const

export function deliveryMethodLabel(value: string): string {
  return DELIVERY_METHODS.find((m) => m.value === value)?.label ?? value
}
```

- [ ] **Step 2: Add the field to the `Product` type**

In `apps/web/src/routes/catalog/types.ts:20-31`, add `deliveryMethods` to the `Product` interface:

```ts
export interface Product {
  id: number
  name: string
  description: string | null
  price: string
  unit: string
  quantity: string
  imagePath: string | null
  status: 'active' | 'inactive' | 'archived'
  deliveryMethods: string[]
  category: Category
  seller: ProductSeller
}
```

- [ ] **Step 3: Add the field to `ProductInput`**

In `apps/web/src/routes/seller/products/api.ts:10-18`, add `deliveryMethods` to the `ProductInput` interface:

```ts
export interface ProductInput {
  name: string
  categoryId: number
  description?: string | null
  price: number
  unit: string
  quantity: number
  status?: 'active' | 'inactive' | 'archived'
  deliveryMethods: string[]
}
```

- [ ] **Step 4: Add the multi-select toggle UI to the product form**

In `apps/web/src/routes/seller/products/-product-form.tsx`, add the import (near the top, alongside the other relative imports):

```ts
import { DELIVERY_METHODS } from '../../catalog/delivery-methods'
```

Add state, initialized from `initial?.deliveryMethods` (line 29, right after the `imageFile` state):

```tsx
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(initial?.deliveryMethods ?? [])
```

Add the toggle function (right after `handleSubmit`'s closing brace, or anywhere in the component body before the `return`):

```tsx
  const toggleDeliveryMethod = (method: string) => {
    setDeliveryMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    )
  }
```

Include it in the submit payload — update `handleSubmit` (lines 34-45):

```tsx
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      categoryId,
      description: description || null,
      price: Number(price),
      unit,
      quantity: Number(quantity),
      status,
      deliveryMethods,
    })
  }
```

Add the pill-button UI, placed right after the status `<select>` block (after line 143's closing `</div>`, before the "Фото" block):

```tsx
      <div className="flex flex-col gap-1.5">
        <Label>Спосіб доставки</Label>
        <div className="flex flex-wrap gap-2">
          {DELIVERY_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => toggleDeliveryMethod(method.value)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                deliveryMethods.includes(method.value)
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: no errors.

- [ ] **Step 6: Report back — do NOT commit**

Show the diff to the user and stop. Do not run `git commit`.

---

### Task 3: Frontend — catalog delivery-method filter

**Files:**
- Modify: `apps/web/src/routes/catalog/route.tsx`
- Modify: `apps/web/src/routes/catalog/api.ts`
- Modify: `apps/web/src/routes/catalog/use-products.ts`
- Modify: `apps/web/src/routes/catalog/-catalog-page.tsx`
- Test: `apps/web/src/routes/catalog/__tests__/api.test.ts`

**Interfaces:**
- Consumes: `DELIVERY_METHODS` from `./delivery-methods` (Task 2); `deliveryMethod` query param on `GET /api/v1/products` (Task 1).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write failing test — `deliveryMethod` query param**

In `apps/web/src/routes/catalog/__tests__/api.test.ts`, add inside the `describe('getProducts', ...)` block (after `'appends random=true when random is true'`):

```ts
    it('appends deliveryMethod param when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({ deliveryMethod: 'nova_poshta' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('deliveryMethod=nova_poshta')
    })
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm --filter web test -- run api.test.ts`
Expected: FAIL — `TypeError` or the URL not containing `deliveryMethod=` (the param doesn't exist on `GetProductsParams` yet).

- [ ] **Step 3: Implement — `catalog/api.ts`**

Replace the full contents of `apps/web/src/routes/catalog/api.ts`:

```ts
import { apiFetch } from '../../lib/api/fetch-client'
import type { Category, Product } from './types'

interface GetProductsParams {
  category?: string
  search?: string
  limit?: number
  random?: boolean
  deliveryMethod?: string
}

export const catalogApi = {
  getProducts: ({ category, search, limit, random, deliveryMethod }: GetProductsParams) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    if (limit !== undefined) params.set('limit', String(limit))
    if (random) params.set('random', 'true')
    if (deliveryMethod) params.set('deliveryMethod', deliveryMethod)
    const qs = params.toString()
    return apiFetch<{ data: Product[] }>(`/api/v1/products${qs ? `?${qs}` : ''}`)
  },
  getProduct: (id: number) => apiFetch<Product>(`/api/v1/products/${id}`),
  getCategories: () => apiFetch<{ data: Category[] }>('/api/v1/categories'),
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm --filter web test -- run api.test.ts`
Expected: PASS

- [ ] **Step 5: Wire the param through `use-products.ts`**

Replace the full contents of `apps/web/src/routes/catalog/use-products.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { catalogApi } from './api'

interface UseProductsParams {
  category?: string
  search?: string
  deliveryMethod?: string
}

export function useProducts(params: UseProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => catalogApi.getProducts(params).then((r) => r.data),
  })
}
```

- [ ] **Step 6: Add `deliveryMethod` to the route's search schema**

In `apps/web/src/routes/catalog/route.tsx:7-11`, update `searchSchema`:

```ts
const searchSchema = z.object({
  tab: z.enum(['products', 'requests']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  deliveryMethod: z.string().optional(),
})
```

- [ ] **Step 7: Add the filter chips to the catalog page**

In `apps/web/src/routes/catalog/-catalog-page.tsx`, add the import (line 4, alongside the other relative imports):

```tsx
import { DELIVERY_METHODS } from './delivery-methods'
```

Read the search param and pass it to `useProducts` — update lines 15-22:

```tsx
  const activeCategory = search.category
  const activeSearch = search.search
  const activeDeliveryMethod = search.deliveryMethod

  const { data: categories = [] } = useCategories()
  const { data: products = [], isLoading } = useProducts({
    category: activeCategory,
    search: activeSearch,
    deliveryMethod: activeDeliveryMethod,
  })
```

Add the click handler, right after `handleCategoryClick` (after line 30):

```tsx
  const handleDeliveryMethodClick = (value?: string) => {
    void navigate({ search: (prev) => ({ ...prev, deliveryMethod: value, search: undefined }) })
  }
```

Add the chip list to the JSX, inside the existing `<aside>` block, right after the categories `</ul>` closes (after line 96, still inside `<aside>` before its closing tag on line 97):

```tsx
            <p className="hidden md:block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-4">
              Доставка
            </p>
            <ul className="flex overflow-x-auto gap-2 pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
              <li className="shrink-0">
                <button
                  onClick={() => handleDeliveryMethodClick(undefined)}
                  className={`whitespace-nowrap md:whitespace-normal md:w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    !activeDeliveryMethod
                      ? 'bg-green-100 text-green-800 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Всі
                </button>
              </li>
              {DELIVERY_METHODS.map((method) => (
                <li key={method.value} className="shrink-0">
                  <button
                    onClick={() => handleDeliveryMethodClick(method.value)}
                    className={`whitespace-nowrap md:whitespace-normal md:w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      activeDeliveryMethod === method.value
                        ? 'bg-green-100 text-green-800 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {method.label}
                  </button>
                </li>
              ))}
            </ul>
```

- [ ] **Step 8: Typecheck and run the full frontend test suite**

Run: `pnpm --filter web typecheck && pnpm --filter web test -- run`
Expected: no type errors, all tests pass.

- [ ] **Step 9: Report back — do NOT commit**

Show the diff to the user and stop. Do not run `git commit`.

---

### Task 4: Frontend — display delivery-method tags

**Files:**
- Modify: `apps/web/src/routes/catalog/-product-card.tsx`
- Modify: `apps/web/src/routes/products/$id/-product-page.tsx`

**Interfaces:**
- Consumes: `deliveryMethodLabel` from `./delivery-methods` (Task 2); `Product.deliveryMethods: string[]` (Task 2).
- Produces: nothing consumed by later tasks (final task).

No test framework covers component rendering in this repo (see Task 2 note) — verify via typecheck and a manual check in the browser (`pnpm --filter web dev`, open `/catalog` and a product detail page).

- [ ] **Step 1: Show tags on the product card**

In `apps/web/src/routes/catalog/-product-card.tsx`, add the import (line 2, alongside the `Product` type import):

```tsx
import { deliveryMethodLabel } from './delivery-methods'
```

Add the tag row right after the price paragraph (after line 57's `</p>`, before the `{user && (` block):

```tsx
        {product.deliveryMethods.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.deliveryMethods.map((method) => (
              <span
                key={method}
                className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
              >
                {deliveryMethodLabel(method)}
              </span>
            ))}
          </div>
        )}
```

- [ ] **Step 2: Show tags on the product detail page**

In `apps/web/src/routes/products/$id/-product-page.tsx`, add the import (line 4, alongside the other relative imports):

```tsx
import { deliveryMethodLabel } from '../../catalog/delivery-methods'
```

Add the tag row right after the category badge block (after line 57's `</div>`, before the `<h1>` on line 58):

```tsx
        {product.deliveryMethods.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.deliveryMethods.map((method) => (
              <span
                key={method}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
              >
                {deliveryMethodLabel(method)}
              </span>
            ))}
          </div>
        )}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: no errors.

- [ ] **Step 4: Manual check**

Run: `pnpm start:dev` (or `pnpm --filter web dev` + `pnpm --filter api dev` in separate terminals)
- Create/edit a product as a seller, select one or more delivery methods, save.
- Confirm the tags appear on that product's catalog card and detail page.
- On `/catalog`, click a delivery-method chip and confirm only matching products show.

- [ ] **Step 5: Report back — do NOT commit**

Show the diff to the user and stop. Do not run `git commit`.
