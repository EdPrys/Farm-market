# SMTP Email Module Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Resend-based email transport with plain SMTP via `@adonisjs/mail`, add a local Mailpit dev/test catcher, and remove all Resend configuration.

**Architecture:** `@adonisjs/mail` with its built-in SMTP transport (nodemailer under the hood) becomes the app's mailer, configured in `apps/api/config/mail.ts`. The existing `sendEmail()` function in `apps/api/app/jobs/send_message_notification.ts` keeps its exact signature (`{ to, subject, text, html? }`) — only its internal implementation changes from a raw `fetch()` call to Resend's REST API to `mail.send(...)`. Both existing call sites (chat message notifications, password reset) need zero changes. Mailpit runs as a docker-compose service for local dev/test, so no real SMTP account or network egress is needed to develop or run tests.

**Tech Stack:** `@adonisjs/mail@^10.4.0` (SMTP transport / nodemailer), Mailpit (`axllent/mailpit` Docker image), Japa (existing test runner).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-06-smtp-email-design.md`
- `sendEmail()`'s signature (`{ to, subject, text, html? }`) must not change — both call sites depend on it as-is.
- No Edge templates — HTML stays inline in `send_message_notification.ts`, per spec's "Out of Scope."
- No new email types — transport swap only.
- Do not commit — the user reviews and commits manually (per project convention).
- Do not remove or rename the unrelated `#mails/*` import alias in `package.json` — it is unused today and out of scope for this rewrite.

---

### Task 1: Install and configure `@adonisjs/mail` with the SMTP transport

**Files:**
- Modify: `apps/api/package.json` (add dependency)
- Modify: `apps/api/adonisrc.ts:41-49` (register provider)
- Create: `apps/api/config/mail.ts`
- Modify: `apps/api/start/env.ts` (add SMTP schema, remove `RESEND_API_KEY`)
- Modify: `apps/api/.env.example`, `apps/api/.env`, `apps/api/.env.test`

**Interfaces:**
- Produces: `config/mail.ts` default-exports a `defineConfig(...)` result with one mailer named `smtp`, used by Task 3 via `import mail from '@adonisjs/mail/services/main'`.
- Produces: env vars `SMTP_HOST` (string), `SMTP_PORT` (number), `SMTP_SECURE` (boolean), `SMTP_USERNAME` (optional string), `SMTP_PASSWORD` (optional string), consumed by `config/mail.ts`.

- [ ] **Step 1: Install the package**

```bash
pnpm --filter api add @adonisjs/mail@^10.4.0
```

- [ ] **Step 2: Register the mail provider**

Modify `apps/api/adonisrc.ts` — in the `providers` array, add the mail provider import. Current array (lines 41-49):

```ts
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/session/session_provider'),
    () => import('@adonisjs/shield/shield_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('#providers/api_provider'),
  ],
```

New array — add the mail provider line right after the cors provider:

```ts
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/session/session_provider'),
    () => import('@adonisjs/shield/shield_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/mail/mail_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('#providers/api_provider'),
  ],
```

- [ ] **Step 3: Create `apps/api/config/mail.ts`**

```ts
import { defineConfig, transports } from '@adonisjs/mail'
import type { InferMailers } from '@adonisjs/mail/types'
import env from '#start/env'

const mailConfig = defineConfig({
  default: 'smtp',
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: env.get('SMTP_SECURE'),
      auth: env.get('SMTP_USERNAME')
        ? {
            type: 'login',
            user: env.get('SMTP_USERNAME')!,
            pass: env.get('SMTP_PASSWORD')!,
          }
        : undefined,
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
```

- [ ] **Step 4: Update the env schema**

Modify `apps/api/start/env.ts`. Replace:

```ts
  // Resend
  RESEND_API_KEY: Env.schema.secret(),
  MAIL_FROM: Env.schema.string(),
```

with:

```ts
  // SMTP
  SMTP_HOST: Env.schema.string({ format: 'host' }),
  SMTP_PORT: Env.schema.number(),
  SMTP_SECURE: Env.schema.boolean(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  MAIL_FROM: Env.schema.string(),
```

- [ ] **Step 5: Update `.env.example`**

Add this block to `apps/api/.env.example` (it currently documents neither the old nor new mail vars — closing that gap):

