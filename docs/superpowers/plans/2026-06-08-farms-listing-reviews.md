# Farms Listing & Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/farms` listing page, a "Ферми" nav link, and a star-rated review section on each farm's detail page.

**Architecture:** Six sequential tasks — four backend (migration → farms index → review stats on show → reviews CRUD) then two frontend (list page → reviews section). Each task ends with a passing test suite and a commit.

**Tech Stack:** AdonisJS v6, Lucid ORM, PostgreSQL, React 19, TanStack Router, TanStack Query, Zod

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/database/migrations/1780930000000_create_farm_reviews_table.ts` | Create | `farm_reviews` table |
| `apps/api/app/models/farm_review.ts` | Create | Lucid model with `belongsTo User` |
| `apps/api/database/schema.ts` | Modify | Add `FarmReviewSchema` class |
| `apps/api/app/validators/farm_review.ts` | Create | Zod schema for review body |
| `apps/api/app/controllers/catalog/farms_controller.ts` | Modify | Add `index` action; add review stats to `show` |
| `apps/api/app/controllers/catalog/farm_reviews_controller.ts` | Create | `index` + `store` for reviews |
| `apps/api/app/transformers/farm_transformer.ts` | Modify | Add `reviewCount`, `avgRating` fields |
| `apps/api/start/routes.ts` | Modify | Register new routes |
| `apps/api/tests/functional/farms.spec.ts` | Modify | Add `GET /api/v1/farms` tests + review stats tests |
| `apps/api/tests/functional/farm_reviews.spec.ts` | Create | Tests for reviews endpoints |
| `apps/web/src/routes/farms/api.ts` | Create | `FarmSummary` type + `farmsListApi` |
| `apps/web/src/routes/farms/use-farms.ts` | Create | `useFarms` query hook |
| `apps/web/src/routes/farms/-farm-card.tsx` | Create | Farm card UI component |
| `apps/web/src/routes/farms/-farms-page.tsx` | Create | Farm list page body |
| `apps/web/src/routes/farms/index.tsx` | Create | TanStack route `/farms/` |
| `apps/web/src/shared/layout/app-layout.tsx` | Modify | Add "Ферми" nav link |
| `apps/web/src/routes/farms/$id/api.ts` | Modify | Add `Review` type + `reviewsApi` |
| `apps/web/src/routes/farms/$id/-reviews.tsx` | Create | Reviews section component |
| `apps/web/src/routes/farms/$id/-farm-page.tsx` | Modify | Render `<FarmReviews>` at bottom |

---

## Task 1: farm_reviews migration, schema, model

**Files:**
- Create: `apps/api/database/migrations/1780930000000_create_farm_reviews_table.ts`
- Modify: `apps/api/database/schema.ts`
- Create: `apps/api/app/models/farm_review.ts`

- [ ] **Step 1: Create migration**

```typescript
// apps/api/database/migrations/1780930000000_create_farm_reviews_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('farm_reviews', (table) => {
      table.increments('id')
      table
        .integer('farm_id')
        .unsigned()
        .notNullable()
        .references('farms.id')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE')
      table.integer('rating').unsigned().notNullable()
      table.text('text').notNullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('farm_reviews')
  }
}
```

- [ ] **Step 2: Add FarmReviewSchema to database/schema.ts**

Insert this block just before the `MessageSchema` class (keep alphabetical order of schema classes):

```typescript
export class FarmReviewSchema extends BaseModel {
  static $columns = ['createdAt', 'farmId', 'id', 'rating', 'text', 'userId'] as const
  $columns = FarmReviewSchema.$columns
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column()
  declare farmId: number
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare rating: number
  @column()
  declare text: string
  @column()
  declare userId: number
}
```

- [ ] **Step 3: Create FarmReview model**

```typescript
// apps/api/app/models/farm_review.ts
import { FarmReviewSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class FarmReview extends FarmReviewSchema {
  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}
```

- [ ] **Step 4: Run migration**

```bash
cd apps/api && node ace migration:run
```

Expected: `migration: completed database/migrations/1780930000000_create_farm_reviews_table`

- [ ] **Step 5: Commit**

```bash
git add apps/api/database/migrations/1780930000000_create_farm_reviews_table.ts \
        apps/api/database/schema.ts \
        apps/api/app/models/farm_review.ts
git commit -m "feat: add farm_reviews table, schema, and model"
```

---

## Task 2: GET /api/v1/farms — farm list endpoint

**Files:**
- Modify: `apps/api/app/controllers/catalog/farms_controller.ts`
- Modify: `apps/api/start/routes.ts`
- Modify: `apps/api/tests/functional/farms.spec.ts`

- [ ] **Step 1: Add test group to farms.spec.ts**

Add this test group at the top of `farms.spec.ts`, before the existing `GET /api/v1/farms/:id` group. The file already imports `User`, `Farm`, `db`, `testUtils` — reuse them.

```typescript
test.group('GET /api/v1/farms', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns empty list when no farms', async ({ client, assert }) => {
    const response = await client.get('/api/v1/farms')
    response.assertStatus(200)
    assert.isArray(response.body().data)
    assert.equal(response.body().data.length, 0)
    assert.exists(response.body().meta)
  })

  test('returns farms with review stats', async ({ client, assert }) => {
    const { seller, farm } = await createSellerWithFarm()
    await db.table('farm_reviews').insert({
      farm_id: farm.id,
      user_id: seller.id,
      rating: 4,
      text: 'Гарно',
      created_at: new Date(),
    })

    const response = await client.get('/api/v1/farms')
    response.assertStatus(200)
    const item = response.body().data[0]
    assert.equal(item.name, 'Ферма Петренка')
    assert.equal(item.reviewCount, 1)
    assert.equal(item.avgRating, 4)
    assert.isNull(item.coverImagePath)
    assert.isArray(item.activities)
    assert.exists(response.body().meta.currentPage)
  })

  test('returns null avgRating when no reviews', async ({ client, assert }) => {
    await createSellerWithFarm()
    const response = await client.get('/api/v1/farms')
    response.assertStatus(200)
    assert.equal(response.body().data[0].reviewCount, 0)
    assert.isNull(response.body().data[0].avgRating)
  })
})
```

- [ ] **Step 2: Run the new tests — expect FAIL**

```bash
cd apps/api && node ace test --files="tests/functional/farms.spec.ts"
```

Expected: FAIL — `GET /api/v1/farms` returns 404 (route not registered yet).

- [ ] **Step 3: Add index action to farms_controller.ts**

Replace the entire file:

```typescript
// apps/api/app/controllers/catalog/farms_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Farm from '#models/farm'
import Product from '#models/product'
import FarmTransformer from '#transformers/farm_transformer'
import db from '@adonisjs/lucid/services/db'

