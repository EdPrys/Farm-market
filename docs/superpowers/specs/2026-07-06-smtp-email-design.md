# SMTP Email Module Rewrite — Design

## Context

The mail module currently sends email via a hand-rolled `fetch()` call straight to the Resend REST API (`apps/api/app/jobs/send_message_notification.ts`), used by two call sites:

- `processMessageNotification` — notifies a chat participant by email when they receive an unread message.
- `PasswordResetController.forgot` — sends the forgot-password reset link.

Goal: replace Resend with plain SMTP everywhere to cut costs. No new email types are in scope — this is a transport swap behind the existing `sendEmail()` interface.

A repo-wide analysis (via the `graphify` skill) surfaced that the codebase never actually used Mailgun — an earlier design doc (`docs/superpowers/specs/2026-06-08-email-notifications-design.md`) described Mailgun, but the implementation shipped with Resend instead. That inconsistency is resolved as a side effect of this rewrite: after this change there is exactly one transport (SMTP) and no leftover references to either Mailgun or Resend.

## Architecture

Adopt `@adonisjs/mail` (official AdonisJS package) configured with its built-in SMTP driver (nodemailer under the hood). A single `smtp` mailer is defined in `config/mail.ts`. `sendEmail()` in `send_message_notification.ts` remains the sole entry point used by both call sites — its signature (`{ to, subject, text, html? }`) does not change, only its internal implementation switches from `fetch()` to `mail.use('smtp').send(...)`.

Local development and tests get a Mailpit container (`axllent/mailpit`) added to `docker-compose.yml`, which accepts SMTP on port 1025 and shows received mail in a web UI on port 8025 — no real SMTP account needed for local work, and no email actually leaves the machine.

## Configuration

New `apps/api/config/mail.ts`:

```ts
import { defineConfig, transports } from '@adonisjs/mail'
import env from '#start/env'

export default defineConfig({
  default: 'smtp',
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: env.get('SMTP_SECURE', false),
      auth: env.get('SMTP_USERNAME')
        ? { type: 'login', user: env.get('SMTP_USERNAME'), pass: env.get('SMTP_PASSWORD') }
        : undefined,
    }),
  },
})
```

`start/env.ts` changes:
- Add: `SMTP_HOST` (string), `SMTP_PORT` (number), `SMTP_SECURE` (boolean, default false), `SMTP_USERNAME` (optional string), `SMTP_PASSWORD` (optional string).
- Keep: `MAIL_FROM` (already exists, unchanged).
- Remove: `RESEND_API_KEY`.

`.env.example` currently documents neither the old nor new mail vars — this rewrite adds the SMTP vars to `.env.example` (closing that pre-existing gap) and to `.env`/`.env.test` as needed for local dev and CI.

Local/dev values: `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_SECURE=false`, no auth (Mailpit accepts unauthenticated connections).

## Data Flow & Error Handling

`sendEmail({ to, subject, text, html })` becomes:

```ts
await mail.use('smtp').send((message) => {
  message.to(to).from(env.get('MAIL_FROM')).subject(subject).text(text)
  if (html) message.html(html)
})
```

Both call sites keep their current error-handling behavior unchanged:
- `PasswordResetController.forgot` already wraps the call in `.catch(err => console.error('Failed to send reset email', err))` — a failed email does not fail the request. Unchanged.
- `processMessageNotification` does not catch send errors today — an exception propagates to the BullMQ job runner's default retry behavior. Unchanged.

The custom `if (!response.ok) throw new Error('Resend error: ...')` branch is removed; `@adonisjs/mail`/nodemailer throw their own errors on SMTP failures (connection refused, auth failure, etc.), which is sufficient for both call sites' existing catch/no-catch handling.

## Testing

- `tests/unit/send_message_notification.spec.ts`: replace the `global.fetch` mocking with `@adonisjs/mail`'s `mail.fake()` test helper. Assertions move from inspecting captured `fetch` calls to `mail.assertSent((message) => ...)` checks (recipient, subject, from address).
- The existing "throws when Resend returns non-200" test is replaced with a test that points the mailer at an unreachable host/port and asserts `sendEmail()` rejects.
- `tests/functional/password_reset.spec.ts`'s `mockFetch()` helper is replaced with `mail.fake()` in its setup, keeping the rest of the test flow (token creation, reset behavior) unchanged.

## Docker Compose

```yaml
mailpit:
  image: axllent/mailpit
  restart: unless-stopped
  ports:
    - "1025:1025"
    - "8025:8025"
```

## Out of Scope

- No new email types or templates — only the transport changes.
- No Edge template migration — HTML stays inline in `send_message_notification.ts` as it is today.
- No production SMTP provider is chosen as part of this design; `SMTP_HOST`/`SMTP_PORT`/`SMTP_USERNAME`/`SMTP_PASSWORD` work with any standards-compliant SMTP relay, so the specific provider is an ops/deployment decision outside this spec.
