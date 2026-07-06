# B2 Image Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local filesystem image uploads with Backblaze B2 (S3-compatible) so product images survive Railway redeployments.

**Architecture:** A `StorageService` class wraps `@aws-sdk/client-s3`, accepts an injectable `S3Client` for testability, and exposes a single `upload()` method returning a full public URL. The `uploadImage` controller method switches from `image.move()` to reading the temp file and calling the service. The local `/uploads/*` serving route is removed.

**Tech Stack:** `@aws-sdk/client-s3`, Backblaze B2 (S3-compatible endpoint), AdonisJS v6, Japa test runner

---

### Task 1: Install dependency and add env vars

**Files:**
- Modify: `apps/api/package.json` (via pnpm install)
- Modify: `apps/api/.env`
- Modify: `apps/api/.env.example`

- [ ] **Step 1: Install `@aws-sdk/client-s3`**

```bash
cd apps/api && pnpm add @aws-sdk/client-s3
```

Expected: package added to `dependencies` in `package.json`.

- [ ] **Step 2: Add B2 vars to `.env`**

Append to `apps/api/.env`:

```
# B2 Storage
B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_ACCESS_KEY_ID=0033a481ca443cb0000000001
B2_SECRET_ACCESS_KEY=K003Xh0upe3bar3v8dZI8wYSiyUQg68
B2_BUCKET_NAME=farm-market
B2_PUBLIC_URL=https://f003.backblazeb2.com/file/farm-market
```

- [ ] **Step 3: Add B2 vars template to `.env.example`**

Append to `apps/api/.env.example`:

```
# B2 Storage
B2_ENDPOINT=
B2_ACCESS_KEY_ID=
B2_SECRET_ACCESS_KEY=
B2_BUCKET_NAME=
B2_PUBLIC_URL=
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/package.json apps/api/pnpm-lock.yaml apps/api/.env.example
git commit -m "feat: install @aws-sdk/client-s3, add B2 env var template"
```

(Do NOT commit `.env` — it contains secrets.)

---

### Task 2: Create `StorageService`

**Files:**
- Create: `apps/api/app/services/storage_service.ts`
- Create: `apps/api/tests/unit/storage_service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/unit/storage_service.spec.ts`:

```ts
import { test } from '@japa/runner'
import { S3Client } from '@aws-sdk/client-s3'
import { StorageService } from '#services/storage_service'

test.group('StorageService', () => {
  test('upload sends PutObjectCommand with correct params and returns public URL', async ({
    assert,
  }) => {
    const calls: { input: Record<string, unknown> }[] = []
    const mockClient = {
      send: async (command: { input: Record<string, unknown> }) => {
        calls.push(command)
        return {}
      },
    } as unknown as S3Client

    process.env.B2_BUCKET_NAME = 'test-bucket'
    process.env.B2_PUBLIC_URL = 'https://f003.backblazeb2.com/file/test-bucket'

    const service = new StorageService(mockClient)
    const url = await service.upload(Buffer.from('test'), 'products/abc.jpg', 'image/jpeg')

    assert.equal(url, 'https://f003.backblazeb2.com/file/test-bucket/products/abc.jpg')
    assert.lengthOf(calls, 1)
    assert.equal(calls[0].input['Bucket'], 'test-bucket')
    assert.equal(calls[0].input['Key'], 'products/abc.jpg')
    assert.equal(calls[0].input['ContentType'], 'image/jpeg')
    assert.deepEqual(calls[0].input['Body'], Buffer.from('test'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/api && node ace test tests/unit/storage_service.spec.ts
```

Expected: FAIL — `Cannot find module '#services/storage_service'`

- [ ] **Step 3: Implement `StorageService`**

Create `apps/api/app/services/storage_service.ts`:

```ts
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export class StorageService {
  constructor(private readonly client: S3Client) {}

  async upload(buffer: Buffer, key: string, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )
    return `${process.env.B2_PUBLIC_URL}/${key}`
  }
}

export const storageService = new StorageService(
  new S3Client({
    endpoint: process.env.B2_ENDPOINT!,
    region: 'auto',
    credentials: {
      accessKeyId: process.env.B2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
    },
  })
)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/api && node ace test tests/unit/storage_service.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services/storage_service.ts apps/api/tests/unit/storage_service.spec.ts
git commit -m "feat: add StorageService for B2 image uploads"
```

