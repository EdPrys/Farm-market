# Mobile-Responsive Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the three screens with real mobile breakage (global nav, catalog page, product detail page) usable on a narrow viewport, following the app's existing mobile-first Tailwind convention, and visually confirm the fix with real screenshots rather than typecheck alone.

**Architecture:** Pure Tailwind class changes in three existing files — no new components, no new dependencies in the app itself. A local `useState` toggle drives a mobile nav panel in `AppLayout`; the catalog sidebar becomes a horizontal scrollable chip row below `md`; the product page switches from a fixed side-by-side layout to a mobile-first stack. A final task drives a temporary, ephemeral-installed Playwright browser against the real dev servers (web + API + seeded dev data) to capture screenshots at a 375px viewport, which the controller reviews visually before sign-off.

**Tech Stack:** React + TanStack Router, Tailwind CSS v4 (mobile-first: base classes = smallest viewport, `sm:`/`md:`/`lg:` widen).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-07-mobile-responsive-pass-design.md`
- Follow the codebase's existing mobile-first responsive convention exactly as used in `apps/web/src/routes/farms/-farms-page.tsx` and `apps/web/src/routes/farmers/$id/-farmer-profile-page.tsx` (e.g. `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, `flex flex-col sm:flex-row`) — do not invent a different breakpoint scheme.
- No new shared UI component (menu/sheet/drawer) added to `packages/ui` — the burger menu is a local, one-off toggle in `app-layout.tsx`.
- Do not touch `requests-list.tsx`, chat pages, or `profile-page.tsx` structurally — they are verify-only per the spec; only report what the screenshots show, don't fix preemptively.
- No changes to desktop/`md:`-and-above layouts beyond the exact grid-column breakpoints specified in each task below.
- Do not commit. Make the changes and report back — the user reviews and commits manually.
- This codebase has no component-render test tooling (`@testing-library/react` is not installed) — verify via `pnpm --filter web typecheck` and `pnpm --filter web lint`, not new test files.
- Known dev-seed credentials exist in `apps/api/database/seeders/product_seeder.ts`: email `maria@test.com`, password `password123` (a seller account). Use this account for any authenticated verification — do not create new throwaway users.
- This repo's fresh worktrees need a one-time AdonisJS codegen step before `apps/api` typechecks or runs: copy `apps/api/.env` from the main checkout, then run `node ace serve` briefly once to generate `.adonisjs/client/registry/{schema,tree,index}` — this was discovered and solved during the privacy/terms pages task; do not rediscover it.

---

### Task 1: Mobile nav menu in `AppLayout`

**Files:**
- Modify: `apps/web/src/shared/layout/app-layout.tsx` (full rewrite of the component body)

**Interfaces:**
- No change to `AppLayout`'s public interface (`{ children: ReactNode }` prop, named export `AppLayout`) — every route that imports it keeps working unchanged.

- [ ] **Step 1: Rewrite `app-layout.tsx` with a mobile menu toggle**

Current file (`apps/web/src/shared/layout/app-layout.tsx`) in full:

```tsx
import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Logo } from '../auth/logo'
import { useCurrentUser } from '../auth/use-current-user'
import { useLogout } from '../auth/use-logout'
import { useCartStore } from '@/shared/cart/use-cart'
import { useUnreadCount } from '@/routes/chat/use-unread-count'

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const cartCount = useCartStore((state) => state.items.length)
  const { data: unread } = useUnreadCount()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/">
            <Logo variant="dark" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              to="/catalog"
              className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
            >
              Каталог
            </Link>
            <Link
              to="/farms"
              className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
            >
              Ферми
            </Link>
            {user?.isSeller && (
              <Link
                to="/seller/products"
                className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
              >
                Мої товари
              </Link>
            )}
            {user?.isSeller && (
              <Link
                to="/seller/farm"
                className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
              >
                Моя ферма
              </Link>
            )}
            {user && (
              <>
                <Link
                  to="/cart"
                  className="relative text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
                >
                  Кошик
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-green-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/chat"
                  className="relative text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
                >
                  Повідомлення
                  {!!unread?.count && unread.count > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {unread.count > 9 ? '9+' : unread.count}
                    </span>
                  )}
                </Link>
                <Link
                  to={user.isSeller ? '/seller/profile' : '/profile'}
                  className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
                >
                  Профіль
                </Link>
                <button
                  onClick={() => void logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })}
                  className="text-gray-700 hover:text-red-600"
                >
                  Вийти
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-center gap-6 text-xs text-gray-500">
          <Link to="/privacy" className="hover:text-green-700">
            Політика конфіденційності
          </Link>
          <Link to="/terms" className="hover:text-green-700">
            Умови використання
          </Link>
        </div>
      </footer>
    </div>
  )
}
```