export default class FarmsController {
  async index({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const farmsPage = await Farm.query().orderBy('created_at', 'desc').paginate(page, 20)

    const farmIds = farmsPage.map((f) => f.id)
    const stats =
      farmIds.length > 0
        ? await db
            .from('farm_reviews')
            .whereIn('farm_id', farmIds)
            .groupBy('farm_id')
            .select('farm_id')
            .count('* as review_count')
            .avg('rating as avg_rating')
        : []

    const statsMap = new Map(stats.map((s: any) => [Number(s.farm_id), s]))

    const data = farmsPage.map((farm) => {
      const stat = statsMap.get(farm.id)
      return {
        id: farm.id,
        name: farm.name,
        location: farm.location ?? null,
        coverImagePath: farm.coverImagePath ?? null,
        activities: farm.activities ?? [],
        reviewCount: Number(stat?.review_count ?? 0),
        avgRating: stat?.avg_rating ? Number(Number(stat.avg_rating).toFixed(1)) : null,
      }
    })

    return response.json({ data, meta: farmsPage.getMeta() })
  }

  async show({ params, response, serialize }: HttpContext) {
    const farmId = Number(params.id)
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return response.notFound({ message: 'Farm not found' })
    }

    const farm = await Farm.query()
      .where('id', farmId)
      .preload('user')
      .preload('photos', (q) => q.orderBy('position', 'asc').orderBy('created_at', 'asc'))
      .first()

    if (!farm) return response.notFound({ message: 'Farm not found' })

    const products = await Product.query()
      .where('seller_id', farm.userId)
      .where('status', 'active')
      .preload('category')
      .orderBy('created_at', 'desc')
      .limit(50)

    farm.$extras.products = products.map((p) => ({
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
    }))

    return serialize.withoutWrapping(FarmTransformer.transform(farm))
  }
}
```

- [ ] **Step 4: Register the route**

In `apps/api/start/routes.ts`, replace the farms group:

```typescript
router
  .group(() => {
    router.get('/', [controllers.catalog.Farms, 'index'])
    router.get('/:id', [controllers.catalog.Farms, 'show'])
  })
  .prefix('farms')
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd apps/api && node ace test --files="tests/functional/farms.spec.ts"
```

Expected: all tests pass including the new 3.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/controllers/catalog/farms_controller.ts \
        apps/api/start/routes.ts \
        apps/api/tests/functional/farms.spec.ts
git commit -m "feat: add GET /api/v1/farms endpoint with review stats"
```

