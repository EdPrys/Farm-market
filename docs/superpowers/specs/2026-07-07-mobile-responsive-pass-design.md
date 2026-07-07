# Mobile-Responsive Pass — Design

## Context

Phase-1 soft-launch item 2 (see project memory `project_launch_plan.md`): the app is largely desktop-first — as of the launch audit, only 5 of 57 route files used any Tailwind responsive prefix (`sm:`/`md:`/`lg:`/`xl:`). The pilot's real users (buyers and sellers in one town/raion) will mostly browse from a phone, so the screens they actually touch must not break on a narrow viewport.

## Scope

Real structural changes, verified during brainstorming to have actual breakage:
1. `apps/web/src/shared/layout/app-layout.tsx` — global nav (used by nearly every logged-in page)
2. `apps/web/src/routes/catalog/-catalog-page.tsx` — category sidebar + product grid
3. `apps/web/src/routes/products/$id/-product-page.tsx` — fixed-width image next to details

Verify-only (already largely stacked/flex-col, no fixed widths — confirmed by reading the code during brainstorming): `apps/web/src/routes/catalog/requests/-requests-list.tsx`, `apps/web/src/routes/chat/index.tsx`, `apps/web/src/routes/chat/$id.tsx`, `apps/web/src/routes/profile/-profile-page.tsx`. These get a manual/visual check at a narrow viewport during implementation; only touched if that check finds a real problem, not preemptively.

Existing responsive convention in this codebase (from `apps/web/src/routes/farms/-farms-page.tsx` and `apps/web/src/routes/farmers/$id/-farmer-profile-page.tsx`, both already responsive): mobile-first Tailwind, base classes target the smallest viewport, `sm:`/`md:`/`lg:` prefixes widen the layout — e.g. `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, `flex flex-col sm:flex-row`. This pass follows the same convention rather than inventing a new one.

## Changes

### 1. Global navigation (`app-layout.tsx`)

The current `<nav>` is a single horizontal flex row with ~7 links plus a logout button — on a narrow viewport this overflows or wraps illegibly. Below `md` (768px) the horizontal nav is hidden (`hidden md:flex`) and replaced with a burger button (`☰`/`✕` toggle via local `useState`) that reveals the same links stacked vertically directly below the header. At `md:` and above, the existing horizontal nav renders unchanged and the burger button is hidden. No new dependency — no menu/sheet/dropdown primitive exists in `packages/ui` (checked: only `button`, `card`, `checkbox`, `input`, `label`), and a one-off toggle doesn't warrant adding one.

### 2. Catalog page (`-catalog-page.tsx`)

The category sidebar (`<aside className="w-44 shrink-0">`) is fixed-width and sits beside the product grid — on a narrow viewport this squeezes the grid unreadably. Below `md`, the sidebar's category list renders as a horizontal, scrollable row of chip buttons (`overflow-x-auto flex gap-2`) placed above the product grid instead of beside it; at `md:` and above, today's vertical sidebar layout is unchanged. The product grid changes from a flat `grid-cols-3` to `grid-cols-2 sm:grid-cols-2 md:grid-cols-3`, matching the exact breakpoint convention already used in `farms-page.tsx`.

### 3. Product detail page (`-product-page.tsx`)

The current `<div className="flex gap-8">` places a fixed `w-80` image next to the details column — on a narrow viewport the fixed width forces horizontal cramping. This becomes `flex flex-col sm:flex-row`, with the image container losing its fixed width below `sm` (full width, natural stacking) and regaining `sm:w-80` at `sm:` and above — the same pattern already used for the buyer/seller two-column block in `farmer-profile-page.tsx`.

## Testing

Same constraint as the privacy/terms pages task: this codebase has no component-render test tooling (`@testing-library/react` not installed), so verification is `pnpm --filter web typecheck` + `pnpm --filter web lint`, not new test files.

Unlike the privacy/terms task, a visual check at a narrow viewport is the actual point of this change, not a nice-to-have — a nav that typechecks but still overflows on a real phone would be a silent failure of the task's purpose. During implementation, attempt a headless-browser check (Playwright, installed for this task if not already present) driving the dev server at a mobile viewport width (e.g. 375px) for each of the three changed screens plus the four verify-only screens, capturing a screenshot for each. If no headless browser can be made to work in the sandbox, this must be stated explicitly in the report — not silently skipped — and manual verification instructions handed to the user.

## Out of Scope

- No changes to desktop/`md:`-and-above layouts beyond the exact grid-column breakpoint already decided above — this pass only fixes what breaks below `md`/`sm`.
- No new shared UI component (menu, sheet, drawer) added to `packages/ui` — the burger menu is a local, one-off toggle in `app-layout.tsx`.
- No changes to `requests-list.tsx`, chat pages, or `profile-page.tsx` unless the visual verification pass finds an actual defect — they are not touched preemptively.
- No viewport meta tag or global CSS changes — `apps/web/index.html` already has the standard `width=device-width, initial-scale=1.0` viewport meta.
