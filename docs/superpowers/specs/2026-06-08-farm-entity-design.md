# Farm Entity — Design

## Context

Currently, a "farmer" is just a `User` with `isSeller=true` and a `farmName` field. The existing `/farmers/:id` page shows the user's name, contacts, and products. We are elevating the farm to a proper entity with a rich public profile: description, cover photo, photo gallery, location, activity tags, Instagram link, and product listing.

**Constraints:**
- One farm per farmer (user_id is unique on the farms table)
- Products are already linked to sellers via `products.seller_id` — no schema change needed for products
- Existing `/farmers/:id` page stays as-is; `/farms/:id` is the new richer profile

## Data Model

### `farms` table

| Column | Type | Notes |
|---|---|---|
| id | integer PK | auto-increment |
| user_id | integer FK (unique) | references users(id) |
| name | string | farm display name |
| description | text nullable | free-form description |
| cover_image_path | string nullable | URL (B2 storage) |
| location | string nullable | region/city, plain text |
| activities | JSONB | array of strings, default `[]` |
| instagram | string nullable | full URL or handle |
| created_at | timestamp | |
| updated_at | timestamp | |

### `farm_photos` table

| Column | Type | Notes |
|---|---|---|
| id | integer PK | auto-increment |
| farm_id | integer FK | references farms(id), cascade delete |
| image_path | string | URL (B2 storage) |
| position | integer | sort order, default 0 |
| created_at | timestamp | |

### Products (no change)

Products are linked to farms implicitly: `products.seller_id = farms.user_id`. The farm profile query joins through this relationship.

## API Endpoints

### Public

**`GET /api/farms/:id`**
Returns full farm profile:
```json
{
  "id": 1,
  "name": "Ферма «Зелений луг»",
  "description": "...",
  "coverImagePath": "https://f003.backblazeb2.com/...",
  "location": "Полтавська обл., Миргород",
  "activities": ["рибалка", "екскурсії", "дегустація"],
  "instagram": "https://instagram.com/zelenyi_lug",
  "photos": [
    { "id": 1, "imagePath": "...", "position": 0 }
  ],
  "products": [
    { "id": 1, "name": "Томати", "price": "45", "unit": "кг", "imagePath": "..." }
  ],
  "farmer": {
    "id": 5,
    "fullName": "Іван Петренко"
  }
}
```

**`GET /api/farms`** (optional, for future catalog of farms — out of scope for this spec)

### Seller (requires auth + isSeller)

| Method | Path | Description |
|---|---|---|
| POST | /api/seller/farm | Create farm |
| PATCH | /api/seller/farm | Update farm fields |
| GET | /api/seller/farm | Get my farm |
| POST | /api/seller/farm/cover | Upload cover image |
| POST | /api/seller/farm/photos | Add gallery photo |
| DELETE | /api/seller/farm/photos/:photoId | Remove gallery photo |

Farm photos are limited to **10 per farm** (enforced in the API).

Cover image and gallery photos are uploaded to B2 via the existing `StorageService` (`getStorageService().upload(...)`).

## Frontend Routes

### Public: `/farms/$id`

Layout A (vertical):
1. **Cover photo** — full-width banner (fallback: green gradient placeholder)
2. **Header block** — farm name, location badge, Instagram link, "Написати фермеру" button (links to chat with farm owner)
3. **Description** — shown only if present
4. **Activity tags** — shown only if activities array is non-empty
5. **Photo gallery** — horizontal scroll of gallery photos, shown only if photos exist
6. **Products** — grid (same `ProductCard` component as catalog), shown even if empty with "Немає активних товарів"

### Seller panel: `/seller/farm`

Single page with two sections:

**Farm info form:**
- Name (required)
- Description (textarea)
- Location (text input)
- Instagram (text input)
- Activities (multi-select tags: preset list + free input)

**Photos section:**
- Cover photo upload (replaces existing, preview shown)
- Gallery: upload new + delete, max 10 photos (order = insertion order, newest last)

### Existing `/farmers/$id` page

Add a "Переглянути ферму →" link if the farmer has a farm entity. No other changes.

## Activity Tags — Preset List

Stored as free strings in JSONB, but the seller UI shows a preset list with ability to add custom ones:

`Рибалка`, `Полювання`, `Екскурсії`, `Дегустація`, `Майстер-класи`, `Збір урожаю`, `Верхова їзда`, `Кемпінг`, `Страусина ферма`, `Сироварня`

## File Structure

### API
```
app/
  models/
    farm.ts            — Farm model + relations
    farm_photo.ts      — FarmPhoto model
  controllers/
    catalog/
      farms_controller.ts     — GET /farms/:id (public)
    seller/
      seller_farm_controller.ts   — CRUD for seller's farm
  transformers/
    farm_transformer.ts
    farm_photo_transformer.ts
database/
  migrations/
    ..._create_farms_table.ts
    ..._create_farm_photos_table.ts
```

### Frontend
```
routes/
  farms/
    $id/
      index.tsx
      -farm-page.tsx
      use-farm.ts
      api.ts
  seller/
    farm/
      index.tsx
      -seller-farm-page.tsx
      use-seller-farm.ts
      api.ts
```

## Error Handling

- `GET /farms/:id` with unknown id → 404
- `POST /seller/farm` when farm already exists → 409 Conflict
- `POST /seller/farm/photos` when 10 photos already exist → 422 with message
- All B2 upload errors → 500 (same as product image uploads)

## Testing

- Functional test: `GET /farms/:id` returns correct shape including products and photos
- Functional test: seller can create, update, upload cover, add/remove gallery photo
- Functional test: non-seller cannot create farm (403)
- Functional test: seller cannot access another seller's farm management endpoints
