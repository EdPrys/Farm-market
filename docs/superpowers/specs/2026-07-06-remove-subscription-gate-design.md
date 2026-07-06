# Remove Subscription Gate — Design

## Context

Buyer requests are currently gated behind a fake "subscription": a free `POST /subscribe` endpoint flips `isSubscribed` to `true` with no payment involved, and the frontend hides the buyer-requests list behind a `SubscribeGate` component until the user clicks "Підписатись безкоштовно." Critically, this gate is **frontend-only** — `BuyerRequestsController.index()`/`show()` have no auth or subscription check at all, so the "protection" is already bypassable via a direct API call.

Decision: remove monetization entirely for now. Ship buyer requests open to all logged-in users, and revisit real monetization once the app has actual users (per project direction — monetization was always meant to come later, via seller tools/analytics, not a request-list paywall).

## Surface Area

**Backend:**
- `apps/api/database/schema.ts` — `isSubscribed` column declaration on `UserSchema`
- `apps/api/database/migrations/1781400000000_add_is_subscribed_to_users.ts` — original migration (stays, for history; a new migration drops the column)
- `apps/api/app/transformers/user_transformer.ts` — exposes `isSubscribed` in the serialized user
- `apps/api/app/controllers/account/profile_controller.ts` — `subscribe()` action
- `apps/api/start/routes.ts` — `POST /subscribe` route registration

**Frontend:**
- `apps/web/src/shared/auth/types.ts` — `isSubscribed: boolean` field on the `User` type
- `apps/web/src/shared/auth/use-subscribe.ts` — the mutation hook (whole file removed)
- `apps/web/src/routes/catalog/requests/-requests-list.tsx` — the `SubscribeGate` component and the `!user?.isSubscribed` check

## Backend Changes

- Remove `isSubscribed` from `UserSchema.$columns` and its `declare isSubscribed: boolean` field in `schema.ts`.
- Remove the `'isSubscribed'` entry from `UserTransformer`'s field list.
- Remove `ProfileController.subscribe()` entirely.
- Remove the `router.post('subscribe', [controllers.account.Profile, 'subscribe'])` line from `routes.ts`.
- Add a new migration `drop_is_subscribed_from_users` that drops the column in `up()` and re-adds it (`boolean, default false`) in `down()`, matching the reversible pattern of the original add-column migration.

## Frontend Changes

- Remove `isSubscribed: boolean` from the `User` type in `shared/auth/types.ts`.
- Delete `apps/web/src/shared/auth/use-subscribe.ts`.
- In `-requests-list.tsx`:
  - Delete the `SubscribeGate` function entirely.
  - Remove the `useSubscribe` import and the `enabled: !!user?.isSubscribed` option passed to `useRequests` (fetch whenever a user is present).
  - Keep the existing `!user` branch (not logged in), but replace its subscription-flavored copy with a plain "Увійдіть, щоб переглянути запити покупців" message + the existing "Увійти" link — no mention of subscribing.
  - Logged-in users see the requests list immediately, with no additional gate.

## Testing

No existing tests reference `isSubscribed` or `/subscribe` (confirmed via grep across `apps/api/tests` and `apps/web/src/routes/catalog/requests/__tests__`), so no test files need updating for removed behavior — only verification that removal doesn't break anything:
- `pnpm --filter api test` — full suite green
- `pnpm --filter api typecheck` — no leftover references
- `pnpm --filter web typecheck` — no leftover references to `isSubscribed` or the deleted hook

## Out of Scope

- No new monetization mechanism is designed here — this is pure removal. Real monetization (per project direction: seller tools/analytics) is a future, separate design once the app has real users.
- No changes to the `_authenticated` route-guard pattern or route file structure — the existing manual `!user` check in `-requests-list.tsx` is kept as-is, just stripped of subscription-specific copy.
