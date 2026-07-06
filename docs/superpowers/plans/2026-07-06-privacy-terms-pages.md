# Privacy & Terms Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a Privacy Policy and Terms of Service page and link them from the two layouts real users pass through (the logged-in app shell and the login/signup shell), so the phase-1 soft-launch pilot has basic legal disclosure.

**Architecture:** Two new static content components under `apps/web/src/features/legal/`, each mounted at its own TanStack Router file route (`/privacy`, `/terms`) wrapped in the existing `AppLayout`. A small footer with links to both pages is added to `AppLayout` (covers catalog/farms/chat/profile/seller pages) and to `AuthLayout` (covers login/signup/forgot-password/reset-password) — no other routes, forms, or backend code change.

**Tech Stack:** React + TanStack Router (file-based routing, auto-generated `routeTree.gen.ts`), Tailwind CSS v4.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-06-privacy-terms-pages-design.md`
- No signup-form changes, no consent checkbox, no new database columns or backend changes (per spec's "Out of Scope").
- No cookie-consent banner — the app has no analytics/tracking scripts and auth uses a `localStorage` Bearer token, not cookies; the Privacy Policy text must say this explicitly.
- Data controller in both pages' text: ФОП Едуард Приступа, contact `eduard.prystupa@gmail.com`.
- Do not commit. Make the changes and report back — the user reviews and commits manually.
- This codebase has no component-render test tooling (`@testing-library/react` is not installed; existing `apps/web` tests only cover API/hook logic, e.g. `apps/web/src/routes/catalog/__tests__/api.test.ts`). Do not add a new test dependency for two static-content pages — verify via `pnpm --filter web typecheck` (which type-checks every `<Link to="...">` against the generated route tree), `pnpm --filter web lint`, and a manual browser smoke test instead.

---

### Task 1: Privacy and Terms content pages + routes

**Files:**
- Create: `apps/web/src/features/legal/privacy-page.tsx`
- Create: `apps/web/src/features/legal/terms-page.tsx`
- Create: `apps/web/src/routes/privacy.tsx`
- Create: `apps/web/src/routes/terms.tsx`
- Modify (auto-generated): `apps/web/src/routeTree.gen.ts`

**Interfaces:**
- Produces: `PrivacyPage` (named export, no props) from `@/features/legal/privacy-page`, `TermsPage` (named export, no props) from `@/features/legal/terms-page` — Task 2 does not consume these directly, but must know the routes `/privacy` and `/terms` exist for its `<Link>` additions.

- [ ] **Step 1: Create the Privacy Policy content component**

Create `apps/web/src/features/legal/privacy-page.tsx`:

```tsx
export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Політика конфіденційності</h1>
      <p className="text-sm text-gray-500">Останнє оновлення: 6 липня 2026</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Хто ми</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Farm Market — сервіс, що з'єднує покупців і фермерів напряму, без комісії та участі
          платформи в оплаті чи доставці. Оператором персональних даних є ФОП Едуард Приступа.
          З питань щодо ваших даних пишіть на{' '}
          <a href="mailto:eduard.prystupa@gmail.com" className="text-green-700 underline">
            eduard.prystupa@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Які дані ми збираємо</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 leading-relaxed flex flex-col gap-1">
          <li>Дані акаунту: ім'я, email, телефон, Telegram, Viber, назва ферми</li>
          <li>Дані ферми: назва, розташування, опис, Instagram, фото</li>
          <li>Запити покупців: назва, опис, кількість, бюджет, локація</li>
          <li>Повідомлення в чаті між покупцем і продавцем</li>
          <li>Відгуки про ферми: оцінка й текст</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Навіщо ми їх збираємо</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Виключно для того, щоб покупці й фермери могли знайти одне одного та домовитись
          напряму. Ми не використовуємо ваші дані для реклами і не передаємо їх третім особам,
          окрім сервісів, технічно необхідних для роботи платформи (зберігання фото, email-розсилка).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Де і як зберігаються дані</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Дані акаунтів та оголошень зберігаються в базі даних PostgreSQL. Фотографії ферм — в
          об'єктному сховищі (B2/S3). Після входу токен доступу зберігається в localStorage
          вашого браузера. Ми не використовуємо cookies для аналітики чи реклами — на сайті
          взагалі немає систем аналітики чи трекінгу.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Ваші права</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Ви можете попросити переглянути або видалити всі свої дані, написавши на{' '}
          <a href="mailto:eduard.prystupa@gmail.com" className="text-green-700 underline">
            eduard.prystupa@gmail.com
          </a>
          . Дані зберігаються, поки ваш акаунт активний, і видаляються за запитом.
        </p>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Create the Terms of Service content component**

Create `apps/web/src/features/legal/terms-page.tsx`:

