# Product Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the product catalog MVP — sellers manage products with photo upload, buyers browse a public catalog with category sidebar and search.

**Architecture:** Backend-first: migrations → models/transformers → middleware → controllers → routes. Then frontend: auth changes, AppLayout, catalog pages, seller dashboard, TanStack Router route files.

**Tech Stack:** AdonisJS v6 (Lucid ORM, Vine validators, Japa functional tests), React 19 + TanStack Router v1 + TanStack Query v5, Tailwind CSS v4, Vitest

---

## File Map

**New API files:**
- `apps/api/database/migrations/*_add_seller_fields_to_users.ts`
- `apps/api/database/migrations/*_create_categories_table.ts`
- `apps/api/database/migrations/*_create_products_table.ts`
- `apps/api/database/seeders/category_seeder.ts`
- `apps/api/app/models/category.ts`
- `apps/api/app/models/product.ts`
- `apps/api/app/transformers/category_transformer.ts`
- `apps/api/app/transformers/product_transformer.ts`
- `apps/api/app/validators/product.ts`
- `apps/api/app/middleware/seller_middleware.ts`
- `apps/api/app/controllers/categories_controller.ts`
- `apps/api/app/controllers/products_controller.ts`
- `apps/api/app/controllers/seller/seller_products_controller.ts`
- `apps/api/tests/functional/categories.spec.ts`
- `apps/api/tests/functional/products.spec.ts`
- `apps/api/tests/functional/seller_products.spec.ts`

**Modified API files:**
- `apps/api/app/models/user.ts` — no change (schema.ts auto-regenerates after migration)
- `apps/api/app/transformers/user_transformer.ts` — add isSeller, farmName
- `apps/api/app/validators/user.ts` — add is_seller, farm_name to signupValidator
- `apps/api/app/controllers/new_account_controller.ts` — pass new fields to User.create
- `apps/api/start/routes.ts` — add all new routes
- `apps/api/start/kernel.ts` — register seller named middleware
- `apps/api/lib/api/fetch-client.ts` — skip Content-Type for FormData

**New web files:**
- `apps/web/src/features/layout/app-layout.tsx`
- `apps/web/src/features/catalog/types.ts`
- `apps/web/src/features/catalog/api.ts`
- `apps/web/src/features/catalog/__tests__/api.test.ts`
- `apps/web/src/features/catalog/use-categories.ts`
- `apps/web/src/features/catalog/use-products.ts`
- `apps/web/src/features/catalog/use-product.ts`
- `apps/web/src/features/catalog/product-card.tsx`
- `apps/web/src/features/catalog/catalog-page.tsx`
- `apps/web/src/features/catalog/product-page.tsx`
- `apps/web/src/features/seller/api.ts`
- `apps/web/src/features/seller/__tests__/api.test.ts`
- `apps/web/src/features/seller/use-seller-products.ts`
- `apps/web/src/features/seller/use-create-product.ts`
- `apps/web/src/features/seller/use-update-product.ts`
- `apps/web/src/features/seller/use-delete-product.ts`
- `apps/web/src/features/seller/use-upload-image.ts`
- `apps/web/src/features/seller/product-form.tsx`
- `apps/web/src/features/seller/seller-products-page.tsx`
- `apps/web/src/features/seller/new-product-page.tsx`
- `apps/web/src/features/seller/edit-product-page.tsx`
- `apps/web/src/routes/catalog.tsx`
- `apps/web/src/routes/products/$id.tsx`
- `apps/web/src/routes/seller/route.tsx`
- `apps/web/src/routes/seller/products/index.tsx`
- `apps/web/src/routes/seller/products/new.tsx`
- `apps/web/src/routes/seller/products/$id.edit.tsx`

**Modified web files:**
- `apps/web/src/features/auth/types.ts` — add isSeller, farmName to User
- `apps/web/src/features/auth/api.ts` — add isSeller, farmName to SignupInput
- `apps/web/src/features/auth/use-signup.ts` — pass new fields
- `apps/web/src/features/auth/signup-page.tsx` — add seller checkbox + farmName input
- `apps/web/src/lib/api/fetch-client.ts` — skip Content-Type for FormData

---

## Task 1: Migration — seller fields on users

**Files:**
- Create: `apps/api/database/migrations/*_add_seller_fields_to_users.ts` (use `node ace make:migration`)

- [ ] **Step 1: Generate migration file**

```bash
cd apps/api && node ace make:migration add_seller_fields_to_users
```

Expected: new file in `database/migrations/` with timestamp prefix.

- [ ] **Step 2: Fill in migration content**