Replace it with:

```tsx
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Logo } from '../auth/logo'
import { useCurrentUser } from '../auth/use-current-user'
import { useLogout } from '../auth/use-logout'
import { useCartStore } from '@/shared/cart/use-cart'
import { useUnreadCount } from '@/routes/chat/use-unread-count'

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const cartCount = useCartStore((state) => state.items.length)
  const { data: unread } = useUnreadCount()
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = 'text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold'

  const navLinks = (
    <>
      <Link to="/catalog" className={linkClass} onClick={() => setMenuOpen(false)}>
        Каталог
      </Link>
      <Link to="/farms" className={linkClass} onClick={() => setMenuOpen(false)}>
        Ферми
      </Link>
      {user?.isSeller && (
        <Link to="/seller/products" className={linkClass} onClick={() => setMenuOpen(false)}>
          Мої товари
        </Link>
      )}
      {user?.isSeller && (
        <Link to="/seller/farm" className={linkClass} onClick={() => setMenuOpen(false)}>
          Моя ферма
        </Link>
      )}
      {user && (
        <>
          <Link to="/cart" className={`relative ${linkClass}`} onClick={() => setMenuOpen(false)}>
            Кошик
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-green-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          <Link to="/chat" className={`relative ${linkClass}`} onClick={() => setMenuOpen(false)}>
            Повідомлення
            {!!unread?.count && unread.count > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {unread.count > 9 ? '9+' : unread.count}
              </span>
            )}
          </Link>
          <Link
            to={user.isSeller ? '/seller/profile' : '/profile'}
            className={linkClass}
            onClick={() => setMenuOpen(false)}
          >
            Профіль
          </Link>
          <button
            onClick={() => {
              setMenuOpen(false)
              void logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })
            }}
            className="text-left text-gray-700 hover:text-red-600"
          >
            Вийти
          </button>
        </>
      )}
    </>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/">
            <Logo variant="dark" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">{navLinks}</nav>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden text-2xl text-gray-700 leading-none"
            aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <nav className="md:hidden border-t px-4 py-3 flex flex-col gap-3 text-sm font-medium bg-white">
            {navLinks}
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-center gap-6 text-xs text-gray-500">
          <Link to="/privacy" className="hover:text-green-700">
            Політика конфіденційності
          </Link>
          <Link to="/terms" className="hover:text-green-700">
            Умови використання
          </Link>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `pnpm --filter web lint`
Expected: 0 errors (the 3 pre-existing `react-refresh/only-export-components` warnings in unrelated files are expected).

- [ ] **Step 4: Report**

Do NOT commit. Report back: confirmation the file matches the new content above, typecheck/lint results.

---

### Task 2: Catalog page — chip categories + responsive grid

**Files:**
- Modify: `apps/web/src/routes/catalog/-catalog-page.tsx`

**Interfaces:**
- No change to `CatalogPage`'s exports or the `handleCategoryClick`/`handleSearch`/`handleTabChange` handlers — only the JSX returned by the `tab === 'products'` branch changes.

- [ ] **Step 1: Replace the products-tab JSX**

In `apps/web/src/routes/catalog/-catalog-page.tsx`, current content from `{tab === 'products' ? (` through its matching `) : (`:

```tsx
      {tab === 'products' ? (
        <div className="flex gap-6">
          <aside className="w-44 shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Категорії
            </p>
            <ul className="flex flex-col gap-1">
              <li>
                <button
                  onClick={() => handleCategoryClick(undefined)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    !activeCategory
                      ? 'bg-green-100 text-green-800 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
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
      ) : (
```

Replace with:

```tsx
      {tab === 'products' ? (
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-44 md:shrink-0">
            <p className="hidden md:block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Категорії
            </p>
            <ul className="flex overflow-x-auto gap-2 pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
              <li className="shrink-0">
                <button
                  onClick={() => handleCategoryClick(undefined)}
                  className={`whitespace-nowrap md:whitespace-normal md:w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    !activeCategory
                      ? 'bg-green-100 text-green-800 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Всі
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id} className="shrink-0">
                  <button
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`whitespace-nowrap md:whitespace-normal md:w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
```

(The rest of the file — the `<RequestsList />` branch and closing tags — is unchanged.)

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `pnpm --filter web lint`
Expected: 0 errors (same 3 pre-existing warnings).

- [ ] **Step 4: Report**

Do NOT commit. Report back: confirmation of the diff, typecheck/lint results.

---

### Task 3: Product detail page — mobile stack layout

**Files:**
- Modify: `apps/web/src/routes/products/$id/-product-page.tsx`

**Interfaces:**
- No change to `ProductPage`'s exports or logic — only the two `className` values on the outer wrapper and the image container change.

- [ ] **Step 1: Update the layout classes**

In `apps/web/src/routes/products/$id/-product-page.tsx`, current:

```tsx
    <div className="max-w-4xl mx-auto px-4 py-8 flex gap-8">
      <div className="w-80 shrink-0">
```

Replace with:

```tsx
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-8">
      <div className="sm:w-80 sm:shrink-0">
```

(Nothing else in the file changes — the image `<div>`'s inner content, the details column, and everything below it stay exactly as they are.)

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `pnpm --filter web lint`
Expected: 0 errors (same 3 pre-existing warnings).

- [ ] **Step 4: Report**

Do NOT commit. Report back: confirmation of the two-line diff, typecheck/lint results.

---

### Task 4: Visual verification at a mobile viewport

**Files:** None created in the repo. A temporary Playwright install goes in a scratch directory outside the repo (e.g. via `mktemp -d`) — never added to `apps/web/package.json` or the root `package.json`.

**Interfaces:**
- Consumes: the three screens changed in Tasks 1-3, plus the four verify-only screens named in the spec (`requests-list.tsx`, `chat/index.tsx`, `chat/$id.tsx`, `profile-page.tsx`) — this task does not modify any of them.

- [ ] **Step 1: Ensure backing services are running**

From the repo root:

```bash
pnpm docker:up
```

Expected: postgres, redis, and mailpit containers are up (or already were).

- [ ] **Step 2: Prepare the API dev server**

```bash
cd apps/api
cp -n /Users/admin/projects/farm-market/apps/api/.env .env || true
ls .adonisjs/client/registry/schema.d.ts 2>/dev/null || (node ace serve > /tmp/ace-boot.log 2>&1 & sleep 8; pkill -f "ace serve"; pkill -f "bin/server")
node ace migration:run
```

Expected: migrations report "Already up to date" or apply cleanly; `.adonisjs/client/registry/schema.d.ts` exists afterward.

- [ ] **Step 3: Start both dev servers in the background**

```bash
cd apps/api && (node ace serve > /tmp/api-dev.log 2>&1 &) && cd ../web && (pnpm dev > /tmp/web-dev.log 2>&1 &)
sleep 5
grep -o "Local:.*" /tmp/web-dev.log
```

Expected: a `Local: http://localhost:####` line — note the exact port (Vite may pick 5174 etc. if 5173 is busy). Use that port for every URL below.

- [ ] **Step 4: Check whether catalog has seed data, seed if empty**

With the API port also noted from `/tmp/api-dev.log` (look for "started HTTP server" and the configured port, default 3333):

```bash
curl -s http://localhost:3333/api/v1/products | head -c 300
```

Expected: a JSON body with a non-empty `data` array. If `data` is empty (`"data":[]`), run:

```bash
cd apps/api && node ace db:seed
```

Expected: seeders run once. Do NOT run `db:seed` if data already exists — the seeders use `multiInsert` with fixed emails and will fail on a unique-constraint violation on a second run.

- [ ] **Step 5: Install a throwaway Playwright in a scratch directory**

```bash
PWDIR=$(mktemp -d)
cd "$PWDIR" && npm init -y >/dev/null && npm install playwright >/dev/null && npx playwright install --with-deps chromium
echo "$PWDIR" > /tmp/pw-scratch-dir.txt
```

Expected: chromium installs without error. This directory and its `node_modules` are never created inside the farm-market repo.

- [ ] **Step 6: Write and run the screenshot script**

Create `$(cat /tmp/pw-scratch-dir.txt)/shoot.mjs` (replace `WEB_PORT` with the port from Step 3):

```js
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const WEB = 'http://localhost:WEB_PORT'
const OUT = process.env.SHOT_DIR
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 800 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

// 1. Catalog, logged out, nav closed
await page.goto(`${WEB}/catalog`)
await page.waitForSelector('text=Товари')
await shot('01-catalog-logged-out-nav-closed')

// 2. Catalog, logged out, burger menu open
await page.click('button[aria-label="Відкрити меню"]')
await shot('02-catalog-logged-out-nav-open')
await page.click('button[aria-label="Закрити меню"]')

// 3. Requests tab, logged out (LoginPrompt)
await page.goto(`${WEB}/catalog?tab=requests`)
await page.waitForSelector('text=Увійдіть в акаунт')
await shot('03-requests-logged-out')

// 4. Product detail (click first product card)
await page.goto(`${WEB}/catalog`)
await page.waitForSelector('a[href^="/products/"]')
await page.click('a[href^="/products/"]')
await page.waitForSelector('text=₴')
await shot('04-product-detail')

// 5. Log in as seeded seller
await page.goto(`${WEB}/login`)
await page.fill('#email', 'maria@test.com')
await page.fill('#password', 'password123')
await page.click('button[type="submit"]')
await page.waitForSelector('text=Вийти', { timeout: 15000 })

// 6. Catalog, logged in, nav open (full 7-link menu)
await page.goto(`${WEB}/catalog`)
await page.click('button[aria-label="Відкрити меню"]')
await shot('05-catalog-logged-in-nav-open')
await page.click('button[aria-label="Закрити меню"]')

// 7. Requests tab, logged in (real list)
await page.goto(`${WEB}/catalog?tab=requests`)
await shot('06-requests-logged-in')

// 8. Profile page
await page.goto(`${WEB}/profile`)
await shot('07-profile')

// 9. Chat list
await page.goto(`${WEB}/chat`)
await shot('08-chat-list')

await browser.close()

if (errors.length) {
  console.log('CONSOLE_ERRORS:', JSON.stringify(errors))
} else {
  console.log('NO_CONSOLE_ERRORS')
}
```

Run it:

```bash
mkdir -p /Users/admin/projects/farm-market/.superpowers/sdd/screenshots
SHOT_DIR=/Users/admin/projects/farm-market/.superpowers/sdd/screenshots node "$(cat /tmp/pw-scratch-dir.txt)/shoot.mjs"
```

Expected: 8 PNG files land in `.superpowers/sdd/screenshots/`, and the script prints either `NO_CONSOLE_ERRORS` or a `CONSOLE_ERRORS:` line listing what broke.

If any step in the script throws (e.g. a selector times out), that is a real finding — report exactly which screenshot failed and the error text, don't retry with a longer timeout and silently move on.

- [ ] **Step 7: Stop the dev servers**

```bash
pkill -f "ace serve"; pkill -f "bin/server"; pkill -f "vite"
```

- [ ] **Step 8: Report**

Do NOT commit (there is nothing to commit — screenshots are scratch artifacts, not part of the diff). Report back:
- The full list of 8 screenshot paths under `.superpowers/sdd/screenshots/`
- The script's `NO_CONSOLE_ERRORS` / `CONSOLE_ERRORS:` output
- `pnpm --filter web typecheck` and `pnpm --filter web lint` results (final confirmation across all three tasks' changes together)
- Anything the screenshots visually suggest is still broken, in the three changed screens or the four verify-only ones — do not fix it, just report it precisely (which screenshot, what looks wrong)
- If Step 5 (Playwright install) fails in the sandbox and cannot be worked around, state that explicitly and stop — do not fabricate screenshots or skip silently. Report exactly what was tried and what failed, so the controller can decide whether to hand visual verification to the human instead.
