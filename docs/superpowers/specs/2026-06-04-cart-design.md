# Cart Feature Design

**Date:** 2026-06-04  
**Status:** Approved

## Summary

Client-side shopping cart using Zustand with localStorage persistence. Buyers can add products from any sellers into one cart, adjust quantities, and remove items. No checkout or order flow in this iteration — the "Оформити" button is a disabled placeholder for a future feature.

## Architecture

Cart state lives entirely in the browser (Zustand `persist` middleware → `localStorage` key `farm-market-cart`). No backend changes required. The cart store is shared across all pages via a React hook.

## Cart State

**File:** `apps/web/src/shared/cart/use-cart.ts`

```ts
interface CartItem {
  productId: number
  name: string
  price: string      // decimal string, e.g. "18.00"
  unit: string       // e.g. "кг"
  quantity: number   // user-selected amount, min 1
  imagePath: string | null
  sellerName: string
  sellerId: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void  // adds 1 or increments existing
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void  // removes if quantity < 1
  clearCart: () => void
}
```

Persisted via Zustand `persist` middleware under `farm-market-cart`.

## Add to Cart Button

Appears on:
- **Catalog product card** (`apps/web/src/routes/catalog/-product-card.tsx`)
- **Product detail page** (`apps/web/src/routes/products/$id/-product-page.tsx`)

Button states:
- **Not in cart:** button "В кошик"
- **In cart:** inline quantity control `− {qty} +` with the current count

Only shown to authenticated users (`!!user`). Non-authenticated users see no cart controls (they can't see cart in navbar either).

## Navbar

Both nav headers updated:
- `apps/web/src/shared/layout/app-layout.tsx`
- `apps/web/src/features/landing/landing-page.tsx`

`Кошик` changes from a disabled `<button>` to a `<Link to="/cart">` with an item-count badge when `cartItems.length > 0`. Still shown only to authenticated users.

Badge: small green circle with count, positioned top-right of the link text.

## Cart Page `/cart`

**Files:**
- `apps/web/src/routes/cart/route.tsx` — auth guard (redirect to `/login` if not authenticated), wraps in `<AppLayout>`
- `apps/web/src/routes/cart/-cart-page.tsx` — page component

**Layout:**
- **Empty state:** "Кошик порожній" message + "Перейти до каталогу" link
- **Item list:** each row shows:
  - Product name + seller name (small, gray)
  - Price per unit + unit label
  - Quantity control: `−` button / count / `+` button
  - Line total: `price × quantity`
  - Remove button (×)
- **Summary section:**
  - Total item count
  - Total price (sum of all line totals)
  - "Оформити замовлення" button — `disabled`, tooltip "Скоро"

## Out of Scope

- Checkout / order creation
- Stock validation (no check against `product.quantity` in DB)
- Cart sync across devices
- Guest cart (non-authenticated users cannot add to cart)
- Cart expiry