Replace the generated file content:

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_seller').notNullable().defaultTo(false)
      table.string('farm_name').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_seller')
      table.dropColumn('farm_name')
    })
  }
}
```

- [ ] **Step 3: Run migration**

```bash
cd apps/api && node ace migration:run
```

Expected output: `Migrated: database/migrations/..._add_seller_fields_to_users`

`schema.ts` is automatically regenerated — `UserSchema` will now include `isSeller: boolean` and `farmName: string | null`.

- [ ] **Step 4: Commit**

```bash
git add apps/api/database/migrations apps/api/database/schema.ts
git commit -m "feat(api): add is_seller and farm_name columns to users"
```

---

## Task 2: Migration — categories table

**Files:**
- Create: `apps/api/database/migrations/*_create_categories_table.ts`

- [ ] **Step 1: Generate migration file**

```bash
cd apps/api && node ace make:migration create_categories_table
```

- [ ] **Step 2: Fill in migration content**

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 255).notNullable()
      table.string('slug', 255).notNullable().unique()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

- [ ] **Step 3: Run migration**

```bash
cd apps/api && node ace migration:run
```

Expected: `Migrated: database/migrations/..._create_categories_table`

- [ ] **Step 4: Commit**

```bash
git add apps/api/database/migrations apps/api/database/schema.ts
git commit -m "feat(api): add categories table migration"
```

---

## Task 3: Seeder — seed 8 categories

**Files:**
- Create: `apps/api/database/seeders/category_seeder.ts`

- [ ] **Step 1: Generate seeder**

```bash
cd apps/api && node ace make:seeder Category
```

- [ ] **Step 2: Fill in seeder content**

```ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    await db.table('categories').multiInsert([
      { name: 'Овочі', slug: 'vegetables', created_at: new Date(), updated_at: new Date() },
      { name: 'Фрукти', slug: 'fruits', created_at: new Date(), updated_at: new Date() },
      { name: "М'ясо", slug: 'meat', created_at: new Date(), updated_at: new Date() },
      { name: 'Молочні та яйця', slug: 'dairy', created_at: new Date(), updated_at: new Date() },
      { name: 'Зернові', slug: 'grains', created_at: new Date(), updated_at: new Date() },
      { name: 'Мед та варення', slug: 'honey', created_at: new Date(), updated_at: new Date() },
      { name: 'Зелень та трави', slug: 'herbs', created_at: new Date(), updated_at: new Date() },
      { name: 'Екзотика', slug: 'exotic', created_at: new Date(), updated_at: new Date() },
    ])
  }
}
```

- [ ] **Step 3: Run seeder**

```bash
cd apps/api && node ace db:seed --files database/seeders/category_seeder.ts
```

Expected: 8 rows inserted into categories.

- [ ] **Step 4: Commit**

```bash
git add apps/api/database/seeders
git commit -m "feat(api): add category seeder with 8 initial categories"
```

---

## Task 4: Migration — products table

**Files:**
- Create: `apps/api/database/migrations/*_create_products_table.ts`

- [ ] **Step 1: Generate migration**

```bash
cd apps/api && node ace make:migration create_products_table
```

- [ ] **Step 2: Fill in migration content**

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('seller_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('category_id').unsigned().notNullable().references('id').inTable('categories').onDelete('RESTRICT')
      table.string('name', 255).notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('unit', 50).notNullable()
      table.decimal('quantity', 10, 3).notNullable().defaultTo(0)
      table.string('image_path', 255).nullable()
      table.enu('status', ['active', 'inactive', 'archived']).notNullable().defaultTo('active')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

- [ ] **Step 3: Run migration**

```bash
cd apps/api && node ace migration:run
```

Expected: `Migrated: database/migrations/..._create_products_table`

- [ ] **Step 4: Commit**

```bash
git add apps/api/database/migrations apps/api/database/schema.ts
git commit -m "feat(api): add products table migration"
```

---

## Task 5: Auth backend — UserTransformer + validator + controller

**Files:**
- Modify: `apps/api/app/transformers/user_transformer.ts`
- Modify: `apps/api/app/validators/user.ts`
- Modify: `apps/api/app/controllers/new_account_controller.ts`

- [ ] **Step 1: Update UserTransformer**

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
      'createdAt',
      'updatedAt',
      'initials',
    ])
  }
}
```

- [ ] **Step 2: Update signup validator**

```ts
import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const signupValidator = vine.create({
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
  isSeller: vine.boolean().optional(),
  farmName: vine.string().maxLength(255).nullable().optional(),
})

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
```

- [ ] **Step 3: Update NewAccountController**

```ts
import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const { fullName, email, password, isSeller, farmName } = await request.validateUsing(signupValidator)

    const user = await User.create({
      fullName,
      email,
      password,
      isSeller: isSeller ?? false,
      farmName: farmName ?? null,
    })
    const token = await User.accessTokens.create(user)

    return serialize.withoutWrapping({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
```

- [ ] **Step 4: Verify typecheck passes**

```bash
cd apps/api && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/transformers/user_transformer.ts apps/api/app/validators/user.ts apps/api/app/controllers/new_account_controller.ts
git commit -m "feat(api): add isSeller and farmName to user signup and transformer"
```

---

## Task 6: Category model + transformer + controller + tests

**Files:**
- Create: `apps/api/app/models/category.ts`
- Create: `apps/api/app/transformers/category_transformer.ts`
- Create: `apps/api/app/controllers/categories_controller.ts`
- Create: `apps/api/tests/functional/categories.spec.ts`
- Modify: `apps/api/start/routes.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/functional/categories.spec.ts`:

```ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

test.group('GET /api/v1/categories', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns all categories with id, name, slug', async ({ client }) => {
    await db.table('categories').multiInsert([
      { name: 'Овочі', slug: 'vegetables', created_at: new Date(), updated_at: new Date() },
      { name: 'Фрукти', slug: 'fruits', created_at: new Date(), updated_at: new Date() },
    ])

    const response = await client.get('/api/v1/categories')

    response.assertStatus(200)
    response.assertBodyContains({
      data: [
        { name: 'Овочі', slug: 'vegetables' },
        { name: 'Фрукти', slug: 'fruits' },
      ],
    })
  })

  test('returns empty array when no categories', async ({ client }) => {
    const response = await client.get('/api/v1/categories')
    response.assertStatus(200)
    response.assertBodyContains({ data: [] })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/api && node ace test functional --files tests/functional/categories.spec.ts
```

Expected: FAIL — route not found (404).

- [ ] **Step 3: Create Category model**

Create `apps/api/app/models/category.ts`:

```ts
import { CategorySchema } from '#database/schema'

export default class Category extends CategorySchema {}
```

- [ ] **Step 4: Create CategoryTransformer**

Create `apps/api/app/transformers/category_transformer.ts`:

```ts
import type Category from '#models/category'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CategoryTransformer extends BaseTransformer<Category> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'slug'])
  }
}
```

- [ ] **Step 5: Create CategoriesController**

Create `apps/api/app/controllers/categories_controller.ts`:

```ts
import Category from '#models/category'
import CategoryTransformer from '#transformers/category_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class CategoriesController {
  async index({ serialize }: HttpContext) {
    const categories = await Category.all()
    return serialize(CategoryTransformer.transformMany(categories))
  }
}
```

- [ ] **Step 6: Register route**

In `apps/api/start/routes.ts`, add inside the `/api/v1` group:

```ts
router.get('categories', [controllers.Categories, 'index'])
```

Full updated routes file:

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router.get('categories', [controllers.Categories, 'index'])

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
  })
  .prefix('/api/v1')
```

- [ ] **Step 7: Run test to verify it passes**

```bash
cd apps/api && node ace test functional --files tests/functional/categories.spec.ts
```

Expected: PASS — 2 tests.

- [ ] **Step 8: Commit**

```bash
git add apps/api/app/models/category.ts apps/api/app/transformers/category_transformer.ts apps/api/app/controllers/categories_controller.ts apps/api/tests/functional/categories.spec.ts apps/api/start/routes.ts
git commit -m "feat(api): add categories endpoint GET /api/v1/categories"
```

---

## Task 7: Product model + ProductTransformer

**Files:**
- Create: `apps/api/app/models/product.ts`
- Create: `apps/api/app/transformers/product_transformer.ts`

- [ ] **Step 1: Create Product model**

Create `apps/api/app/models/product.ts`:

```ts
import { ProductSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Category from '#models/category'

export default class Product extends ProductSchema {
  declare status: 'active' | 'inactive' | 'archived'

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => User, { foreignKey: 'sellerId' })
  declare seller: BelongsTo<typeof User>
}
```

- [ ] **Step 2: Create ProductTransformer**

Create `apps/api/app/transformers/product_transformer.ts`:

```ts
import type Product from '#models/product'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ProductTransformer extends BaseTransformer<Product> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'price', 'unit', 'quantity', 'imagePath', 'status']),
      category: this.resource.category
        ? { id: this.resource.category.id, name: this.resource.category.name, slug: this.resource.category.slug }
        : null,
      seller: this.resource.seller
        ? { id: this.resource.seller.id, fullName: this.resource.seller.fullName, farmName: this.resource.seller.farmName }
        : null,
    }
  }
}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd apps/api && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/models/product.ts apps/api/app/transformers/product_transformer.ts
git commit -m "feat(api): add Product model and ProductTransformer"
```

---

## Task 8: SellerMiddleware

**Files:**
- Create: `apps/api/app/middleware/seller_middleware.ts`
- Modify: `apps/api/start/kernel.ts`

- [ ] **Step 1: Create SellerMiddleware**

Create `apps/api/app/middleware/seller_middleware.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SellerMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()
    if (!user.isSeller) {
      return response.forbidden({ message: 'Seller access required' })
    }
    return next()
  }
}
```

- [ ] **Step 2: Register in kernel**

Update `apps/api/start/kernel.ts` — add `seller` to named middleware:

```ts
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  seller: () => import('#middleware/seller_middleware'),
})
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/middleware/seller_middleware.ts apps/api/start/kernel.ts
git commit -m "feat(api): add seller middleware and register in kernel"
```

---

## Task 9: Product validator

**Files:**
- Create: `apps/api/app/validators/product.ts`

- [ ] **Step 1: Create product validator**

Create `apps/api/app/validators/product.ts`:

```ts
import vine from '@vinejs/vine'

export const createProductValidator = vine.create({
  name: vine.string().maxLength(255),
  categoryId: vine.number().positive(),
  description: vine.string().nullable().optional(),
  price: vine.number().positive(),
  unit: vine.string().maxLength(50),
  quantity: vine.number().min(0),
  status: vine.enum(['active', 'inactive', 'archived'] as const).optional(),
})

export const updateProductValidator = vine.create({
  name: vine.string().maxLength(255).optional(),
  categoryId: vine.number().positive().optional(),
  description: vine.string().nullable().optional(),
  price: vine.number().positive().optional(),
  unit: vine.string().maxLength(50).optional(),
  quantity: vine.number().min(0).optional(),
  status: vine.enum(['active', 'inactive', 'archived'] as const).optional(),
})
```

- [ ] **Step 2: Verify typecheck**

```bash
cd apps/api && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/validators/product.ts
git commit -m "feat(api): add product validators for create and update"
```

---

## Task 10: Public products controller + routes + tests

**Files:**
- Create: `apps/api/app/controllers/products_controller.ts`
- Create: `apps/api/tests/functional/products.spec.ts`
- Modify: `apps/api/start/routes.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/tests/functional/products.spec.ts`:

```ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'

test.group('GET /api/v1/products', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns active products with category and seller', async ({ client }) => {
    const seller = await User.create({
      fullName: 'Іван Петренко',
      email: 'ivan@test.com',
      password: 'secret123',
      isSeller: true,
      farmName: 'Ферма Петренків',
    })
    const category = await Category.create({
      name: 'Овочі',
      slug: 'vegetables',
    })
    await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Томати',
      price: 45,
      unit: 'кг',
      quantity: 50,
      status: 'active',
    })

    const response = await client.get('/api/v1/products')

    response.assertStatus(200)
    response.assertBodyContains({
      data: [
        {
          name: 'Томати',
          category: { slug: 'vegetables' },
          seller: { farmName: 'Ферма Петренків' },
        },
      ],
    })
  })

  test('does not return inactive or archived products', async ({ client }) => {
    const seller = await User.create({
      fullName: 'Іван',
      email: 'ivan2@test.com',
      password: 'secret123',
      isSeller: true,
    })
    const category = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    await Product.createMany([
      { sellerId: seller.id, categoryId: category.id, name: 'A', price: 10, unit: 'кг', quantity: 1, status: 'inactive' },
      { sellerId: seller.id, categoryId: category.id, name: 'B', price: 10, unit: 'кг', quantity: 1, status: 'archived' },
    ])

    const response = await client.get('/api/v1/products')
    response.assertStatus(200)
    response.assertBodyContains({ data: [] })
  })

  test('filters by category slug', async ({ client }) => {
    const seller = await User.create({ fullName: 'X', email: 'x@test.com', password: 'secret123', isSeller: true })
    const cat1 = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    const cat2 = await Category.create({ name: 'Фрукти', slug: 'fruits' })
    await Product.create({ sellerId: seller.id, categoryId: cat1.id, name: 'Томат', price: 10, unit: 'кг', quantity: 1, status: 'active' })
    await Product.create({ sellerId: seller.id, categoryId: cat2.id, name: 'Яблуко', price: 20, unit: 'кг', quantity: 1, status: 'active' })

    const response = await client.get('/api/v1/products?category=vegetables')
    response.assertStatus(200)
    const body = response.body() as { data: { name: string }[] }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0].name, 'Томат')
  })

  test('filters by name search', async ({ client }) => {
    const seller = await User.create({ fullName: 'X', email: 'x2@test.com', password: 'secret123', isSeller: true })
    const cat = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    await Product.create({ sellerId: seller.id, categoryId: cat.id, name: 'Томати черрі', price: 10, unit: 'кг', quantity: 1, status: 'active' })
    await Product.create({ sellerId: seller.id, categoryId: cat.id, name: 'Огірки', price: 10, unit: 'кг', quantity: 1, status: 'active' })

    const response = await client.get('/api/v1/products?search=Томати')
    response.assertStatus(200)
    const body = response.body() as { data: { name: string }[] }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0].name, 'Томати черрі')
  })
})

test.group('GET /api/v1/products/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns single product', async ({ client }) => {
    const seller = await User.create({ fullName: 'Іван', email: 'ivan3@test.com', password: 'secret123', isSeller: true })
    const category = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    const product = await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Томати',
      price: 45,
      unit: 'кг',
      quantity: 50,
      status: 'active',
    })

    const response = await client.get(`/api/v1/products/${product.id}`)
    response.assertStatus(200)
    response.assertBodyContains({ name: 'Томати', category: { slug: 'vegetables' } })
  })

  test('returns 404 for non-existent product', async ({ client }) => {
    const response = await client.get('/api/v1/products/9999')
    response.assertStatus(404)
  })
})
```

- [ ] **Step 2: Add assert import to test file**

At the top of the test file, add the assert import from the Japa context. Update the filter tests to use the `assert` from the test context destructure:

```ts
test('filters by category slug', async ({ client, assert }) => {
  // ...
  assert.lengthOf(body.data, 1)
  assert.equal(body.data[0].name, 'Томат')
})

test('filters by name search', async ({ client, assert }) => {
  // ...
  assert.lengthOf(body.data, 1)
  assert.equal(body.data[0].name, 'Томати черрі')
})
```

Remove the standalone `assert` calls and add `assert` to the destructure pattern. The full corrected filter tests:

```ts
  test('filters by category slug', async ({ client, assert }) => {
    const seller = await User.create({ fullName: 'X', email: 'x@test.com', password: 'secret123', isSeller: true })
    const cat1 = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    const cat2 = await Category.create({ name: 'Фрукти', slug: 'fruits' })
    await Product.create({ sellerId: seller.id, categoryId: cat1.id, name: 'Томат', price: 10, unit: 'кг', quantity: 1, status: 'active' })
    await Product.create({ sellerId: seller.id, categoryId: cat2.id, name: 'Яблуко', price: 20, unit: 'кг', quantity: 1, status: 'active' })

    const response = await client.get('/api/v1/products?category=vegetables')
    response.assertStatus(200)
    const body = response.body() as { data: { name: string }[] }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0].name, 'Томат')
  })

  test('filters by name search', async ({ client, assert }) => {
    const seller = await User.create({ fullName: 'X', email: 'x2@test.com', password: 'secret123', isSeller: true })
    const cat = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    await Product.create({ sellerId: seller.id, categoryId: cat.id, name: 'Томати черрі', price: 10, unit: 'кг', quantity: 1, status: 'active' })
    await Product.create({ sellerId: seller.id, categoryId: cat.id, name: 'Огірки', price: 10, unit: 'кг', quantity: 1, status: 'active' })

    const response = await client.get('/api/v1/products?search=Томати')
    response.assertStatus(200)
    const body = response.body() as { data: { name: string }[] }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0].name, 'Томати черрі')
  })
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd apps/api && node ace test functional --files tests/functional/products.spec.ts
```

Expected: FAIL — 404 Not Found (routes not registered yet).

- [ ] **Step 4: Create ProductsController**

Create `apps/api/app/controllers/products_controller.ts`:

```ts
import Product from '#models/product'
import ProductTransformer from '#transformers/product_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductsController {
  async index({ request, serialize }: HttpContext) {
    const { category, search } = request.qs() as { category?: string; search?: string }

    const query = Product.query()
      .where('status', 'active')
      .preload('category')
      .preload('seller')
      .orderBy('created_at', 'desc')

    if (category) {
      query.whereHas('category', (q) => q.where('slug', category))
    }

    if (search) {
      query.whereILike('name', `%${search}%`)
    }

    const products = await query
    return serialize(ProductTransformer.transformMany(products))
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

- [ ] **Step 5: Register routes**

Update `apps/api/start/routes.ts` — add products routes inside the `/api/v1` group:

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
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
  })
  .prefix('/api/v1')
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd apps/api && node ace test functional --files tests/functional/products.spec.ts
```

Expected: PASS — all tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/app/controllers/products_controller.ts apps/api/tests/functional/products.spec.ts apps/api/start/routes.ts
git commit -m "feat(api): add public products endpoints GET /api/v1/products and /api/v1/products/:id"
```

---

## Task 11: Seller products controller + CRUD routes + tests

**Files:**
- Create: `apps/api/app/controllers/seller/seller_products_controller.ts`
- Create: `apps/api/tests/functional/seller_products.spec.ts`
- Modify: `apps/api/start/routes.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/tests/functional/seller_products.spec.ts`:

```ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'

async function createSellerAndCategory() {
  const seller = await User.create({
    fullName: 'Іван',
    email: `seller_${Date.now()}@test.com`,
    password: 'secret123',
    isSeller: true,
  })
  const category = await Category.create({ name: 'Овочі', slug: `vegetables_${Date.now()}` })
  return { seller, category }
}

test.group('Seller products — auth guard', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('rejects unauthenticated requests', async ({ client }) => {
    const response = await client.get('/api/v1/seller/products')
    response.assertStatus(401)
  })

  test('rejects non-seller users', async ({ client }) => {
    const buyer = await User.create({ fullName: 'Buyer', email: 'buyer@test.com', password: 'secret123', isSeller: false })
    const response = await client.get('/api/v1/seller/products').loginAs(buyer)
    response.assertStatus(403)
  })
})

test.group('GET /api/v1/seller/products', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns all own products including inactive', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    await Product.createMany([
      { sellerId: seller.id, categoryId: category.id, name: 'A', price: 10, unit: 'кг', quantity: 1, status: 'active' },
      { sellerId: seller.id, categoryId: category.id, name: 'B', price: 10, unit: 'кг', quantity: 1, status: 'inactive' },
    ])

    const response = await client.get('/api/v1/seller/products').loginAs(seller)
    response.assertStatus(200)
    const body = response.body() as { data: unknown[] }
    assert.lengthOf(body.data, 2)
  })

  test('does not return other sellers products', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    const otherSeller = await User.create({ fullName: 'Other', email: `other_${Date.now()}@test.com`, password: 'secret123', isSeller: true })
    await Product.create({ sellerId: otherSeller.id, categoryId: category.id, name: 'Other product', price: 10, unit: 'кг', quantity: 1, status: 'active' })

    const response = await client.get('/api/v1/seller/products').loginAs(seller)
    response.assertStatus(200)
    const body = response.body() as { data: unknown[] }
    assert.lengthOf(body.data, 0)
  })
})

test.group('POST /api/v1/seller/products', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('creates a product', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()

    const response = await client
      .post('/api/v1/seller/products')
      .json({ name: 'Томати', categoryId: category.id, price: 45, unit: 'кг', quantity: 50 })
      .loginAs(seller)

    response.assertStatus(201)
    const body = response.body() as { name: string; status: string }
    assert.equal(body.name, 'Томати')
    assert.equal(body.status, 'active')
  })

  test('returns 422 for missing required fields', async ({ client }) => {
    const { seller } = await createSellerAndCategory()
    const response = await client
      .post('/api/v1/seller/products')
      .json({ name: 'Томати' })
      .loginAs(seller)
    response.assertStatus(422)
  })
})

test.group('PUT /api/v1/seller/products/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('updates own product', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    const product = await Product.create({ sellerId: seller.id, categoryId: category.id, name: 'Old', price: 10, unit: 'кг', quantity: 1, status: 'active' })

    const response = await client
      .put(`/api/v1/seller/products/${product.id}`)
      .json({ name: 'New', status: 'inactive' })
      .loginAs(seller)

    response.assertStatus(200)
    const body = response.body() as { name: string; status: string }
    assert.equal(body.name, 'New')
    assert.equal(body.status, 'inactive')
  })

  test('cannot update another sellers product', async ({ client }) => {
    const { seller, category } = await createSellerAndCategory()
    const otherSeller = await User.create({ fullName: 'Other', email: `other2_${Date.now()}@test.com`, password: 'secret123', isSeller: true })
    const product = await Product.create({ sellerId: otherSeller.id, categoryId: category.id, name: 'X', price: 10, unit: 'кг', quantity: 1, status: 'active' })

    const response = await client
      .put(`/api/v1/seller/products/${product.id}`)
      .json({ name: 'Hack' })
      .loginAs(seller)

    response.assertStatus(404)
  })
})

test.group('DELETE /api/v1/seller/products/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('deletes own product', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    const product = await Product.create({ sellerId: seller.id, categoryId: category.id, name: 'X', price: 10, unit: 'кг', quantity: 1, status: 'active' })

    const response = await client.delete(`/api/v1/seller/products/${product.id}`).loginAs(seller)
    response.assertStatus(204)

    const count = await Product.query().where('id', product.id).count('* as total')
    assert.equal(count[0].$extras.total, '0')
  })

  test('cannot delete another sellers product', async ({ client }) => {
    const { seller, category } = await createSellerAndCategory()
    const otherSeller = await User.create({ fullName: 'Other', email: `other3_${Date.now()}@test.com`, password: 'secret123', isSeller: true })
    const product = await Product.create({ sellerId: otherSeller.id, categoryId: category.id, name: 'X', price: 10, unit: 'кг', quantity: 1, status: 'active' })

    const response = await client.delete(`/api/v1/seller/products/${product.id}`).loginAs(seller)
    response.assertStatus(404)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && node ace test functional --files tests/functional/seller_products.spec.ts
```

Expected: FAIL — routes not found.

- [ ] **Step 3: Create SellerProductsController**

Create `apps/api/app/controllers/seller/seller_products_controller.ts`:

```ts
import Product from '#models/product'
import ProductTransformer from '#transformers/product_transformer'
import { createProductValidator, updateProductValidator } from '#validators/product'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerProductsController {
  async index({ auth, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const products = await Product.query()
      .where('seller_id', seller.id)
      .preload('category')
      .preload('seller')
      .orderBy('created_at', 'desc')
    return serialize(ProductTransformer.transformMany(products))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const data = await request.validateUsing(createProductValidator)
    const product = await Product.create({ ...data, sellerId: seller.id, status: data.status ?? 'active' })
    await product.load('category')
    await product.load('seller')
    return response.created(serialize.withoutWrapping(ProductTransformer.transform(product)))
  }

  async update({ auth, params, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const product = await Product.query()
      .where('id', params.id)
      .where('seller_id', seller.id)
      .preload('category')
      .preload('seller')
      .first()

    if (!product) return response.notFound({ message: 'Product not found' })

    const data = await request.validateUsing(updateProductValidator)
    product.merge(data)
    await product.save()

    return serialize.withoutWrapping(ProductTransformer.transform(product))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const seller = auth.getUserOrFail()
    const product = await Product.query()
      .where('id', params.id)
      .where('seller_id', seller.id)
      .first()

    if (!product) return response.notFound({ message: 'Product not found' })

    await product.delete()
    return response.noContent()
  }
}
```

- [ ] **Step 4: Register seller routes**

Update `apps/api/start/routes.ts` to add seller routes group:

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
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
        router.get('products', [controllers.SellerProducts, 'index'])
        router.post('products', [controllers.SellerProducts, 'store'])
        router.put('products/:id', [controllers.SellerProducts, 'update'])
        router.delete('products/:id', [controllers.SellerProducts, 'destroy'])
      })
      .prefix('seller')
      .use([middleware.auth(), middleware.seller()])
  })
  .prefix('/api/v1')
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/api && node ace test functional --files tests/functional/seller_products.spec.ts
```

Expected: PASS — all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/controllers/seller apps/api/tests/functional/seller_products.spec.ts apps/api/start/routes.ts
git commit -m "feat(api): add seller products CRUD endpoints"
```

---

## Task 12: Image upload endpoint + static file serving

**Files:**
- Modify: `apps/api/app/controllers/seller/seller_products_controller.ts`
- Modify: `apps/api/start/routes.ts`
- Modify: `apps/web/src/lib/api/fetch-client.ts`

- [ ] **Step 1: Add uploadImage action to SellerProductsController**

Add this method to `apps/api/app/controllers/seller/seller_products_controller.ts` (add before the closing brace):

```ts
  async uploadImage({ auth, params, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const product = await Product.query()
      .where('id', params.id)
      .where('seller_id', seller.id)
      .preload('category')
      .preload('seller')
      .first()

    if (!product) return response.notFound({ message: 'Product not found' })

    const image = request.file('image', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!image) return response.unprocessableEntity({ message: 'No image provided' })
    if (!image.isValid) return response.unprocessableEntity({ message: image.errors })

    const { randomUUID } = await import('node:crypto')
    const ext = image.extname
    const fileName = `${randomUUID()}.${ext}`

    await image.move(app.makePath('storage/uploads/products'), { name: fileName })

    product.imagePath = `/uploads/products/${fileName}`
    await product.save()

    return serialize.withoutWrapping(ProductTransformer.transform(product))
  }
```

Also add the `app` import at the top of the file:

```ts
import app from '@adonisjs/core/services/app'
```

- [ ] **Step 2: Create uploads directory**

```bash
mkdir -p apps/api/storage/uploads/products
touch apps/api/storage/uploads/products/.gitkeep
```

- [ ] **Step 3: Add uploads route and image upload route**

Update `apps/api/start/routes.ts` — add image upload endpoint inside the seller group, and add static uploads route:

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import app from '@adonisjs/core/services/app'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'

router.get('/', () => {
  return { hello: 'world' }
})

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
        router.get('products', [controllers.SellerProducts, 'index'])
        router.post('products', [controllers.SellerProducts, 'store'])
        router.put('products/:id', [controllers.SellerProducts, 'update'])
        router.delete('products/:id', [controllers.SellerProducts, 'destroy'])
        router.post('products/:id/image', [controllers.SellerProducts, 'uploadImage'])
      })
      .prefix('seller')
      .use([middleware.auth(), middleware.seller()])
  })
  .prefix('/api/v1')
```

- [ ] **Step 4: Update apiFetch to skip Content-Type for FormData**

Modify `apps/web/src/lib/api/fetch-client.ts`:

```ts
export const TOKEN_KEY = 'auth_token'

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const isFormData = init?.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((init?.headers as Record<string, string>) ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...init, headers })
  if (!res.ok) {
    const body = (await res.json()) as { message?: string }
    throw new Error(body.message ?? 'Request failed')
  }
  return (await res.json()) as T
}
```

- [ ] **Step 5: Verify tests still pass**

```bash
cd apps/api && node ace test functional
```

Expected: all existing tests pass.

- [ ] **Step 6: Verify web tests still pass**

```bash
cd apps/web && pnpm test --run
```

Expected: fetch-client tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/app/controllers/seller/seller_products_controller.ts apps/api/start/routes.ts apps/api/storage/uploads/products/.gitkeep apps/web/src/lib/api/fetch-client.ts
git commit -m "feat(api): add image upload endpoint and static file serving for products"
```

---

## Task 13: Frontend — auth type + api + use-signup + signup page

**Files:**
- Modify: `apps/web/src/features/auth/types.ts`
- Modify: `apps/web/src/features/auth/api.ts`
- Modify: `apps/web/src/features/auth/use-signup.ts`
- Modify: `apps/web/src/features/auth/signup-page.tsx`

- [ ] **Step 1: Update User type**

Replace `apps/web/src/features/auth/types.ts`:

```ts
export interface User {
  id: number
  fullName: string | null
  email: string
  isSeller: boolean
  farmName: string | null
  initials: string
  createdAt: string
  updatedAt: string | null
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginResponse {
  token: string
}
```

- [ ] **Step 2: Update auth API**

Replace `apps/web/src/features/auth/api.ts`:

```ts
import { apiFetch } from '../../lib/api/fetch-client'
import type { User, AuthResponse, LoginResponse } from './types'

interface LoginInput {
  email: string
  password: string
}

interface SignupInput {
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
  isSeller?: boolean
  farmName?: string | null
}

export const authApi = {
  login: (data: LoginInput) =>
    apiFetch<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signup: (data: SignupInput) =>
    apiFetch<AuthResponse>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () =>
    apiFetch('/api/v1/account/logout', { method: 'POST' }),
  profile: () =>
    apiFetch<User>('/api/v1/account/profile'),
}
```

- [ ] **Step 3: Update use-signup (no change needed — types propagate)**

The `useSignup` hook calls `authApi.signup` which now accepts the extended input. No code change needed.

- [ ] **Step 4: Update SignupPage**

Replace `apps/web/src/features/auth/signup-page.tsx`:

```tsx
import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Button, Input, Label, Checkbox } from '@farm-market/ui'
import { useSignup } from './use-signup'
import { AuthLayout } from './auth-layout'

export function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isSeller, setIsSeller] = useState(false)
  const [farmName, setFarmName] = useState('')
  const signup = useSignup()
  const router = useRouter()

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

> **Note:** If `Checkbox` is not exported from `@farm-market/ui`, check what's available with `ls packages/ui/src/components/` and use `<input type="checkbox" ...>` as fallback.

- [ ] **Step 5: Verify typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/auth/
git commit -m "feat(web): add isSeller and farmName to signup flow"
```

---

## Task 14: AppLayout

**Files:**
- Create: `apps/web/src/features/layout/app-layout.tsx`

- [ ] **Step 1: Create AppLayout**

Create `apps/web/src/features/layout/app-layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Logo } from '../auth/logo'
import { useCurrentUser } from '../auth/use-current-user'
import { useLogout } from '../auth/use-logout'

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/catalog">
            <Logo />
          </Link>
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
            <button className="text-gray-400 cursor-not-allowed" disabled>
              Кошик
            </button>
            {user && (
              <button
                onClick={() => void logout.mutate()}
                className="text-gray-700 hover:text-red-600"
              >
                Вийти
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/layout/
git commit -m "feat(web): add AppLayout with navbar"
```

---

## Task 15: Catalog types + api.ts + tests

**Files:**
- Create: `apps/web/src/features/catalog/types.ts`
- Create: `apps/web/src/features/catalog/api.ts`
- Create: `apps/web/src/features/catalog/__tests__/api.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/features/catalog/__tests__/api.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogApi } from '../api'

const mockFetch = vi.fn()

describe('catalogApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('getProducts', () => {
    it('calls GET /api/v1/products', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({})
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/products')
    })

    it('appends category param when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({ category: 'vegetables' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('category=vegetables')
    })

    it('appends search param when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({ search: 'томати' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('search=томати')
    })
  })

  describe('getProduct', () => {
    it('calls GET /api/v1/products/:id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      await catalogApi.getProduct(42)
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/products/42')
    })
  })

  describe('getCategories', () => {
    it('calls GET /api/v1/categories', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getCategories()
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/categories')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm test --run src/features/catalog/__tests__/api.test.ts
```

Expected: FAIL — `catalogApi` not found.

- [ ] **Step 3: Create catalog types**

Create `apps/web/src/features/catalog/types.ts`:

```ts
export interface Category {
  id: number
  name: string
  slug: string
}

export interface ProductSeller {
  id: number
  fullName: string | null
  farmName: string | null
}

export interface Product {
  id: number
  name: string
  price: string
  unit: string
  quantity: string
  imagePath: string | null
  status: 'active' | 'inactive' | 'archived'
  category: Category
  seller: ProductSeller
}
```

- [ ] **Step 4: Create catalog api.ts**

Create `apps/web/src/features/catalog/api.ts`:

```ts
import { apiFetch } from '../../lib/api/fetch-client'
import type { Category, Product } from './types'

interface GetProductsParams {
  category?: string
  search?: string
}

export const catalogApi = {
  getProducts: ({ category, search }: GetProductsParams) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    const qs = params.toString()
    return apiFetch<{ data: Product[] }>(`/api/v1/products${qs ? `?${qs}` : ''}`)
  },
  getProduct: (id: number) =>
    apiFetch<Product>(`/api/v1/products/${id}`),
  getCategories: () =>
    apiFetch<{ data: Category[] }>('/api/v1/categories'),
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/web && pnpm test --run src/features/catalog/__tests__/api.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/catalog/
git commit -m "feat(web): add catalog types and api module"
```

---

## Task 16: Catalog hooks

**Files:**
- Create: `apps/web/src/features/catalog/use-categories.ts`
- Create: `apps/web/src/features/catalog/use-products.ts`
- Create: `apps/web/src/features/catalog/use-product.ts`

- [ ] **Step 1: Create use-categories**

Create `apps/web/src/features/catalog/use-categories.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { catalogApi } from './api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories().then((r) => r.data),
    staleTime: Infinity,
  })
}
```

- [ ] **Step 2: Create use-products**

Create `apps/web/src/features/catalog/use-products.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { catalogApi } from './api'

interface UseProductsParams {
  category?: string
  search?: string
}

export function useProducts(params: UseProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => catalogApi.getProducts(params).then((r) => r.data),
  })
}
```

- [ ] **Step 3: Create use-product**

Create `apps/web/src/features/catalog/use-product.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { catalogApi } from './api'

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => catalogApi.getProduct(id),
  })
}
```

- [ ] **Step 4: Verify typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/catalog/use-categories.ts apps/web/src/features/catalog/use-products.ts apps/web/src/features/catalog/use-product.ts
git commit -m "feat(web): add catalog query hooks"
```

---

## Task 17: CatalogPage + ProductCard

**Files:**
- Create: `apps/web/src/features/catalog/product-card.tsx`
- Create: `apps/web/src/features/catalog/catalog-page.tsx`

- [ ] **Step 1: Create ProductCard**

Create `apps/web/src/features/catalog/product-card.tsx`:

```tsx
import { Link } from '@tanstack/react-router'
import type { Product } from './types'

interface Props {
  product: Product
}

export function ProductCard({ product }: Props) {
  return (
    <Link
      to="/products/$id"
      params={{ id: String(product.id) }}
      className="block border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.imagePath ? (
          <img src={product.imagePath} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">🥦</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="font-semibold text-gray-900 leading-tight">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {product.seller.farmName ?? product.seller.fullName ?? ''}
        </p>
        <p className="text-sm font-bold text-green-700 mt-1">
          {product.price} ₴ / {product.unit}
        </p>
        <button
          disabled
          className="mt-2 w-full text-xs border border-gray-200 rounded py-1 text-gray-400 cursor-not-allowed"
        >
          До кошика
        </button>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create CatalogPage**

Create `apps/web/src/features/catalog/catalog-page.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCategories } from './use-categories'
import { useProducts } from './use-products'
import { ProductCard } from './product-card'

export function CatalogPage() {
  const search = useSearch({ from: '/catalog' })
  const navigate = useNavigate({ from: '/catalog' })
  const [searchInput, setSearchInput] = useState((search as { search?: string }).search ?? '')

  const activeCategory = (search as { category?: string }).category
  const activeSearch = (search as { search?: string }).search

  const { data: categories = [] } = useCategories()
  const { data: products = [], isLoading } = useProducts({
    category: activeCategory,
    search: activeSearch,
  })

  const handleCategoryClick = (slug?: string) => {
    void navigate({ search: (prev) => ({ ...prev, category: slug, search: undefined }) })
  }

  const handleSearch = (value: string) => {
    setSearchInput(value)
    void navigate({ search: (prev) => ({ ...prev, search: value || undefined }) })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      <aside className="w-44 shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Категорії</p>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              onClick={() => handleCategoryClick(undefined)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                !activeCategory ? 'bg-green-100 text-green-800 font-semibold' : 'text-gray-700 hover:bg-gray-100'
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
  )
}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/catalog/product-card.tsx apps/web/src/features/catalog/catalog-page.tsx
git commit -m "feat(web): add CatalogPage and ProductCard components"
```

---

## Task 18: ProductPage

**Files:**
- Create: `apps/web/src/features/catalog/product-page.tsx`

- [ ] **Step 1: Create ProductPage**

Create `apps/web/src/features/catalog/product-page.tsx`:

```tsx
import { useParams } from '@tanstack/react-router'
import { useProduct } from './use-product'

export function ProductPage() {
  const { id } = useParams({ from: '/products/$id' })
  const { data: product, isLoading, isError } = useProduct(Number(id))

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>
  if (isError || !product) return <div className="p-8 text-sm text-red-500">Товар не знайдено</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex gap-8">
      <div className="w-80 shrink-0">
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
          {product.imagePath ? (
            <img src={product.imagePath} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">🥦</span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div>
          <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
            {product.category.name}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-3xl font-bold text-green-700">
          {product.price} ₴ <span className="text-base font-normal text-gray-500">/ {product.unit}</span>
        </p>
        <p className="text-sm text-gray-600">
          Доступно: <span className="font-medium">{product.quantity} {product.unit}</span>
        </p>
        <div className="text-sm text-gray-600">
          <p className="font-medium">{product.seller.farmName ?? product.seller.fullName ?? 'Продавець'}</p>
        </div>
        {product.description && (
          <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
        )}
        <button
          disabled
          className="mt-2 w-full bg-gray-100 text-gray-400 rounded-lg py-3 text-sm cursor-not-allowed"
        >
          До кошика (незабаром)
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/catalog/product-page.tsx
git commit -m "feat(web): add ProductPage"
```

---

## Task 19: Seller api + hooks + tests

**Files:**
- Create: `apps/web/src/features/seller/api.ts`
- Create: `apps/web/src/features/seller/__tests__/api.test.ts`
- Create: `apps/web/src/features/seller/use-seller-products.ts`
- Create: `apps/web/src/features/seller/use-create-product.ts`
- Create: `apps/web/src/features/seller/use-update-product.ts`
- Create: `apps/web/src/features/seller/use-delete-product.ts`
- Create: `apps/web/src/features/seller/use-upload-image.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/features/seller/__tests__/api.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sellerApi } from '../api'

const mockFetch = vi.fn()

describe('sellerApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.setItem('auth_token', 'test_token')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
    localStorage.clear()
  })

  it('getProducts calls GET /api/v1/seller/products', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    await sellerApi.getProducts()
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toBe('/api/v1/seller/products')
  })

  it('createProduct calls POST /api/v1/seller/products', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    await sellerApi.createProduct({ name: 'X', categoryId: 1, price: 10, unit: 'кг', quantity: 1 })
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/seller/products')
    expect(init.method).toBe('POST')
  })

  it('updateProduct calls PUT /api/v1/seller/products/:id', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    await sellerApi.updateProduct(5, { name: 'Y' })
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/seller/products/5')
    expect(init.method).toBe('PUT')
  })

  it('deleteProduct calls DELETE /api/v1/seller/products/:id', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(null) })
    await sellerApi.deleteProduct(3)
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/seller/products/3')
    expect(init.method).toBe('DELETE')
  })

  it('uploadImage calls POST /api/v1/seller/products/:id/image with FormData', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' })
    await sellerApi.uploadImage(7, file)
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/seller/products/7/image')
    expect(init.body).toBeInstanceOf(FormData)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/web && pnpm test --run src/features/seller/__tests__/api.test.ts
```

Expected: FAIL — `sellerApi` not found.

- [ ] **Step 3: Create seller api.ts**

Create `apps/web/src/features/seller/api.ts`:

```ts
import { apiFetch } from '../../lib/api/fetch-client'
import type { Product } from '../catalog/types'

export interface ProductInput {
  name: string
  categoryId: number
  description?: string | null
  price: number
  unit: string
  quantity: number
  status?: 'active' | 'inactive' | 'archived'
}

export interface ProductUpdateInput extends Partial<ProductInput> {}

export const sellerApi = {
  getProducts: () =>
    apiFetch<{ data: Product[] }>('/api/v1/seller/products'),
  createProduct: (data: ProductInput) =>
    apiFetch<Product>('/api/v1/seller/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: number, data: ProductUpdateInput) =>
    apiFetch<Product>(`/api/v1/seller/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: number) =>
    apiFetch<null>(`/api/v1/seller/products/${id}`, { method: 'DELETE' }),
  uploadImage: (id: number, file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiFetch<Product>(`/api/v1/seller/products/${id}/image`, {
      method: 'POST',
      body: form,
    })
  },
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/web && pnpm test --run src/features/seller/__tests__/api.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Create seller hooks**

Create `apps/web/src/features/seller/use-seller-products.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { sellerApi } from './api'

export function useSellerProducts() {
  return useQuery({
    queryKey: ['seller-products'],
    queryFn: () => sellerApi.getProducts().then((r) => r.data),
  })
}
```

Create `apps/web/src/features/seller/use-create-product.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi } from './api'

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sellerApi.createProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

Create `apps/web/src/features/seller/use-update-product.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi, type ProductUpdateInput } from './api'

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdateInput }) =>
      sellerApi.updateProduct(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

Create `apps/web/src/features/seller/use-delete-product.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi } from './api'

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sellerApi.deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

Create `apps/web/src/features/seller/use-upload-image.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerApi } from './api'

export function useUploadImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => sellerApi.uploadImage(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] })
    },
  })
}
```

- [ ] **Step 6: Verify typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/seller/
git commit -m "feat(web): add seller api module and mutation hooks"
```

---

## Task 20: ProductForm

**Files:**
- Create: `apps/web/src/features/seller/product-form.tsx`

- [ ] **Step 1: Create ProductForm**

Create `apps/web/src/features/seller/product-form.tsx`:

```tsx
import { useState } from 'react'
import { Button, Input, Label } from '@farm-market/ui'
import { useCategories } from '../catalog/use-categories'
import type { Product } from '../catalog/types'
import type { ProductInput } from './api'

interface Props {
  initial?: Product
  onSubmit: (data: ProductInput) => void
  isPending: boolean
  error?: string | null
}

const UNITS = ['кг', 'г', 'шт', 'л', 'мл', 'пучок', 'банка', 'упаковка', 'десяток']

export function ProductForm({ initial, onSubmit, isPending, error }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryId, setCategoryId] = useState<number>(initial?.category.id ?? 0)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price ?? '')
  const [unit, setUnit] = useState(initial?.unit ?? 'кг')
  const [quantity, setQuantity] = useState(initial?.quantity ?? '')
  const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>(initial?.status ?? 'active')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const { data: categories = [] } = useCategories()

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
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Назва товару *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Категорія *</Label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          required
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value={0} disabled>Оберіть категорію</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Опис</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="price">Ціна ₴ *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5 w-28">
          <Label htmlFor="unit">Одиниця *</Label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 w-32">
          <Label htmlFor="quantity">Кількість *</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Статус</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="active">Активний</option>
          <option value="inactive">Неактивний</option>
          <option value="archived">Архівний</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Фото</Label>
        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        {imageFile && <p className="text-xs text-gray-500">{imageFile.name}</p>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Збереження...' : 'Зберегти товар'}
      </Button>
    </form>
  )
}
```

> **Note:** `imageFile` is captured in the form but the upload is handled by the parent page after the product is saved (two-step: save product, then upload image if file selected). Pass `imageFile` to the parent via a ref or lift state.

Actually, lift `imageFile` state out via a callback prop. Update the `Props` interface to include `onImageChange: (file: File | null) => void` and call it in the file input handler. The parent page handles the upload after save.

Updated `Props`:

```ts
interface Props {
  initial?: Product
  onSubmit: (data: ProductInput) => void
  onImageChange?: (file: File | null) => void
  isPending: boolean
  error?: string | null
}
```

Add the call in the file input handler:
```tsx
onChange={(e) => {
  const file = e.target.files?.[0] ?? null
  setImageFile(file)
  onImageChange?.(file)
}}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/seller/product-form.tsx
git commit -m "feat(web): add ProductForm shared component"
```

---

## Task 21: Seller pages

**Files:**
- Create: `apps/web/src/features/seller/seller-products-page.tsx`
- Create: `apps/web/src/features/seller/new-product-page.tsx`
- Create: `apps/web/src/features/seller/edit-product-page.tsx`

- [ ] **Step 1: Create SellerProductsPage**

Create `apps/web/src/features/seller/seller-products-page.tsx`:

```tsx
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@farm-market/ui'
import { useSellerProducts } from './use-seller-products'
import { useDeleteProduct } from './use-delete-product'

export function SellerProductsPage() {
  const { data: products = [], isLoading } = useSellerProducts()
  const deleteProduct = useDeleteProduct()
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const handleDelete = (id: number) => {
    if (confirmId === id) {
      void deleteProduct.mutate(id)
      setConfirmId(null)
    } else {
      setConfirmId(id)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мої товари</h1>
        <Button asChild>
          <Link to="/seller/products/new">Додати товар</Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Завантаження...</p>}

      {!isLoading && products.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">Ще немає товарів.</p>
          <p>Додайте перший!</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="flex flex-col gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 border rounded-xl p-4 bg-white"
            >
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {product.imagePath ? (
                  <img src={product.imagePath} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🥦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category.name}</p>
                <p className="text-sm text-green-700 font-medium">{product.price} ₴ / {product.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {product.status === 'active' ? 'Активний' : product.status === 'inactive' ? 'Неактивний' : 'Архів'}
                </span>
                <Link
                  to="/seller/products/$id/edit"
                  params={{ id: String(product.id) }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✏️
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title={confirmId === product.id ? 'Натисніть ще раз для підтвердження' : 'Видалити'}
                >
                  {confirmId === product.id ? '⚠️' : '🗑'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create NewProductPage**

Create `apps/web/src/features/seller/new-product-page.tsx`:

```tsx
import { useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ProductForm } from './product-form'
import { useCreateProduct } from './use-create-product'
import { useUploadImage } from './use-upload-image'

export function NewProductPage() {
  const router = useRouter()
  const createProduct = useCreateProduct()
  const uploadImage = useUploadImage()
  const imageFileRef = useRef<File | null>(null)

  const handleSubmit = async (data: Parameters<typeof createProduct.mutateAsync>[0]) => {
    const product = await createProduct.mutateAsync(data)
    if (imageFileRef.current) {
      await uploadImage.mutateAsync({ id: product.id, file: imageFileRef.current })
    }
    await router.navigate({ to: '/seller/products' })
  }

  const isPending = createProduct.isPending || uploadImage.isPending
  const error = createProduct.isError
    ? createProduct.error instanceof Error ? createProduct.error.message : 'Помилка'
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Новий товар</h1>
      <ProductForm
        onSubmit={(data) => void handleSubmit(data)}
        onImageChange={(file) => { imageFileRef.current = file }}
        isPending={isPending}
        error={error}
      />
    </div>
  )
}
```

- [ ] **Step 3: Create EditProductPage**

Create `apps/web/src/features/seller/edit-product-page.tsx`:

```tsx
import { useRef } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { ProductForm } from './product-form'
import { useSellerProducts } from './use-seller-products'
import { useUpdateProduct } from './use-update-product'
import { useUploadImage } from './use-upload-image'

export function EditProductPage() {
  const { id } = useParams({ from: '/seller/products/$id/edit' })
  const router = useRouter()
  const { data: products = [] } = useSellerProducts()
  const product = products.find((p) => p.id === Number(id))
  const updateProduct = useUpdateProduct()
  const uploadImage = useUploadImage()
  const imageFileRef = useRef<File | null>(null)

  if (!product) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>

  const handleSubmit = async (data: Parameters<typeof updateProduct.mutateAsync>[0]['data']) => {
    await updateProduct.mutateAsync({ id: Number(id), data })
    if (imageFileRef.current) {
      await uploadImage.mutateAsync({ id: Number(id), file: imageFileRef.current })
    }
    await router.navigate({ to: '/seller/products' })
  }

  const isPending = updateProduct.isPending || uploadImage.isPending
  const error = updateProduct.isError
    ? updateProduct.error instanceof Error ? updateProduct.error.message : 'Помилка'
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Редагувати товар</h1>
      <ProductForm
        initial={product}
        onSubmit={(data) => void handleSubmit(data)}
        onImageChange={(file) => { imageFileRef.current = file }}
        isPending={isPending}
        error={error}
      />
    </div>
  )
}
```

- [ ] **Step 4: Verify typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/seller/seller-products-page.tsx apps/web/src/features/seller/new-product-page.tsx apps/web/src/features/seller/edit-product-page.tsx
git commit -m "feat(web): add seller dashboard pages (list, new, edit)"
```

---

## Task 22: TanStack Router route files

**Files:**
- Create: `apps/web/src/routes/catalog.tsx`
- Create: `apps/web/src/routes/products/$id.tsx`
- Create: `apps/web/src/routes/seller/route.tsx`
- Create: `apps/web/src/routes/seller/products/index.tsx`
- Create: `apps/web/src/routes/seller/products/new.tsx`
- Create: `apps/web/src/routes/seller/products/$id.edit.tsx`
- Modify: `apps/web/src/routes/index.tsx`

TanStack Router auto-generates `routeTree.gen.ts` when the Vite dev server runs. Never edit `routeTree.gen.ts` manually.

- [ ] **Step 1: Create catalog route**

Create `apps/web/src/routes/catalog.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage } from '../features/catalog/catalog-page'
import { AppLayout } from '../features/layout/app-layout'

export const Route = createFileRoute('/catalog')({
  component: () => (
    <AppLayout>
      <CatalogPage />
    </AppLayout>
  ),
})
```

- [ ] **Step 2: Create product detail route**

Create directory `apps/web/src/routes/products/` and file `$id.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { ProductPage } from '../../features/catalog/product-page'
import { AppLayout } from '../../features/layout/app-layout'

export const Route = createFileRoute('/products/$id')({
  component: () => (
    <AppLayout>
      <ProductPage />
    </AppLayout>
  ),
})
```

- [ ] **Step 3: Create seller layout route (auth + seller guard)**

Create directory `apps/web/src/routes/seller/` and file `route.tsx`:

```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '../../features/layout/app-layout'
import { useCurrentUser } from '../../features/auth/use-current-user'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

function SellerGuard() {
  const { data: user, isLoading } = useCurrentUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user && !user.isSeller) {
      void navigate({ to: '/catalog' })
    }
  }, [user, isLoading, navigate])

  if (isLoading) return null

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

export const Route = createFileRoute('/seller')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: SellerGuard,
})
```

- [ ] **Step 4: Create seller products route files**

Create directory `apps/web/src/routes/seller/products/` and these files:

`index.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { SellerProductsPage } from '../../../features/seller/seller-products-page'

export const Route = createFileRoute('/seller/products/')({
  component: SellerProductsPage,
})
```

`new.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { NewProductPage } from '../../../features/seller/new-product-page'

export const Route = createFileRoute('/seller/products/new')({
  component: NewProductPage,
})
```

`$id.edit.tsx`:
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { EditProductPage } from '../../../features/seller/edit-product-page'

export const Route = createFileRoute('/seller/products/$id/edit')({
  component: EditProductPage,
})
```

- [ ] **Step 5: Update root index redirect**

Check `apps/web/src/routes/index.tsx` — if it renders a landing page, update it to redirect to `/catalog`. Replace content with:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/catalog' })
  },
  component: () => null,
})
```

- [ ] **Step 6: Start dev server to trigger route regeneration**

```bash
cd apps/web && pnpm dev &
sleep 3
```

TanStack Router Vite plugin auto-regenerates `routeTree.gen.ts` when files change. Check `src/routeTree.gen.ts` is updated with new routes.

Kill dev server after regeneration: `kill %1`

- [ ] **Step 7: Verify typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 8: Run all web tests**

```bash
cd apps/web && pnpm test --run
```

Expected: all tests pass.

- [ ] **Step 9: Run all API tests**

```bash
cd apps/api && node ace test functional
```

Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/routes/ apps/web/src/routeTree.gen.ts
git commit -m "feat(web): add TanStack Router routes for catalog and seller pages"
```

---

## Spec Deviation Note

The original spec create/update body used `isActive: boolean`. During spec review this was changed to `status: enum('active', 'inactive', 'archived')`. The API validator (`product.ts`) and frontend form use `status` accordingly.

---

## Self-Review Checklist

- [x] Seller role flag at registration (`is_seller`) — Task 1 + Task 5 + Task 13
- [x] Product CRUD for sellers — Task 11
- [x] Photo upload — Task 12
- [x] Public catalog with category sidebar and search — Task 17
- [x] Product detail page — Task 18
- [x] Seller dashboard (list + add/edit/delete) — Task 19-21
- [x] `GET /api/v1/products` with `category` + `search` params — Task 10
- [x] `GET /api/v1/products/:id` — Task 10
- [x] `GET /api/v1/categories` — Task 6
- [x] Seller endpoints behind auth + seller middleware — Task 8 + Task 11
- [x] `POST /api/v1/seller/products/:id/image` — Task 12
- [x] `/uploads/*` static serving — Task 12
- [x] AppLayout with conditional "Мої товари" link — Task 14
- [x] Signup redirect to `/catalog` — Task 13
- [x] UserTransformer includes `isSeller` + `farmName` — Task 5
