# Landing Page, Farmer Profile & Healthcheck — Design

Date: 2026-05-28

## Scope

Three independent features replacing the previous cart/wishlist scope:

1. **Landing page** — home page at `/` with search hero + random product listings
2. **Farmer public profile** — public page at `/farmers/:id`
3. **Healthcheck** — `GET /health` endpoint

Cart removed from MVP scope. Chat/messaging deferred to next iteration.

---

## 1. Landing Page (`/`)

### What it replaces
Currently `/` redirects to `/catalog`. The redirect is removed; the route renders the landing page.

### Layout (approved in visual brainstorming)
- **Navbar** — standalone (not AppLayout): logo (dark variant) on left; "Увійти" + "Реєстрація" buttons on right when logged out; user name + logout when authenticated.
- **Hero** — green gradient background; headline; centered search input + "Знайти" button; quick-filter category chips below.
- **"Нові оголошення" strip** — up to 8 random active products; "Всі товари →" link to `/catalog`.

### Navigation targets
| Interaction | Destination |
|---|---|
| Search submit | `/catalog?search=<query>` |
| Category chip | `/catalog?category=<slug>` |
| "Всі товари →" | `/catalog` |
| Product card click | `/products/:id` |
| "Увійти" | `/login` |
| "Реєстрація" | `/signup` |

### API change — products controller
Add optional query params to `GET /api/v1/products`:
- `limit` (number) — cap result count
- `random` (boolean) — `ORDER BY RANDOM()` instead of `created_at DESC`

Landing page fetches `?limit=8&random=true`. Existing catalog uses neither (no regression).

### Logo change
`Logo` component gains `variant?: 'light' | 'dark'` (default: `'light'`). Dark variant: SVG fill/stroke adjusted for green-on-white, text uses `text-gray-900` / `text-green-700`. Used in landing navbar and AppLayout (currently invisible on white bg — this also fixes that).

### New files
- `apps/web/src/features/landing/landing-page.tsx`
- `apps/web/src/features/landing/use-featured-products.ts`

### Modified files
- `apps/web/src/routes/index.tsx` — render `LandingPage` (remove redirect)
- `apps/web/src/features/auth/logo.tsx` — add `variant` prop
- `apps/web/src/features/layout/app-layout.tsx` — pass `variant="dark"` to Logo
- `apps/api/app/controllers/products_controller.ts` — add `limit` + `random` params

---

## 2. Farmer Public Profile (`/farmers/:id`)

### Goal
A buyer clicking a seller's name on a product page lands on that farmer's public profile.

### Layout
- **Header card**: farm name (bold), full name, "Учасник з <date>" 
- **Products grid**: all active products by this seller — reuses existing `ProductCard` component.
- 404 page if user not found or `isSeller=false`.

### API — new endpoint
`GET /api/v1/farmers/:id`

Response:
```json
{
  "id": 1,
  "fullName": "Іван Петренко",
  "farmName": "Ферма Петренко",
  "memberSince": "2026-01-15T00:00:00.000Z",
  "products": [ /* same shape as ProductTransformer */ ]
}
```

- Returns 404 if user doesn't exist or `isSeller=false`.
- Products filtered: `status = active`, ordered by `created_at DESC`.
- No auth required.

### New files (API)
- `apps/api/app/controllers/farmers_controller.ts`

### Modified files (API)
- `apps/api/start/routes.ts` — add `GET /api/v1/farmers/:id`

### New files (Web)
- `apps/web/src/features/farmers/farmer-profile-page.tsx`
- `apps/web/src/features/farmers/use-farmer.ts`
- `apps/web/src/features/farmers/api.ts`
- `apps/web/src/routes/farmers/$id.tsx`

### Modified files (Web)
- `apps/web/src/features/catalog/product-page.tsx` — wrap seller name in `<Link to="/farmers/$id">`

---

## 3. Healthcheck (`GET /health`)

### Goal
Simple liveness + readiness endpoint for uptime monitoring and future Docker/k8s probes.

### Endpoint
`GET /health` — outside `/api/v1` prefix.

### Response — healthy (HTTP 200)
```json
{ "status": "ok", "db": "ok", "timestamp": "2026-05-28T07:00:00.000Z" }
```

### Response — degraded (HTTP 503)
```json
{ "status": "degraded", "db": "error", "timestamp": "2026-05-28T07:00:00.000Z" }
```

DB check: execute `SELECT 1` via Lucid raw query. Catches connection errors. Does not require auth.

### New files
- `apps/api/app/controllers/health_controller.ts`

### Modified files
- `apps/api/start/routes.ts` — add `GET /health`

---

## Out of scope
- Cart / wishlist
- Chat / messaging (next iteration)
- Region/oblast filter
- Farmer description field (no migration needed; farmName + fullName sufficient for MVP profile)
