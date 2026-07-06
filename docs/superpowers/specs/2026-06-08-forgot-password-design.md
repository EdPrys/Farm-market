# Forgot Password — Design Spec

**Date:** 2026-06-08

## Overview

Дозволити користувачам скинути пароль через email. Користувач вводить свій email, отримує HTML-лист з унікальним посиланням, переходить на сторінку скиду паролю і встановлює новий пароль.

---

## Database

### New migration: `password_reset_tokens`

| Column       | Type        | Notes                          |
|--------------|-------------|--------------------------------|
| `id`         | increments  | PK                             |
| `user_id`    | integer     | FK → users.id, cascade delete  |
| `token`      | string(64)  | unique, hex string             |
| `expires_at` | timestamp   | now + 1 hour                   |
| `created_at` | timestamp   |                                |

Token is generated with `crypto.randomBytes(32).toString('hex')` (64 hex chars). Single-use: deleted after successful password reset. A new forgot-password request for the same user deletes any existing token first.

---

## Backend

### Extend `sendEmail` in `app/jobs/send_message_notification.ts`

Add optional `html` field alongside `text`. When `html` is provided, it is sent to Resend instead of `text`.

### New controller: `app/controllers/auth/password_reset_controller.ts`

**`POST /api/v1/auth/forgot-password`**

- Body: `{ email: string }`
- Looks up user by email. If not found, returns `{ message: 'ok' }` immediately (no enumeration).
- Deletes any existing token for this user.
- Generates new token, inserts into `password_reset_tokens` with `expires_at = now + 1h`.
- Sends HTML email to user with reset link: `{FRONTEND_URL}/reset-password?token=<token>`.
- Returns `{ message: 'ok' }` regardless of outcome.

**`POST /api/v1/auth/reset-password`**

- Body: `{ token: string, password: string }`
- Finds token in `password_reset_tokens` where `token = ?` and `expires_at > now`.
- If not found or expired: returns 422 `{ errors: [{ message: 'Посилання недійсне або застаріло' }] }`.
- Updates user's password (hashed via AdonisJS hash service).
- Deletes the token record.
- Returns `{ message: 'ok' }`.

### Routes (added to `start/routes.ts`)

```
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

Both are public (no auth middleware).

---

## Email

HTML template with:
- Greeting with user's name (or email if no name)
- Brief explanation
- Prominent CTA button linking to `{FRONTEND_URL}/reset-password?token=<token>`
- Note that the link expires in 1 hour
- Plain-text fallback in the `text` field

`FRONTEND_URL` is read from `process.env.FRONTEND_URL`.

---

## Frontend

### New routes

**`/forgot-password`** (`apps/web/src/routes/forgot-password/`)

- `AuthLayout` wrapper (consistent with login/signup)
- Email input + submit button
- On submit: calls `POST /api/v1/auth/forgot-password`
- On success (or any response): shows static message "Якщо email зареєстрований — лист надіслано"
- Link back to `/login`

**`/reset-password`** (`apps/web/src/routes/reset-password/`)

- Reads `token` from `?token=` search param
- If no token in URL: shows error "Недійсне посилання"
- Two fields: new password + confirm password (client-side match validation)
- On submit: calls `POST /api/v1/auth/reset-password`
- On success: redirects to `/login` with success state
- On API error: shows "Посилання недійсне або застаріло"

### Login page update

The existing non-functional `<span>Забули пароль?</span>` becomes:
```tsx
<Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
  Забули пароль?
</Link>
```

---

## Security

- `POST /forgot-password` always returns `{ message: 'ok' }` — no user enumeration.
- Token is single-use and deleted on first successful reset.
- Token expires after 1 hour.
- New request for the same user deletes the old token (prevents token accumulation).
- Password is hashed through AdonisJS `hash` service (same as registration).

---

## Environment Variables

| Variable       | Purpose                                      |
|----------------|----------------------------------------------|
| `RESEND_API_KEY` | Already in use                             |
| `MAIL_FROM`      | Already in use (`onboarding@resend.dev`)   |
| `FRONTEND_URL`   | Base URL for reset link (e.g. `https://farm-market.app`) |