```tsx
export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Умови використання</h1>
      <p className="text-sm text-gray-500">Останнє оновлення: 6 липня 2026</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Що таке Farm Market</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Farm Market — це дошка оголошень, яка з'єднує покупців і фермерів. Платформа не є
          стороною угоди між покупцем і продавцем, не обробляє оплату і не відповідає за
          якість, кількість чи доставку товару. Усі домовленості — напряму між користувачами.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Ваші зобов'язання</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 leading-relaxed flex flex-col gap-1">
          <li>Вказувати достовірну інформацію в профілі, оголошеннях і запитах</li>
          <li>Не публікувати спам, шахрайський чи образливий контент</li>
          <li>Спілкуватись у чаті шанобливо, без зловживань</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Модерація</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Ми можемо видалити оголошення, відгук чи заблокувати акаунт, який порушує ці умови.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Обмеження відповідальності</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Сервіс надається "як є". Ми не гарантуємо якість товарів чи достовірність тверджень
          фермерів і не несемо відповідальності за наслідки угод між користувачами.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Застосовне право</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Ці умови регулюються законодавством України.
        </p>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Create the `/privacy` route**

Create `apps/web/src/routes/privacy.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPage } from '@/features/legal/privacy-page'
import { AppLayout } from '@/shared/layout/app-layout'

export const Route = createFileRoute('/privacy')({
  component: () => (
    <AppLayout>
      <PrivacyPage />
    </AppLayout>
  ),
})
```

- [ ] **Step 4: Create the `/terms` route**

Create `apps/web/src/routes/terms.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { TermsPage } from '@/features/legal/terms-page'
import { AppLayout } from '@/shared/layout/app-layout'

export const Route = createFileRoute('/terms')({
  component: () => (
    <AppLayout>
      <TermsPage />
    </AppLayout>
  ),
})
```

- [ ] **Step 5: Regenerate the route tree**

Start the dev server briefly to trigger the TanStack Router Vite plugin:

```bash
cd apps/web && timeout 15 pnpm dev 2>&1 | grep -E "Generated|error" || true
```

Expected: "Generated route tree" in output. `/privacy` and `/terms` now appear in `apps/web/src/routeTree.gen.ts`.

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: PASS — no errors.

- [ ] **Step 7: Report**

Do NOT commit. Report back: files created, route-tree regeneration output, typecheck result.

---

### Task 2: Footer links in AppLayout and AuthLayout

**Files:**
- Modify: `apps/web/src/shared/layout/app-layout.tsx`
- Modify: `apps/web/src/shared/auth/auth-layout.tsx`

**Interfaces:**
- Consumes: routes `/privacy` and `/terms` produced by Task 1 — this task only compiles if those routes exist in `routeTree.gen.ts` (do not start Task 2 before Task 1's Step 5 has run).

- [ ] **Step 1: Add a footer to `AppLayout`**

Modify `apps/web/src/shared/layout/app-layout.tsx`. Current end of the file (from `<main>` to the closing tags):

```tsx
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

New (footer added after `<main>`):

```tsx
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

`Link` is already imported in this file (`import { Link, useNavigate } from '@tanstack/react-router'`) — no new import needed.

- [ ] **Step 2: Add the same links to `AuthLayout`**

Modify `apps/web/src/shared/auth/auth-layout.tsx`. Current import line and right-column block:

```tsx
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Logo } from './logo'
```

and

```tsx
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {children}
      </div>
    </div>
  )
}
```

New import line (add `Link` from the router):

```tsx
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Logo } from './logo'
```

New right-column block (links added below `{children}`):

```tsx
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {children}
        <div className="flex gap-4 mt-6 text-xs text-gray-400">
          <Link to="/privacy" className="hover:text-green-700">
            Політика конфіденційності
          </Link>
          <Link to="/terms" className="hover:text-green-700">
            Умови використання
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `pnpm --filter web typecheck`
Expected: PASS.

Run: `pnpm --filter web lint`
Expected: 0 errors (the 3 pre-existing `react-refresh/only-export-components` warnings in unrelated files are expected).

- [ ] **Step 4: Manual smoke test**

With `pnpm --filter web dev` running:
- Visit `/catalog` (or any `AppLayout` page) — confirm a footer with "Політика конфіденційності" and "Умови використання" appears at the bottom, and both links navigate correctly to `/privacy` and `/terms`.
- Visit `/login` or `/signup` — confirm the same two links appear below the form and navigate correctly.
- Visit `/privacy` and `/terms` directly — confirm the content renders and the page itself also shows the `AppLayout` nav/footer.

- [ ] **Step 5: Report**

Do NOT commit. Report back: diff summary, typecheck/lint results, manual smoke-test observations. The user reviews and commits manually.

---

### Task 3: Final verification

**Files:** None expected — this task verifies Tasks 1-2 left the app in a working state.

- [ ] **Step 1: Full frontend verification**

Run: `pnpm --filter web typecheck && pnpm --filter web lint`
Expected: PASS (only the 3 pre-existing unrelated warnings).

Run: `pnpm --filter web test -- --run`
Expected: PASS — this task added no new test files (per Global Constraints, no component-test tooling exists in this repo), so the existing suite should be unaffected.

- [ ] **Step 2: Report to the user**

Summarize what changed (2 new pages/routes, footer links in 2 layouts) and stop. Do not commit — the user reviews and commits/pushes manually per project convention.