---

## Task 3: Add avgRating + reviewCount to GET /api/v1/farms/:id

**Files:**
- Modify: `apps/api/app/controllers/catalog/farms_controller.ts`
- Modify: `apps/api/app/transformers/farm_transformer.ts`
- Modify: `apps/api/tests/functional/farms.spec.ts`

- [ ] **Step 1: Add tests to the existing `GET /api/v1/farms/:id` group in farms.spec.ts**

Add these two tests inside the existing `GET /api/v1/farms/:id` group (after the last existing test):

```typescript
test('includes avgRating and reviewCount', async ({ client, assert }) => {
  const { seller, farm } = await createSellerWithFarm()
  await db.table('farm_reviews').insert([
    { farm_id: farm.id, user_id: seller.id, rating: 4, text: 'A', created_at: new Date() },
    { farm_id: farm.id, user_id: seller.id, rating: 5, text: 'B', created_at: new Date() },
  ])

  const response = await client.get(`/api/v1/farms/${farm.id}`)
  response.assertStatus(200)
  assert.equal(response.body().reviewCount, 2)
  assert.equal(response.body().avgRating, 4.5)
})

test('returns reviewCount 0 and null avgRating when no reviews', async ({ client, assert }) => {
  const { farm } = await createSellerWithFarm()
  const response = await client.get(`/api/v1/farms/${farm.id}`)
  response.assertStatus(200)
  assert.equal(response.body().reviewCount, 0)
  assert.isNull(response.body().avgRating)
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/api && node ace test --files="tests/functional/farms.spec.ts"
```

Expected: the 2 new tests fail — `reviewCount` and `avgRating` are missing from the response.

- [ ] **Step 3: Update the show action in farms_controller.ts**

Add the db import (already there from Task 2). In the `show` method, after building `farm.$extras.products`, add:

```typescript
    const [reviewStats] = await db
      .from('farm_reviews')
      .where('farm_id', farmId)
      .count('* as review_count')
      .avg('rating as avg_rating')

    farm.$extras.reviewCount = Number(reviewStats.review_count)
    farm.$extras.avgRating = reviewStats.avg_rating
      ? Number(Number(reviewStats.avg_rating).toFixed(1))
      : null
```

The `show` method now ends with:

```typescript
    farm.$extras.reviewCount = Number(reviewStats.review_count)
    farm.$extras.avgRating = reviewStats.avg_rating
      ? Number(Number(reviewStats.avg_rating).toFixed(1))
      : null

    return serialize.withoutWrapping(FarmTransformer.transform(farm))
```

- [ ] **Step 4: Update FarmTransformer**

Replace `farm_transformer.ts`:

```typescript
// apps/api/app/transformers/farm_transformer.ts
import type Farm from '#models/farm'
import { BaseTransformer } from '@adonisjs/core/transformers'

interface ProductSummary {
  id: number
  name: string
  price: string
  unit: string
  quantity: string
  imagePath: string | null
  status: string
  category: { id: number; name: string; slug: string } | null
}

export default class FarmTransformer extends BaseTransformer<Farm> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      description: this.resource.description ?? null,
      coverImagePath: this.resource.coverImagePath ?? null,
      location: this.resource.location ?? null,
      activities: this.resource.activities ?? [],
      instagram: this.resource.instagram ?? null,
      photos: (this.resource.photos ?? []).map((p) => ({
        id: p.id,
        imagePath: p.imagePath,
        position: p.position,
      })),
      products: (this.resource.$extras?.products ?? []) as ProductSummary[],
      farmer: this.resource.user
        ? { id: this.resource.user.id, fullName: this.resource.user.fullName }
        : null,
      reviewCount: (this.resource.$extras?.reviewCount ?? 0) as number,
      avgRating: (this.resource.$extras?.avgRating ?? null) as number | null,
    }
  }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
cd apps/api && node ace test --files="tests/functional/farms.spec.ts"
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/controllers/catalog/farms_controller.ts \
        apps/api/app/transformers/farm_transformer.ts \
        apps/api/tests/functional/farms.spec.ts
git commit -m "feat: add reviewCount and avgRating to farm detail endpoint"
```