---

### Task 3: Update `uploadImage` controller

**Files:**
- Modify: `apps/api/app/controllers/seller/seller_products_controller.ts`

- [ ] **Step 1: Replace `uploadImage` method**

In `apps/api/app/controllers/seller/seller_products_controller.ts`, replace the entire file content:

```ts
import Product from '#models/product'
import ProductTransformer from '#transformers/product_transformer'
import { createProductSchema, updateProductSchema } from '#validators/product'
import { zodValidate } from '#lib/zod_validate'
import { storageService } from '#services/storage_service'
import type { HttpContext } from '@adonisjs/core/http'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

export default class SellerProductsController {
  async index({ auth, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const products = await Product.query()
      .where('seller_id', seller.id)
      .preload('category')
      .preload('seller')
      .orderBy('created_at', 'desc')
    return serialize(ProductTransformer.transform(products))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const data = zodValidate(createProductSchema, request.body())
    const product = await Product.create({
      name: data.name,
      categoryId: data.categoryId,
      description: data.description ?? null,
      price: String(data.price),
      unit: data.unit,
      quantity: String(data.quantity),
      status: data.status ?? 'active',
      sellerId: seller.id,
    })
    await product.load('category')
    await product.load('seller')
    response.status(201)
    return serialize.withoutWrapping(ProductTransformer.transform(product))
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

    const data = zodValidate(updateProductSchema, request.body())
    if (data.name !== undefined) product.name = data.name
    if (data.categoryId !== undefined) product.categoryId = data.categoryId
    if (data.description !== undefined) product.description = data.description ?? null
    if (data.price !== undefined) product.price = String(data.price)
    if (data.unit !== undefined) product.unit = data.unit
    if (data.quantity !== undefined) product.quantity = String(data.quantity)
    if (data.status !== undefined) product.status = data.status
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

    const key = `products/${randomUUID()}.${image.extname}`
    const buffer = await readFile(image.tmpPath!)
    const contentType = image.headers['content-type'] ?? 'image/jpeg'

    product.imagePath = await storageService.upload(buffer, key, contentType)
    await product.save()

    return serialize.withoutWrapping(ProductTransformer.transform(product))
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/api && node ace typecheck 2>&1 || pnpm typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/controllers/seller/seller_products_controller.ts
git commit -m "feat: upload product images to B2 via StorageService"
```

---

### Task 4: Remove local `/uploads/*` route

**Files:**
- Modify: `apps/api/start/routes.ts`

- [ ] **Step 1: Remove the `/uploads/*` route and unused imports**

In `apps/api/start/routes.ts`, remove:
- The `router.get('/uploads/*', ...)` block (lines 23–33)
- The `import app from '@adonisjs/core/services/app'` line
- The `import { createReadStream } from 'node:fs'` line
- The `import { stat } from 'node:fs/promises'` line

The top of the file should look like:

```ts
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/health', [controllers.health.Health, 'show'])
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/api && pnpm typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/start/routes.ts
git commit -m "chore: remove local /uploads/* route, images now served from B2"
```

---

### Task 5: Add Railway env vars and verify

**Files:** Railway Dashboard (manual)

- [ ] **Step 1: Add env vars in Railway**

In Railway Dashboard → API service → Variables, add:

```
B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_ACCESS_KEY_ID=0033a481ca443cb0000000001
B2_SECRET_ACCESS_KEY=K003Xh0upe3bar3v8dZI8wYSiyUQg68
B2_BUCKET_NAME=farm-market
B2_PUBLIC_URL=https://f003.backblazeb2.com/file/farm-market
```

- [ ] **Step 2: Push and verify deploy succeeds**

```bash
git push
```

Watch Railway deploy logs — no startup errors expected.

- [ ] **Step 3: Manual smoke test**

1. Log in as a seller
2. Create or edit a product
3. Upload an image
4. Verify the image displays in the catalog (URL should start with `https://f003.backblazeb2.com`)
