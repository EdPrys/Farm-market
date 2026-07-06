# Privacy Policy & Terms Pages — Design

## Context

Farm Market collects real personal data (names, emails, phone numbers, Telegram/Viber handles, farm locations/descriptions/photos, buyer-request content, chat messages, review text) but publishes no Privacy Policy or Terms of Service anywhere. This is the first item of the phase-1 soft-launch punch list (see project memory `project_launch_plan.md`): a pilot of real users must have basic legal disclosure before onboarding, independent of pilot size.

Scope for this pass is deliberately minimal, per user decision during brainstorming:
- No signup-form changes, no consent checkbox, no new database columns. Publishing the two pages with visible links is sufficient for the pilot.
- No cookie-consent banner: the app uses no analytics/tracking scripts (verified — no `gtag`/`analytics`/`hotjar`/pixel references anywhere in `apps/web`), and auth uses a Bearer token in `localStorage`, not cookies.

## Data Inventory (verified against `apps/api/database/schema.ts` and models)

- **Users**: `fullName`, `email`, `phone`, `telegram`, `viber`, `farmName`, `isSeller`
- **Farms**: `name`, `location`, `description`, `instagram`, cover/photo images (stored via B2/S3 per `apps/api/app/services/storage_service.ts`)
- **Buyer requests**: `title`, `description`, `location`, `budget`, `quantity`, `unit`
- **Messages**: `text` (chat between buyer and seller)
- **Farm reviews**: `rating`, `text`
- **Auth**: Bearer access token stored in browser `localStorage` (`apps/web/src/shared/auth/auth-context.tsx`), not cookies
- **No analytics/tracking** of any kind is present in the codebase

## Data Controller

Individual entrepreneur (ФОП): Едуард Приступа, contact `eduard.prystupa@gmail.com`. This is the contact point for data-subject requests (access/deletion) and general legal inquiries, published in both documents.

## Pages

Two new public (unauthenticated-accessible) routes, following existing static-content route conventions in `apps/web/src/routes`:

- `apps/web/src/routes/privacy.tsx` → rendered at `/privacy`
- `apps/web/src/routes/terms.tsx` → rendered at `/terms`

Both are plain content pages (no data fetching, no auth guard) — same pattern as other simple routes in the app, styled consistently with the rest of the site (Tailwind, same container/typography conventions as e.g. the farm profile or product detail pages).

### Privacy Policy content (`/privacy`)

1. Who operates the platform and how to contact them about data (ФОП Едуард Приступа, email above)
2. What data is collected and why — the Data Inventory list above, framed around the one purpose: connecting buyers and sellers directly
3. Where data is stored — PostgreSQL database; images via B2/S3 object storage
4. Session/auth storage — Bearer token in browser `localStorage`; explicitly note the app sets no tracking cookies and uses no analytics
5. No data is sold or shared with third parties beyond what's needed to operate the service (e.g., the storage/email providers already in use)
6. User rights — request access to or deletion of your data by emailing the contact address
7. Retention — data is kept while the account is active; deleted on request

### Terms of Service content (`/terms`)

1. What the platform is — a bulletin-board style listing/contact service; the platform is not a party to any sale, does not process payments, and is not responsible for the quality, delivery, or payment of goods exchanged between buyers and sellers
2. User responsibilities — accurate listing/profile information, no spam/fraud/abusive content in chat, requests, listings, or reviews
3. Platform's right to remove content or suspend/terminate accounts that violate these terms
4. Limitation of liability — the platform is provided "as is," no warranty on farmer claims or product quality
5. Governing law — laws of Ukraine

## Linking / Placement

- **`AppLayout`** (`apps/web/src/shared/layout/app-layout.tsx`): add a small footer below `<main>` with two links, `Політика конфіденційності` → `/privacy` and `Умови використання` → `/terms`. This layout wraps catalog, farms, chat, profile, seller pages — i.e., most of the logged-in experience.
- **`AuthLayout`** (`apps/web/src/shared/auth/auth-layout.tsx`): add the same two links as a small text line below the form content (`children`), since this is the layout used by login/signup/forgot-password/reset-password — the exact place new users are before they ever see `AppLayout`.

No changes to the signup form, validators, or backend.

## Testing

Frontend-only, no backend changes:
- Route-level render test for `/privacy` and `/terms` confirming the page mounts and renders its content
- A render test on `AppLayout` and `AuthLayout` (or an existing test file covering them) confirming the footer/link line renders both links pointing to `/privacy` and `/terms`

Run `pnpm --filter web typecheck` and `pnpm --filter web lint` as final verification; no `apps/api` changes means no backend test/typecheck run is needed for this task.

## Out of Scope

- No consent checkbox or signup-flow changes
- No cookie-consent banner (no cookies/tracking exist to disclose)
- No database schema changes (no consent-tracking column)
- No legal review by an actual lawyer — this is a good-faith minimal disclosure for a small pilot, not a substitute for professional legal advice
