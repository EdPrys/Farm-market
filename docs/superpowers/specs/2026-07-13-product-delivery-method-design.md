# Product Delivery Method — Design

## Context

Farm Market currently has no notion of how a product reaches the buyer — delivery is arranged informally in chat. We want sellers to declare, per product, which delivery methods they support (like Rozetka's delivery badges), so buyers browsing the catalog can filter to products they can actually receive.

This is a prerequisite for a planned marketing push targeting farmer-influencers with existing nationwide audiences (e.g. TikTok sellers of rabbit meat, greens, ostrich eggs) — buyers won't be geographically constrained, so it must be clear upfront whether a product ships via a carrier or requires an in-person pickup.

**Constraints:**
- No external API integration (no Nova Poshta API calls) — this is a declarative tag on the listing, not a shipping/label system. Address/cost negotiation still happens in chat, unchanged.
- Existing products have no value for this field — must default gracefully, not block existing listings.

## Data Model

### `products` table (alter)

| Column | Type | Notes |
|---|---|---|
| delivery_methods | JSONB | array of strings, default `[]` |

Follows the same pattern as `farms.activities` (see `2026-06-08-farm-entity-design.md`): stored as JSONB, exposed on the model as a `string[]` via `prepare`/`consume`.

### Allowed values

Fixed enum, not free text:
- `nova_poshta` — Нова Пошта
- `ukrposhta` — Укрпошта
- `pickup` — Особиста зустріч / самовивіз

## Shared Schema (`packages/shared/src/schemas/product.ts`)

```ts
export const deliveryMethod = z.enum(['nova_poshta', 'ukrposhta', 'pickup'])

// added to createProductSchema:
deliveryMethods: z.array(deliveryMethod).optional(),
```

`updateProductSchema` inherits it automatically (`createProductSchema.partial()`). Optional, not required — existing products keep `[]` until the seller edits them.

## API

- `Product` model: new `@column({ prepare, consume })` field `deliveryMethods: string[]`, mirroring `Farm.activities`.
- Migration: `alterTable('products')` adding `delivery_methods` jsonb, default `'[]'`; `down()` drops the column. Regenerate `database/schema.ts` via `node ace migration:run`.
- `product_transformer.ts` (list/card) and `products_controller.ts#show` (detail): include `deliveryMethods` in the response object.
- `products_controller.ts#index`: accept optional `deliveryMethod` query param (single value); when present, filter with `query.whereRaw('delivery_methods @> ?', [JSON.stringify([value])])`.

## Frontend

### Types
- `apps/web/src/routes/catalog/types.ts` (`Product`): add `deliveryMethods: string[]`.
- `apps/web/src/routes/seller/products/api.ts` (`ProductInput`): add `deliveryMethods: string[]`.

### Seller form (`seller/products/-product-form.tsx`)
- New constant `DELIVERY_METHODS` (value + Ukrainian label), mirroring `PRESET_ACTIVITIES` in `-seller-farm-page.tsx`.
- `useState<string[]>` initialized from the product being edited (or `[]` for new).
- Toggle function identical in shape to `toggleActivity`.
- Rendered as pill/toggle buttons (same active/inactive styling as farm activities), included in the submit payload.

### Catalog filter (`catalog/route.tsx`, `-catalog-page.tsx`, `use-products.ts`, `api.ts`)
- Search schema: add optional `deliveryMethod: z.string().optional()` param.
- Filter UI: chip list mirroring the existing category `<aside>`/`<ul>` pattern, options are the fixed `DELIVERY_METHODS` list (client-side constant, not fetched).
- Clicking a chip navigates with `search: (prev) => ({ ...prev, deliveryMethod: value })`, matching `handleCategoryClick`.
- `use-products.ts` / `api.ts`: pass `deliveryMethod` through to the query string.

### Display
- Product detail page (`products/$id/-product-page.tsx`): pill tags for each selected delivery method, placed after the existing category badge.
- Product card (`catalog/-product-card.tsx`): small tag row under the price line, same visual treatment as farm activity pills on `-farm-card.tsx`.

## Out of Scope

- Nova Poshta API integration (branch lookup, cost calculation, waybill creation) — explicitly deferred; may be revisited later if manual chat-based coordination proves insufficient.
- Multi-value catalog filter (selecting more than one delivery method at once) — single-value filter only, matching the category filter's current behavior.

## Testing

- Functional test: creating/updating a product with `deliveryMethods` persists and round-trips correctly.
- Functional test: `GET /catalog/products?deliveryMethod=nova_poshta` returns only products whose `delivery_methods` array contains that value.
- Existing products (empty `delivery_methods`) still list normally when no filter is applied.