---

## Task 4: GET + POST /api/v1/farms/:id/reviews

**Files:**
- Create: `apps/api/app/validators/farm_review.ts`
- Create: `apps/api/app/controllers/catalog/farm_reviews_controller.ts`
- Modify: `apps/api/start/routes.ts`
- Create: `apps/api/tests/functional/farm_reviews.spec.ts`

- [ ] **Step 1: Create validator**

```typescript
// apps/api/app/validators/farm_review.ts
import { z } from 'zod'

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(2000),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
```

- [ ] **Step 2: Create the test file**

```typescript
// apps/api/tests/functional/farm_reviews.spec.ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Farm from '#models/farm'

async function createSellerWithFarm() {
  const seller = await User.create({
    fullName: 'Іван Петренко',
    email: `seller_${Date.now()}@test.com`,
    password: 'secret123',
    isSeller: true,
  })
  const farm = await Farm.create({ userId: seller.id, name: 'Ферма Петренка', activities: [] })
  return { seller, farm }
}

async function createBuyer() {
  return User.create({
    fullName: 'Олена Покупець',
    email: `buyer_${Date.now()}@test.com`,
    password: 'secret123',
    isSeller: false,
  })
}

test.group('GET /api/v1/farms/:id/reviews', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns reviews with user info', async ({ client, assert }) => {
    const { farm } = await createSellerWithFarm()
    const buyer = await createBuyer()
    await db.table('farm_reviews').insert({
      farm_id: farm.id,
      user_id: buyer.id,
      rating: 5,
      text: 'Чудово!',
      created_at: new Date(),
    })

    const response = await client.get(`/api/v1/farms/${farm.id}/reviews`)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].rating, 5)
    assert.equal(response.body().data[0].text, 'Чудово!')
    assert.equal(response.body().data[0].user.fullName, 'Олена Покупець')
    assert.exists(response.body().meta)
  })

  test('returns empty list when no reviews', async ({ client, assert }) => {
    const { farm } = await createSellerWithFarm()
    const response = await client.get(`/api/v1/farms/${farm.id}/reviews`)
    response.assertStatus(200)
    assert.lengthOf(response.body().data, 0)
  })

  test('returns 404 for unknown farm', async ({ client }) => {
    const response = await client.get('/api/v1/farms/999999/reviews')
    response.assertStatus(404)
  })
})

test.group('POST /api/v1/farms/:id/reviews', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('creates review for authenticated user', async ({ client, assert }) => {
    const { farm } = await createSellerWithFarm()
    const buyer = await createBuyer()

    const response = await client
      .post(`/api/v1/farms/${farm.id}/reviews`)
      .json({ rating: 4, text: 'Гарна ферма!' })
      .loginAs(buyer)

    response.assertStatus(201)
    assert.equal(response.body().rating, 4)
    assert.equal(response.body().text, 'Гарна ферма!')
    assert.equal(response.body().user.fullName, 'Олена Покупець')
  })

  test('rejects unauthenticated request', async ({ client }) => {
    const { farm } = await createSellerWithFarm()
    const response = await client
      .post(`/api/v1/farms/${farm.id}/reviews`)
      .json({ rating: 4, text: 'Відгук' })
    response.assertStatus(401)
  })

  test('rejects rating above 5', async ({ client }) => {
    const { farm } = await createSellerWithFarm()
    const buyer = await createBuyer()
    const response = await client
      .post(`/api/v1/farms/${farm.id}/reviews`)
      .json({ rating: 6, text: 'Відгук' })
      .loginAs(buyer)
    response.assertStatus(422)
  })

  test('rejects empty text', async ({ client }) => {
    const { farm } = await createSellerWithFarm()
    const buyer = await createBuyer()
    const response = await client
      .post(`/api/v1/farms/${farm.id}/reviews`)
      .json({ rating: 3, text: '' })
      .loginAs(buyer)
    response.assertStatus(422)
  })

  test('returns 404 for unknown farm', async ({ client }) => {
    const buyer = await createBuyer()
    const response = await client
      .post('/api/v1/farms/999999/reviews')
      .json({ rating: 4, text: 'Відгук' })
      .loginAs(buyer)
    response.assertStatus(404)
  })
})
```

