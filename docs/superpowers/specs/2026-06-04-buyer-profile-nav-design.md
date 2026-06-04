# Buyer Profile & Navbar Auth-Gated Links

**Date:** 2026-06-04  
**Status:** Approved

## Summary

Add three nav items between "Каталог" and "Вийти" that are only visible to logged-in users: "Мої товари" (sellers only), "Кошик" (all logged-in, disabled placeholder), and "Профіль" (all logged-in). Sellers and buyers route to different profile pages. A new buyer profile page allows editing name and registering as a seller.

## Navbar Changes

File: `apps/web/src/shared/layout/app-layout.tsx`

| Item | Visibility | Route |
|---|---|---|
| Каталог | always | `/catalog` |
| Мої товари | `user?.isSeller` | `/seller/products` |
| Кошик | `!!user` | — (disabled button, placeholder) |
| Профіль | `!!user` | `isSeller` → `/seller/profile`, else → `/profile` |
| Вийти | `!!user` | — |

The existing `user?.isSeller` block for "Мої товари" and "Профіль" is replaced. "Кошик" moves inside the `!!user` condition.

## Buyer Profile Page

**Route:** `/profile`  
**Files:** `apps/web/src/routes/profile/route.tsx`, `apps/web/src/routes/profile/-profile-page.tsx`  
**Guard:** requires `!!user`; if not logged in, redirect to `/login`

### Sections

**1. Особиста інформація**
- Field: `fullName` (text input, pre-filled from current user)
- Button: "Зберегти"
- API: `PATCH /api/v1/account/profile` with `{ fullName }`
- On success: invalidate `['user']` query

**2. Стати продавцем** (shown only when `!user.isSeller`)
- Field: `farmName` (text input, required — назва господарства)
- Button: "Зареєструватись як продавець"
- API: `PATCH /api/v1/account/profile` with `{ isSeller: true, farmName }`
- On success: invalidate `['user']` query → nav auto-updates (shows "Мої товари", Профіль routes to `/seller/profile`)
- Action is irreversible (no "unbecome seller" flow)

## Backend Changes

### New endpoint: `PATCH /api/v1/account/profile`

Requires auth middleware. Accepts:

```ts
// update name
{ fullName: string }

// become seller
{ isSeller: true, farmName: string }
```

Validation rules:
- `fullName`: optional string, trimmed, nullable
- `isSeller`: must be `true` if present (no downgrade)
- `farmName`: required when `isSeller: true`, non-empty string

Returns: updated `User` object (same shape as `/api/v1/account/profile` GET).

### Controller change

`apps/api/app/controllers/account/profile_controller.ts` (existing file)

- Add `update` method alongside existing `show`
- Route: `router.patch('profile', [controllers.account.Profile, 'update'])` inside the `account` group

### Validator

`apps/api/app/validators/account.ts` (new file)

Zod schema covering both update scenarios.

## Data Flow

```
Buyer fills fullName → PATCH /account/profile → user query invalidated → UI reflects new name
Buyer submits farmName → PATCH /account/profile { isSeller: true, farmName } → user query invalidated
  → isSeller becomes true → navbar shows "Мої товари" → Профіль routes to /seller/profile
```

## Out of Scope

- Cart implementation (Кошик stays disabled)
- Email change
- Password change
- Seller role removal
