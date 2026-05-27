# Product Catalog

## Goal

Build the product catalog feature: sellers can list products, buyers browse and view them. This is the MVP core of the marketplace — no cart or orders in this iteration.

## Scope

**In scope:**
- Seller role flag at registration (`is_seller`)
- Product CRUD for sellers (with photo upload)
- Public catalog page with category sidebar and search
- Product detail page
- Seller dashboard (my products list + add/edit/delete)

**Out of scope (next iteration):**
- Cart and orders
- Seller verification/approval flow
- Product reviews
- Price filtering

---

## Data Model

### `users` table — new columns

```
is_seller: boolean  NOT NULL  DEFAULT false
farm_name: varchar(255)  nullable
```

Every user can browse and buy. `is_seller = true` enables the seller dashboard and product management.

### `categories` table — new

```
id: integer  PK
name: varchar(255)  NOT NULL
slug: varchar(255)  NOT NULL  UNIQUE
created_at / updated_at
```

Seeded with 8 categories (not user-editable):

| name | slug |
|------|------|
| Овочі | vegetables |
| Фрукти | fruits |
| М'ясо | meat |
| Молочні та яйця | dairy |
| Зернові | grains |
| Мед та варення | honey |
| Зелень та трави | herbs |
| Екзотика | exotic |

### `products` table — new

```
id: integer  PK
seller_id: integer  FK → users.id  NOT NULL
category_id: integer  FK → categories.id  NOT NULL
name: varchar(255)  NOT NULL
description: text  nullable
price: decimal(10, 2)  NOT NULL
unit: varchar(50)  NOT NULL  -- "кг", "шт", "л", "пучок", "банка", etc.
quantity: decimal(10, 3)  NOT NULL  DEFAULT 0
image_path: varchar(255)  nullable
is_active: boolean  NOT NULL  DEFAULT true
created_at / updated_at
```

---

## API

### Public (no auth)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/v1/products` | List active products. Query params: `category` (slug), `search` (name substring) |
| GET | `/api/v1/products/:id` | Single product with seller info |
| GET | `/api/v1/categories` | All categories |

**`GET /api/v1/products` response:**
```json
[
  {
    "id": 1,
    "name": "Томати черрі",
    "price": "45.00",
    "unit": "кг",
    "quantity": "50.000",
    "imagePath": "/uploads/products/abc123.jpg",
    "category": { "id": 1, "name": "Овочі", "slug": "vegetables" },
    "seller": { "id": 5, "fullName": "Іван Петренко", "farmName": "Ферма Петренків" }
  }
]
```

**`GET /api/v1/products/:id` response:** same shape, single object.

### Seller (auth required + `is_seller = true`)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/v1/seller/products` | My products (all, including inactive) |
| POST | `/api/v1/seller/products` | Create product |
| PUT | `/api/v1/seller/products/:id` | Update product |
| DELETE | `/api/v1/seller/products/:id` | Delete product (own only) |
| POST | `/api/v1/seller/products/:id/image` | Upload product image (multipart) |

**Create/update body:**
```json
{
  "name": "Томати черрі",
  "categoryId": 1,
  "description": "Свіжі черрі зі свого городу",
  "price": 45,
  "unit": "кг",
  "quantity": 50,
  "isActive": true
}
```

### Middleware

`seller_middleware.ts` — runs after `auth` middleware, returns 403 if `user.is_seller = false`.

---

## File Upload

- AdonisJS Drive, local disk for dev
- Stored at: `apps/api/storage/uploads/products/<uuid>.<ext>`
- Served via: `GET /uploads/*` static route in AdonisJS
- Only images accepted: `image/jpeg`, `image/png`, `image/webp`
- Max size: 5MB

---

## Frontend

### Layout

New `AppLayout` component (`features/layout/app-layout.tsx`) — used by all catalog and seller pages:
- Navbar: Farm Market logo (left) + nav links (Каталог, Мої товари if seller, Кошик placeholder, Вийти)
- Full-width content area below

Auth pages keep the existing `AuthLayout` (split panel). `AppLayout` is for the marketplace.