- [ ] **Step 3: Run — expect FAIL**

```bash
cd apps/api && node ace test --files="tests/functional/farm_reviews.spec.ts"
```

Expected: FAIL — routes not registered yet.

- [ ] **Step 4: Create the controller**

```typescript
// apps/api/app/controllers/catalog/farm_reviews_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import FarmReview from '#models/farm_review'
import Farm from '#models/farm'
import { zodValidate } from '#lib/zod_validate'
import { createReviewSchema } from '#validators/farm_review'

export default class FarmReviewsController {
  async index({ params, request, response }: HttpContext) {
    const farmId = Number(params.id)
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return response.notFound({ message: 'Farm not found' })
    }

    const farm = await Farm.query().where('id', farmId).first()
    if (!farm) return response.notFound({ message: 'Farm not found' })

    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const reviews = await FarmReview.query()
      .where('farm_id', farmId)
      .preload('user')
      .orderBy('created_at', 'desc')
      .paginate(page, 20)

    const data = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
      user: { id: r.user.id, fullName: r.user.fullName },
    }))

    return response.json({ data, meta: reviews.getMeta() })
  }

  async store({ params, request, auth, response }: HttpContext) {
    const farmId = Number(params.id)
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return response.notFound({ message: 'Farm not found' })
    }

    const farm = await Farm.query().where('id', farmId).first()
    if (!farm) return response.notFound({ message: 'Farm not found' })

    const user = auth.getUserOrFail()
    const body = zodValidate(createReviewSchema, request.body())

    const review = await FarmReview.create({
      farmId,
      userId: user.id,
      rating: body.rating,
      text: body.text,
    })
    await review.load('user')

    response.status(201)
    return response.json({
      id: review.id,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      user: { id: review.user.id, fullName: review.user.fullName },
    })
  }
}
```

- [ ] **Step 5: Register routes and trigger codegen**

In `apps/api/start/routes.ts`, replace the farms group with:

```typescript
router
  .group(() => {
    router.get('/', [controllers.catalog.Farms, 'index'])
    router.get('/:id', [controllers.catalog.Farms, 'show'])
    router.get('/:id/reviews', [controllers.catalog.FarmReviews, 'index'])
    router
      .post('/:id/reviews', [controllers.catalog.FarmReviews, 'store'])
      .use(middleware.auth())
  })
  .prefix('farms')
```

Run tests once to regenerate `.adonisjs/server/controllers.ts` (which auto-adds `FarmReviews`):

```bash
cd apps/api && node ace test --files="tests/functional/farm_reviews.spec.ts"
```

If it errors with "FarmReviews not found on controllers.catalog", the codegen hasn't run yet. Run:

```bash
node ace generate:manifest
```

- [ ] **Step 6: Run — expect PASS**

```bash
cd apps/api && node ace test
```

Expected: all 50+ tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/app/validators/farm_review.ts \
        apps/api/app/controllers/catalog/farm_reviews_controller.ts \
        apps/api/start/routes.ts \
        apps/api/tests/functional/farm_reviews.spec.ts \
        apps/api/.adonisjs/server/controllers.ts
git commit -m "feat: add farm reviews endpoints (GET + POST /api/v1/farms/:id/reviews)"
```

---

## Task 5: Frontend — farms list page + nav link

**Files:**
- Create: `apps/web/src/routes/farms/api.ts`
- Create: `apps/web/src/routes/farms/use-farms.ts`
- Create: `apps/web/src/routes/farms/-farm-card.tsx`
- Create: `apps/web/src/routes/farms/-farms-page.tsx`
- Create: `apps/web/src/routes/farms/index.tsx`
- Modify: `apps/web/src/shared/layout/app-layout.tsx`

- [ ] **Step 1: Create api.ts**

```typescript
// apps/web/src/routes/farms/api.ts
import { apiFetch } from '@/lib/api/fetch-client'