```
#--------------------------------------------------------------------
# SMTP (local dev: point at the Mailpit container, see docker-compose.yml)
#--------------------------------------------------------------------
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
# SMTP_USERNAME=
# SMTP_PASSWORD=
MAIL_FROM=onboarding@farm-market.local
```

- [ ] **Step 6: Update `.env` (local dev values)**

In `apps/api/.env`, replace the line:

```
RESEND_API_KEY=re_SjX8dtQf_8smiXFNsgE1QxySHz1XjqDvc
MAIL_FROM=onboarding@resend.dev
```

with:

```
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
MAIL_FROM=onboarding@farm-market.local
```

- [ ] **Step 7: Update `.env.test`**

`apps/api/.env.test` currently only sets `SESSION_DRIVER` and `FRONTEND_URL` (it inherits everything else from `.env`). Add the SMTP vars explicitly so tests don't depend on `.env`'s values changing later:

```
SESSION_DRIVER=memory
FRONTEND_URL=http://localhost:5173
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
MAIL_FROM=test@farm-market.local
```

- [ ] **Step 8: Verify nothing broke**

Run: `pnpm --filter api test`
Expected: all existing tests still PASS (this task doesn't touch `sendEmail()`'s implementation yet — it still uses the old `fetch()`-based Resend code, which reads `process.env.RESEND_API_KEY`/`process.env.MAIL_FROM` directly rather than through the `start/env.ts` schema, so removing `RESEND_API_KEY` from the schema does not break it).

Run: `pnpm --filter api typecheck`
Expected: PASS (no type errors from the new `config/mail.ts` or `start/env.ts` changes).

- [ ] **Step 9: Commit**

```bash
git add apps/api/package.json apps/api/pnpm-lock.yaml apps/api/adonisrc.ts apps/api/config/mail.ts apps/api/start/env.ts apps/api/.env.example apps/api/.env.test
git commit -m "feat: configure @adonisjs/mail with SMTP transport"
```

Note: `apps/api/.env` is typically gitignored (local secrets) — check `git status` before adding; if it's untracked/ignored, skip it in the commit.

---

### Task 2: Add Mailpit to docker-compose

**Files:**
- Modify: `docker-compose.yml`

**Interfaces:**
- Produces: an SMTP catcher reachable at `localhost:1025` (matches `SMTP_HOST`/`SMTP_PORT` set in Task 1), with a web UI at `localhost:8025`.

- [ ] **Step 1: Add the service**

Modify `docker-compose.yml`. Current file:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: farm
      POSTGRES_PASSWORD: farm
      POSTGRES_DB: farm_market
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

New file — add the `mailpit` service:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: farm
      POSTGRES_PASSWORD: farm
      POSTGRES_DB: farm_market
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"

  mailpit:
    image: axllent/mailpit
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
```

- [ ] **Step 2: Verify the compose file is valid**

Run: `docker compose config --quiet`
Expected: no output, exit code 0 (confirms the YAML parses and the service is well-formed).

- [ ] **Step 3: Start it and confirm it's reachable**

Run: `docker compose up -d mailpit && sleep 2 && curl -sf http://localhost:8025/api/v2/messages > /dev/null && echo "Mailpit OK"`
Expected: prints `Mailpit OK`.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add Mailpit SMTP catcher for local dev"
```

---

### Task 3: Migrate `sendEmail()` to SMTP (TDD)

**Files:**
- Modify: `apps/api/app/jobs/send_message_notification.ts`
- Modify: `apps/api/tests/unit/send_message_notification.spec.ts`

**Interfaces:**
- Consumes: `mail` default export from `@adonisjs/mail/services/main` (configured in Task 1); `mail.fake()` / `mail.restore()` for tests.
- Produces: `sendEmail({ to: string, subject: string, text: string, html?: string }): Promise<void>` — same signature as before, consumed unchanged by `processMessageNotification` (same file) and `PasswordResetController.forgot` (Task 4 touches its test, not its calling code).

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `apps/api/tests/unit/send_message_notification.spec.ts` with:

```ts
import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import { sendEmail, processMessageNotification } from '#jobs/send_message_notification'