### Pages

| Route | Component | Access |
|-------|-----------|--------|
| `/catalog` | `CatalogPage` | public |
| `/products/$id` | `ProductPage` | public |
| `/seller/products` | `SellerProductsPage` | seller only |
| `/seller/products/new` | `NewProductPage` | seller only |
| `/seller/products/$id/edit` | `EditProductPage` | seller only |

### Catalog page (`/catalog`)

- Left sidebar (180px): category list. Active category highlighted in green.
- Right: search input + 3-column product grid.
- Each product card: photo (placeholder emoji if none), name, farm name (muted), price + unit, "До кошика" button (disabled/placeholder for now).
- Default: show all active products, newest first.
- Filter by category: click sidebar item, updates URL param `?category=vegetables`.
- Search: debounced input, filters by name client-side (or server-side via query param).

### Product detail page (`/products/$id`)

- Large photo (or placeholder)
- Name, category badge, price + unit, quantity available
- Seller info: farm name (or full name), link placeholder
- Description
- "До кошика" button (placeholder)

### Seller products page (`/seller/products`)

- Header: "Мої товари" + "Додати товар" button
- List of own products: photo thumbnail, name, category, price/unit, quantity, active badge
- Actions per row: Edit (✏️) → `/seller/products/:id/edit`, Delete (🗑) → confirm dialog
- Empty state: "Ще немає товарів. Додайте перший!"

### Add/Edit product form (`/seller/products/new`, `/seller/products/:id/edit`)

Fields:
- Назва товару (required)
- Категорія (select, required)
- Опис (textarea, optional)
- Ціна ₴ + Одиниця + Кількість (three inputs in a row)
- Фото (file upload, drag-and-drop zone, optional)
- Submit button: "Зберегти товар"

Unit select options: кг, г, шт, л, мл, пучок, банка, упаковка, десяток

### Auth changes (Signup page)

- Add checkbox: "Я продавець — хочу продавати товари"
- When checked: show `farm_name` text input (optional): "Назва ферми або господарства"
- `is_seller` and `farm_name` sent in signup request body

### Feature structure

```
apps/web/src/
  features/
    catalog/
      catalog-page.tsx
      product-page.tsx
      product-card.tsx
      use-products.ts       -- useQuery for product list
      use-product.ts        -- useQuery for single product
      use-categories.ts     -- useQuery for categories
      api.ts                -- catalogApi
      types.ts
    seller/
      seller-products-page.tsx
      new-product-page.tsx
      edit-product-page.tsx
      product-form.tsx      -- shared form for new + edit
      use-seller-products.ts
      use-create-product.ts
      use-update-product.ts
      use-delete-product.ts
      use-upload-image.ts
      api.ts                -- sellerApi
    layout/
      app-layout.tsx
  routes/
    catalog.tsx
    products/
      $id.tsx
    seller/
      products/
        index.tsx
        new.tsx
        $id.edit.tsx

apps/api/app/
  controllers/
    products_controller.ts       -- public GET
    categories_controller.ts     -- public GET
    seller/
      seller_products_controller.ts  -- seller CRUD + image upload
  middleware/
    seller_middleware.ts
  transformers/
    product_transformer.ts
    category_transformer.ts
```

---

## Auth changes (backend + frontend)

### UserTransformer

Add `isSeller` and `farmName` to the existing `UserTransformer` — automatically included in both `/profile` and signup responses:

```ts
{ isSeller: user.isSeller, farmName: user.farmName }
```

### Signup API

`new_account_controller.ts` accepts two new optional fields:
```ts
{ is_seller: boolean (optional, default false), farm_name: string | null (optional) }
```

### Frontend `User` type (`features/auth/types.ts`)

Add to existing interface:
```ts
isSeller: boolean
farmName: string | null
```

### `use-signup` hook

Add `isSeller` and `farmName` to the mutation input type and pass through to the API call.

### `AppLayout` navbar

Reads `user.isSeller` from `useCurrentUser()` — shows "Мої товари" link only when true.
