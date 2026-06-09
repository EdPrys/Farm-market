# Buyer Requests — Design Spec

**Date:** 2026-06-09

## Overview

Buyers post requests for products they want to find ("хочу 30 страусиних яєць"). Sellers browse requests and respond via chat or contacts. The feature lives as a tab inside the existing catalog page.

---

## Database

### Table: `buyer_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `user_id` | integer FK → users | one user → many requests |
| `category_id` | integer FK → categories | required |
| `title` | varchar(255) | required — short description |
| `description` | text | optional |
| `quantity` | decimal | required |
| `unit` | varchar(50) | required (кг, шт, л, ...) |
| `location` | varchar(255) | required |
| `budget` | decimal | optional |
| `expires_at` | timestamptz | optional |
| `status` | varchar(20) | `active` \| `closed` — default `active` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

User contacts (phone, telegram, viber) are pulled from the `users` table at read time — not stored on the request.

---

## API Endpoints

All routes under `/api/v1/requests`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/requests` | public | List active requests, paginated |
| `POST` | `/api/v1/requests` | required | Create a request |
| `GET` | `/api/v1/requests/:id` | public | Single request detail |
| `PATCH` | `/api/v1/requests/:id` | owner | Update / close own request |
| `DELETE` | `/api/v1/requests/:id` | owner | Delete own request |

### GET /api/v1/requests query params
- `category` — filter by category slug
- `location` — filter by location (partial match)
- `page` — pagination (20 per page)

### GET response shape
```json
{
  "data": [{
    "id": 1,
    "title": "Шукаю 2 кг свіжої морської риби",
    "description": "Бажано дорада або сібас",
    "quantity": 2,
    "unit": "кг",
    "location": "Київ",
    "budget": 350,
    "expiresAt": "2026-06-20T00:00:00Z",
    "status": "active",
    "createdAt": "2026-06-09T09:00:00Z",
    "category": { "id": 9, "name": "Риба і морепродукти", "slug": "fish" },
    "user": {
      "id": 5,
      "fullName": "Олег К.",
      "phone": "+380671234567",
      "telegram": "@oleg",
      "viber": null
    }
  }],
  "meta": { "currentPage": 1, "lastPage": 3, "total": 52 }
}
```

---

## Backend Structure

```
app/
  controllers/
    requests/
      buyer_requests_controller.ts   — index, show, store, update, destroy
  models/
    buyer_request.ts                 — BelongsTo user, BelongsTo category
  transformers/
    buyer_request_transformer.ts
  validators/
    buyer_request.ts                 — zod schema
database/
  migrations/
    XXXX_create_buyer_requests_table.ts
```

Route group in `start/routes.ts`:
```ts
router.get('requests', [BuyerRequestsController, 'index'])
router.get('requests/:id', [BuyerRequestsController, 'show'])
router.group(() => {
  router.post('requests', [BuyerRequestsController, 'store'])
  router.patch('requests/:id', [BuyerRequestsController, 'update'])
  router.delete('requests/:id', [BuyerRequestsController, 'destroy'])
}).middleware([middleware.auth()])
```

---

## Frontend Structure

```
src/routes/catalog/
  index.tsx                  — add tab switcher (Товари | Запити)
  -catalog-page.tsx          — renders tab based on ?tab= param
  requests/
    -requests-list.tsx       — list of request cards
    -request-card.tsx        — single card with contacts + chat button
    -request-form.tsx        — create/edit form (modal or page)
    api.ts                   — apiFetch wrappers
    use-requests.ts          — useQuery hook
    types.ts                 — TypeScript types
```

### Tab navigation
URL param: `/catalog?tab=requests`. Default tab is `products`. TanStack Router search schema validates `tab`.

### Request card UI
- Category badge + location + expiry
- Title (bold), description (muted)
- Quantity + budget (right side)
- Footer: author name | "📞 Контакти" button (shows phone/telegram/viber in a popover) | "💬 Написати" button (opens chat — uses existing `conversations` API)
- "Написати" only shown to logged-in users who are not the request author

### Request form
- Shown in a modal (consistent with existing product forms)
- Fields: title, category (select), quantity, unit (text), location (text), description (textarea), budget (number), expires_at (date picker)
- Contacts section: read-only display of user's phone/telegram/viber with link to profile to edit them

### My requests
- In `/profile` — new "Мої запити" section below existing profile info, list of own requests with ability to close or delete

---

## Data Flow

1. User opens `/catalog?tab=requests`
2. Frontend fetches `GET /api/v1/requests?page=1`
3. User clicks "+ Створити запит" → modal opens
4. Submit → `POST /api/v1/requests` → list refetched
5. Seller clicks "💬 Написати" → `POST /api/v1/conversations` with buyer's user_id → redirects to `/chat/:id`
6. Seller clicks "📞 Контакти" → popover shows phone/telegram/viber from response

---

## Out of Scope (this task)

- Monetization (paid features for sellers to see requests) — next task
- Request responses / comments (sellers respond publicly)
- Push notifications when new request matches seller's category
- Search within requests