test.group('sendEmail', (group) => {
  let fake: ReturnType<typeof mail.fake>

  group.each.setup(() => {
    fake = mail.fake()
    process.env.MAIL_FROM = 'noreply@example.com'
    return () => mail.restore()
  })

  test('sends the email via SMTP with the correct recipient, subject, and from address', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      text: 'Hello',
    })

    fake.messages.assertSent(
      (message) =>
        message.hasTo('user@example.com') &&
        message.hasSubject('Test') &&
        message.hasFrom('noreply@example.com')
    )
  })

  test('includes html when provided', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      text: 'Hello',
      html: '<p>Hello</p>',
    })

    fake.messages.assertSent((message) => message.nodeMailerMessage.html === '<p>Hello</p>')
  })
})

test.group('processMessageNotification', (group) => {
  let fake: ReturnType<typeof mail.fake>

  group.each.setup(() => {
    fake = mail.fake()
    process.env.MAIL_FROM = 'noreply@example.com'
    return () => mail.restore()
  })

  test('skips if message was already read', async () => {
    const fakeMessage = {
      readAt: new Date(),
      notificationSentAt: null,
      senderId: 1,
      conversation: {
        buyerId: 1,
        sellerId: 2,
        buyer: { email: 'b@e.com' },
        seller: { email: 's@e.com' },
        id: 1,
      },
      merge: () => ({ save: async () => {} }),
    }

    // @ts-expect-error - mock
    const messageModule = await import('#models/message')
    const original = messageModule.default
    const mockQuery = {
      where: () => mockQuery,
      preload: () => mockQuery,
      first: async () => fakeMessage,
    }
    // @ts-expect-error - mock
    original.query = () => mockQuery

    await processMessageNotification({ data: { messageId: 1 } })

    fake.messages.assertNoneSent()
  })

  test('skips if notification was already sent', async () => {
    const fakeMessage = {
      readAt: null,
      notificationSentAt: new Date(),
      senderId: 1,
      conversation: {
        buyerId: 1,
        sellerId: 2,
        buyer: { email: 'b@e.com' },
        seller: { email: 's@e.com' },
        id: 1,
      },
      merge: () => ({ save: async () => {} }),
    }

    const messageModule = await import('#models/message')
    const original = messageModule.default
    const mockQuery = {
      where: () => mockQuery,
      preload: () => mockQuery,
      first: async () => fakeMessage,
    }
    // @ts-expect-error - mock
    original.query = () => mockQuery

    await processMessageNotification({ data: { messageId: 1 } })

    fake.messages.assertNoneSent()
  })
})
```

Note: `mail.fake()` calls `restore()` internally before creating a new fake mailer, so each test group captures the returned instance once in `group.each.setup` and reuses it — never call `mail.fake()` a second time within the same test.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter api exec node ace test --files="tests/unit/send_message_notification.spec.ts"`
Expected: FAIL — `sendEmail` still calls `fetch()` against `https://api.resend.com/emails` for real (no mock intercepts it now), so requests either error out (no network / bad `RESEND_API_KEY`) or the assertions against `mail.fake()` fail because no message was ever sent through the mailer.

- [ ] **Step 3: Rewrite `sendEmail()`**

Replace the full contents of `apps/api/app/jobs/send_message_notification.ts`:

```ts
import { DateTime } from 'luxon'
import Message from '#models/message'
import mail from '@adonisjs/mail/services/main'

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  const from = process.env.MAIL_FROM!

  await mail.send((message) => {
    message.to(to).from(from).subject(subject).text(text)
    if (html) message.html(html)
  })
}

export async function processMessageNotification(job: { data: { messageId: number } }) {
  const message = await Message.query()
    .where('id', job.data.messageId)
    .preload('conversation', (q) => q.preload('buyer').preload('seller'))
    .first()

  if (!message) return
  if (message.readAt || message.notificationSentAt) return

  const conversation = message.conversation
  const recipient =
    message.senderId === conversation.buyerId ? conversation.seller : conversation.buyer

  const appUrl = process.env.APP_URL!

  await sendEmail({
    to: recipient.email,
    subject: 'Нове повідомлення в Farm Market',
    text: `У вас є непрочитане повідомлення. Відкрийте чат: ${appUrl}/chat/${conversation.id}`,
  })

  await message.merge({ notificationSentAt: DateTime.now() }).save()
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter api exec node ace test --files="tests/unit/send_message_notification.spec.ts"`
Expected: PASS (all 4 tests: 2 in `sendEmail`, 2 in `processMessageNotification`).

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/jobs/send_message_notification.ts apps/api/tests/unit/send_message_notification.spec.ts
git commit -m "feat: send email via SMTP instead of Resend"
```

---

### Task 4: Migrate the password-reset functional test off `mockFetch`

**Files:**
- Modify: `apps/api/tests/functional/password_reset.spec.ts`

**Interfaces:**
- Consumes: `mail` default export from `@adonisjs/mail/services/main` (same as Task 3); `PasswordResetController.forgot` is unchanged and already calls `sendEmail()` from Task 3.

- [ ] **Step 1: Write the updated test (replaces the fetch mock)**

Modify `apps/api/tests/functional/password_reset.spec.ts`. Replace lines 1-28:

```ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import { DateTime } from 'luxon'

