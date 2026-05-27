# Auth Pages Redesign

## Goal

Redesign login, signup, and dashboard pages with a split-panel layout and Farm Market brand identity.

## Design

**Layout:** Split screen — left branding panel (green gradient) + right form panel (white). Full viewport height. Responsive: panels stack vertically on mobile (branding collapses to a compact header).

**Logo:** SVG leaf icon + wordmark. "Farm" in bold white, "MARKET" in small caps below in light green (`#86efac`). Used on all auth pages in the top-left of the left panel.

**Color palette:**
- Left panel gradient: `#14532d` → `#15803d` → `#16a34a`
- Primary button / links: `#15803d`
- Input border (default): `#e5e7eb`
- Input border (focus): `#16a34a`
- Muted text: `#6b7280`

**Left panel content (all auth pages):**
- Logo top-left
- Tagline center: "Свіжі продукти від місцевих фермерів" + subtitle "Приєднуйтесь до спільноти здорового харчування"
- Three decorative dots bottom-left

**Login page (`/login`):**
- Title: "Вхід", subtitle: "Раді вас бачити знову"
- Fields: Email, Пароль
- "Забули пароль?" link (right-aligned, non-functional for now)
- Primary button: "Увійти"
- Link: "Немає акаунту? Зареєструватись" → `/signup`

**Signup page (`/signup`):**
- Title: "Реєстрація", subtitle: "Створіть свій акаунт"
- Fields: Повне ім'я (optional), Email, Пароль, Підтвердження пароля
- Primary button: "Зареєструватись"
- Link: "Вже є акаунт? Увійти" → `/login`

**Dashboard page (`/dashboard`):**
- Same split layout. Left panel identical.
- Right panel: greeting card with user name/email, "Вийти" button (outline style).

## Components

All pages use existing `@farm-market/ui` components (Button, Card, Input, Label). The SVG logo is extracted to `features/auth/logo.tsx` and reused across all three pages. No new shadcn components needed.

## Files

- Create: `apps/web/src/features/auth/logo.tsx` — SVG leaf + wordmark component
- Modify: `apps/web/src/features/auth/login-page.tsx`
- Modify: `apps/web/src/features/auth/signup-page.tsx`
- Modify: `apps/web/src/features/auth/dashboard-page.tsx`