export interface FarmSummary {
  id: number
  name: string
  location: string | null
  coverImagePath: string | null
  activities: string[]
  reviewCount: number
  avgRating: number | null
}

export interface FarmsMeta {
  currentPage: number
  lastPage: number
  total: number
}

export const farmsListApi = {
  getFarms: (page = 1) =>
    apiFetch<{ data: FarmSummary[]; meta: FarmsMeta }>(`/api/v1/farms?page=${page}`),
}
```

- [ ] **Step 2: Create use-farms.ts**

```typescript
// apps/web/src/routes/farms/use-farms.ts
import { useQuery } from '@tanstack/react-query'
import { farmsListApi } from './api'

export function useFarms(page = 1) {
  return useQuery({
    queryKey: ['farms', page],
    queryFn: () => farmsListApi.getFarms(page),
  })
}
```

- [ ] **Step 3: Create -farm-card.tsx**

```typescript
// apps/web/src/routes/farms/-farm-card.tsx
import { Link } from '@tanstack/react-router'
import type { FarmSummary } from './api'

export function FarmCard({ farm }: { farm: FarmSummary }) {
  return (
    <Link
      to="/farms/$id"
      params={{ id: String(farm.id) }}
      className="block rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="h-36 bg-gradient-to-br from-green-700 to-green-900 relative">
        {farm.coverImagePath && (
          <img src={farm.coverImagePath} alt={farm.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <div className="font-bold text-gray-900 text-sm truncate">{farm.name}</div>
        {farm.location && (
          <div className="text-gray-500 text-xs mt-0.5 truncate">📍 {farm.location}</div>
        )}
        {farm.activities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {farm.activities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="bg-green-50 text-green-800 border border-green-200 rounded-full px-2 py-0.5 text-xs"
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Create -farms-page.tsx**

```typescript
// apps/web/src/routes/farms/-farms-page.tsx
import { useFarms } from './use-farms'
import { FarmCard } from './-farm-card'

export function FarmsPage() {
  const { data, isLoading } = useFarms()

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ферми</h1>
      {!data?.data.length ? (
        <p className="text-sm text-gray-500">Ферм поки немає</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.data.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create index.tsx (route)**

```typescript
// apps/web/src/routes/farms/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/shared/layout/app-layout'
import { FarmsPage } from './-farms-page'

export const Route = createFileRoute('/farms/')({
  component: () => (
    <AppLayout>
      <FarmsPage />
    </AppLayout>
  ),
})
```

- [ ] **Step 6: Add "Ферми" link to app-layout.tsx**

In `app-layout.tsx`, find the existing nav links block and add "Ферми" as the first link (visible to all users, no condition):

```tsx
<Link
  to="/farms"
  className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
>
  Ферми
</Link>
```

Place it before the `{user?.isSeller && ...}` seller links.

- [ ] **Step 7: Verify in browser**

The Vite dev server auto-regenerates `routeTree.gen.ts` when `index.tsx` is created. Open `http://localhost:5173/farms` — should show a grid of farm cards (or "Ферм поки немає" if no farms in DB). Clicking a card navigates to `/farms/:id`.

If no farms show, seed the database:
```bash
cd apps/api && node ace db:seed
```

Then create a farm via `/seller/farm` logged in as a seller.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/routes/farms/api.ts \
        apps/web/src/routes/farms/use-farms.ts \
        apps/web/src/routes/farms/-farm-card.tsx \
        apps/web/src/routes/farms/-farms-page.tsx \
        apps/web/src/routes/farms/index.tsx \
        apps/web/src/shared/layout/app-layout.tsx \
        apps/web/src/routeTree.gen.ts
git commit -m "feat: add farms list page and nav link"
```

---

## Task 6: Frontend — reviews section on farm detail page

**Files:**
- Modify: `apps/web/src/routes/farms/$id/api.ts`
- Create: `apps/web/src/routes/farms/$id/-reviews.tsx`
- Modify: `apps/web/src/routes/farms/$id/-farm-page.tsx`

- [ ] **Step 1: Update farms/$id/api.ts**

Replace the file:

```typescript
// apps/web/src/routes/farms/$id/api.ts
import { apiFetch } from '@/lib/api/fetch-client'
import type { Product } from '../../catalog/types'

export interface FarmPhoto {
  id: number
  imagePath: string
  position: number
}

export interface Review {
  id: number
  rating: number
  text: string
  createdAt: string
  user: { id: number; fullName: string | null }
}

export interface Farm {
  id: number
  name: string
  description: string | null
  coverImagePath: string | null
  location: string | null
  activities: string[]
  instagram: string | null
  photos: FarmPhoto[]
  products: Product[]
  farmer: { id: number; fullName: string | null } | null
  avgRating: number | null
  reviewCount: number
}

export const farmsApi = {
  getFarm: (id: number) => apiFetch<Farm>(`/api/v1/farms/${id}`),
}

export const reviewsApi = {
  getReviews: (farmId: number, page = 1) =>
    apiFetch<{ data: Review[]; meta: { currentPage: number; lastPage: number; total: number } }>(
      `/api/v1/farms/${farmId}/reviews?page=${page}`
    ),
  createReview: (farmId: number, data: { rating: number; text: string }) =>
    apiFetch<Review>(`/api/v1/farms/${farmId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
```

- [ ] **Step 2: Create -reviews.tsx**

`avgRating` and `reviewCount` come from the farm object (server-computed) so the header is always accurate — not re-computed from the loaded page of reviews.

```typescript
// apps/web/src/routes/farms/$id/-reviews.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { reviewsApi } from './api'
import { useCurrentUser } from '@/shared/auth/use-current-user'

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl leading-none ${n <= value ? 'text-amber-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function FarmReviews({
  farmId,
  reviewCount,
  avgRating,
}: {
  farmId: number
  reviewCount: number
  avgRating: number | null
}) {
  const { data: user } = useCurrentUser()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const qc = useQueryClient()

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['farm-reviews', farmId],
    queryFn: () => reviewsApi.getReviews(farmId),
  })

  const addReview = useMutation({
    mutationFn: () => reviewsApi.createReview(farmId, { rating, text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farm-reviews', farmId] })
      qc.invalidateQueries({ queryKey: ['farm', farmId] })
      setRating(0)
      setText('')
    },
  })

  const reviews = reviewsData?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Відгуки ({reviews.length})</h2>
        {avgRating && (
          <div className="flex items-center gap-1">
            <span className="text-amber-400 text-sm">★</span>
            <span className="font-bold text-gray-900 text-sm">{avgRating}</span>
          </div>
        )}
      </div>

      {user ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-green-800">Ваш відгук</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Напишіть відгук..."
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => addReview.mutate()}
              disabled={rating === 0 || !text.trim() || addReview.isPending}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-green-800"
            >
              {addReview.isPending ? 'Надсилання...' : 'Надіслати'}
            </button>
            {addReview.isError && (
              <p className="text-xs text-red-600">{addReview.error.message}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          <Link to="/login" className="text-green-700 hover:underline">
            Увійдіть
          </Link>
          , щоб залишити відгук
        </p>
      )}

      {isLoading && <p className="text-sm text-gray-500">Завантаження відгуків...</p>}

      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-gray-900">
                {review.user.fullName ?? 'Користувач'}
              </span>
              <span className="text-amber-400 text-sm">
                {'★'.repeat(review.rating)}
                <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{review.text}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(review.createdAt).toLocaleDateString('uk-UA')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add FarmReviews to -farm-page.tsx**

In `-farm-page.tsx`, add the import at the top:

```typescript
import { FarmReviews } from './-reviews'
```

And at the very bottom of the returned JSX, after the products section, add:

```tsx
      {/* Reviews */}
      <FarmReviews
        farmId={farm.id}
        reviewCount={farm.reviewCount}
        avgRating={farm.avgRating}
      />
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:5173/farms/:id` for an existing farm. You should see:
1. "Відгуки (0)" header
2. If logged in: the form with star picker + textarea + submit button
3. If not logged in: "Увійдіть, щоб залишити відгук" link
4. Submit a review — it should appear in the list immediately

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/farms/\$id/api.ts \
        apps/web/src/routes/farms/\$id/-reviews.tsx \
        apps/web/src/routes/farms/\$id/-farm-page.tsx
git commit -m "feat: add reviews section to farm detail page"
```