let savedFetch: typeof global.fetch

function mockFetch() {
  savedFetch = global.fetch
  global.fetch = async (_url: unknown, _init?: RequestInit) =>
    new Response(JSON.stringify({ id: 'test-id' }), { status: 200 })
}

function restoreFetch() {
  global.fetch = savedFetch
}

test.group('POST /api/v1/auth/forgot-password', (group) => {
  group.each.setup(() => {
    process.env.FRONTEND_URL = 'http://localhost:5173'
    mockFetch()
    return async () => {
      restoreFetch()
      delete process.env.FRONTEND_URL
      await testUtils.db().truncate()
    }
  })
```

with:

```ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import { DateTime } from 'luxon'

test.group('POST /api/v1/auth/forgot-password', (group) => {
  group.each.setup(() => {
    process.env.FRONTEND_URL = 'http://localhost:5173'
    mail.fake()
    return async () => {
      mail.restore()
      delete process.env.FRONTEND_URL
      await testUtils.db().truncate()
    }
  })
```

Leave the rest of the file (all `test(...)` blocks in both groups, from `test('returns ok when email is not registered', ...)` onward) exactly as-is — none of them reference `fetch` directly, they only exercise the HTTP endpoint.

- [ ] **Step 2: Run the tests to verify they still pass**

Run: `pnpm --filter api exec node ace test --files="tests/functional/password_reset.spec.ts"`
Expected: PASS (all tests in both groups — `PasswordResetController.forgot`'s `sendEmail(...).catch(...)` swallows any error, and with `mail.fake()` active no real SMTP connection is attempted).

- [ ] **Step 3: Commit**

```bash
git add apps/api/tests/functional/password_reset.spec.ts
git commit -m "test: use mail.fake() instead of mocking fetch in password reset spec"
```

---

### Task 5: Final cleanup and full verification

**Files:**
- None expected — this task verifies Tasks 1-4 left no stray references.

- [ ] **Step 1: Grep for leftover Resend/Mailgun references in application code**

Run:
```bash
grep -rniE "resend|mailgun" apps/api/app apps/api/config apps/api/start apps/api/.env apps/api/.env.example apps/api/.env.test 2>/dev/null
```
Expected: no output. (Historical spec docs under `docs/superpowers/specs/` that mention Mailgun or Resend are out of scope — they're a record of what was planned/built at the time, not live config.)

- [ ] **Step 2: Run the full test suite**

Run: `pnpm --filter api test`
Expected: PASS, no regressions in any other test file.

- [ ] **Step 3: Run the typecheck**

Run: `pnpm --filter api typecheck`
Expected: PASS.

- [ ] **Step 4: Manual smoke test against Mailpit**

With `docker compose up -d mailpit` and the API running (`pnpm --filter api dev`), trigger the forgot-password endpoint for a real user and confirm the email shows up in the Mailpit UI:

```bash
curl -sX POST http://localhost:3333/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"<an email that exists in your local db>"}'
```

Open `http://localhost:8025` in a browser and confirm the "Скидання паролю — Farm Market" email arrived with the reset link rendered correctly.

- [ ] **Step 5: Report to the user**

Summarize what changed and stop here — do not commit this task's verification (there's nothing to commit; it's read-only checks) and do not open a PR. The user reviews and commits/pushes manually per project convention.
