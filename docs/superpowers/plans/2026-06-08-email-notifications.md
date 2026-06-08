# Email Notifications for New Messages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send one email via Mailgun when a chat message remains unread for 30 minutes, using BullMQ + Redis to guarantee exactly-one delivery across multiple API instances.

**Architecture:** When a message is sent via Socket.io, a BullMQ job is enqueued with a 30-minute delay. When the job executes, it checks if the message is still unread and no notification has been sent yet — if so, it sends an email via Mailgun REST API and marks `notification_sent_at` on the message.

**Tech Stack:** BullMQ, ioredis, Mailgun REST API (via `fetch`), AdonisJS v6, Lucid ORM

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `database/migrations/1780700000000_add_notification_sent_at_to_messages.ts` | Add `notification_sent_at` column |
| Modify | `database/schema.ts` | Add `notificationSentAt` to `MessageSchema` |
| Modify | `start/env.ts` | Add REDIS_URL, MAILGUN_API_KEY, MAILGUN_DOMAIN, MAIL_FROM |
| Create | `app/jobs/send_message_notification.ts` | Job handler + Mailgun helper |
| Create | `start/queue.ts` | Redis connection, BullMQ Queue + Worker |
| Modify | `adonisrc.ts` | Register `#start/queue` as preload |
| Modify | `start/socket.ts` | Enqueue job after message create |
| Create | `tests/unit/send_message_notification.spec.ts` | Unit tests for job handler |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install bullmq and ioredis**

```bash
cd apps/api && pnpm add bullmq ioredis
```

Expected output: both packages added to `dependencies` in `apps/api/package.json`.

- [ ] **Step 2: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore: add bullmq and ioredis dependencies"
```

---

## Task 2: Environment Variables

**Files:**
- Modify: `apps/api/start/env.ts`

- [ ] **Step 1: Add env vars to validation**

Replace the contents of `apps/api/start/env.ts` with:

```ts
import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  // Database
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.secret(),
  DB_DATABASE: Env.schema.string(),

  // Redis
  REDIS_URL: Env.schema.string(),

  // Mailgun
  MAILGUN_API_KEY: Env.schema.secret(),
  MAILGUN_DOMAIN: Env.schema.string(),
  MAIL_FROM: Env.schema.string(),
})
```

- [ ] **Step 2: Create `.env` entries for local development**

Add to `apps/api/.env` (create if doesn't exist):

```
REDIS_URL=redis://localhost:6379
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-mailgun-domain
MAIL_FROM=noreply@farm-market.com
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/start/env.ts apps/api/.env
git commit -m "feat: add Redis and Mailgun env var validation"
```

---

## Task 3: Database Migration

**Files:**
- Create: `apps/api/database/migrations/1780700000000_add_notification_sent_at_to_messages.ts`
- Modify: `apps/api/database/schema.ts`

- [ ] **Step 1: Create migration file**

Create `apps/api/database/migrations/1780700000000_add_notification_sent_at_to_messages.ts`:

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.table(this.tableName, (table) => {
      table.timestamp('notification_sent_at').nullable()
    })
  }

  async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('notification_sent_at')
    })
  }
}
```

- [ ] **Step 2: Update MessageSchema in `apps/api/database/schema.ts`**

Find the `MessageSchema` class and update `$columns` and add the new field. The updated class should look like:

```ts
export class MessageSchema extends BaseModel {
  static $columns = ['conversationId', 'createdAt', 'id', 'notificationSentAt', 'readAt', 'senderId', 'text', 'updatedAt'] as const
  $columns = MessageSchema.$columns
  @column()
  declare conversationId: number
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  @column({ isPrimary: true })
  declare id: number
  @column.dateTime()
  declare notificationSentAt: DateTime | null
  @column.dateTime()
  declare readAt: DateTime | null
  @column()
  declare senderId: number
  @column()
  declare text: string
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

- [ ] **Step 3: Run migration locally**

```bash
cd apps/api && node ace migration:run
```

Expected output: `migrated database/migrations/1780700000000_add_notification_sent_at_to_messages`

- [ ] **Step 4: Commit**

```bash
git add apps/api/database/migrations/1780700000000_add_notification_sent_at_to_messages.ts apps/api/database/schema.ts
git commit -m "feat: add notification_sent_at column to messages"
```

---

## Task 4: Job Handler

**Files:**
- Create: `apps/api/app/jobs/send_message_notification.ts`
- Create: `apps/api/tests/unit/send_message_notification.spec.ts`

- [ ] **Step 1: Write the failing unit tests first**

Create `apps/api/tests/unit/send_message_notification.spec.ts`:

```ts
import { test } from '@japa/runner'
import { sendMailgunEmail } from '#jobs/send_message_notification'

test.group('sendMailgunEmail', () => {
  test('sends POST request to Mailgun with correct auth header', async ({ assert }) => {
    const calls: { url: string; init: RequestInit }[] = []

    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: url.toString(), init: init ?? {} })
      return new Response(JSON.stringify({ id: 'test-id' }), { status: 200 })
    }

    process.env.MAILGUN_API_KEY = 'test-key'
    process.env.MAILGUN_DOMAIN = 'mg.example.com'
    process.env.MAIL_FROM = 'noreply@example.com'

    await sendMailgunEmail({
      to: 'user@example.com',
      subject: 'Test',
      text: 'Hello',
    })

    assert.equal(calls.length, 1)
    assert.include(calls[0].url, 'mg.example.com')
    assert.include(calls[0].url, '/messages')
    const authHeader = (calls[0].init.headers as Record<string, string>)['Authorization']
    assert.include(authHeader, 'Basic ')
  })

  test('throws when Mailgun returns non-200', async ({ assert }) => {
    global.fetch = async () => new Response('Bad Request', { status: 400 })

    process.env.MAILGUN_API_KEY = 'test-key'
    process.env.MAILGUN_DOMAIN = 'mg.example.com'
    process.env.MAIL_FROM = 'noreply@example.com'

    await assert.rejects(
      () => sendMailgunEmail({ to: 'user@example.com', subject: 'Test', text: 'Hello' }),
      /Mailgun error: 400/
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && node ace test --files="tests/unit/send_message_notification.spec.ts"
```

Expected: FAIL — `Cannot find module '#jobs/send_message_notification'`

- [ ] **Step 3: Create the job handler**

Create `apps/api/app/jobs/send_message_notification.ts`:

```ts
import { DateTime } from 'luxon'
import Message from '#models/message'

export async function sendMailgunEmail({
  to,
  subject,
  text,
}: {
  to: string
  subject: string
  text: string
}) {
  const apiKey = process.env.MAILGUN_API_KEY!
  const domain = process.env.MAILGUN_DOMAIN!
  const from = process.env.MAIL_FROM!

  const form = new FormData()
  form.append('from', from)
  form.append('to', to)
  form.append('subject', subject)
  form.append('text', text)

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
    },
    body: form,
  })

  if (!response.ok) {
    throw new Error(`Mailgun error: ${response.status} ${await response.text()}`)
  }
}

export async function processMessageNotification(job: { data: { messageId: number } }) {
  const message = await Message.query()
    .where('id', job.data.messageId)
    .preload('conversation', (q) => q.preload('buyer').preload('seller'))
    .firstOrFail()

  if (message.readAt || message.notificationSentAt) return

  const conversation = message.conversation
  const recipient =
    message.senderId === conversation.buyerId ? conversation.seller : conversation.buyer

  const appUrl = process.env.APP_URL!

  await sendMailgunEmail({
    to: recipient.email,
    subject: 'Нове повідомлення в Farm Market',
    text: `У вас є непрочитане повідомлення. Відкрийте чат: ${appUrl}/chat/${conversation.id}`,
  })

  await message.merge({ notificationSentAt: DateTime.now() }).save()
}
```

- [ ] **Step 4: Add `#jobs/*` import alias to `apps/api/package.json`**

In the `"imports"` section of `apps/api/package.json`, add:

```json
"#jobs/*": "./app/jobs/*.js"
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/api && node ace test --files="tests/unit/send_message_notification.spec.ts"
```

Expected: PASS — 2 tests passing

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/jobs/send_message_notification.ts apps/api/tests/unit/send_message_notification.spec.ts apps/api/package.json
git commit -m "feat: add message notification job handler with Mailgun"
```

---

## Task 5: Queue Setup

**Files:**
- Create: `apps/api/start/queue.ts`
- Modify: `apps/api/adonisrc.ts`

- [ ] **Step 1: Create `apps/api/start/queue.ts`**

```ts
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import app from '@adonisjs/core/services/app'

export let notificationQueue: Queue

app.ready(async () => {
  const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
  const workerConnection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

  notificationQueue = new Queue('notifications', { connection })

  const { processMessageNotification } = await import('#jobs/send_message_notification')

  new Worker('notifications', processMessageNotification, {
    connection: workerConnection,
    concurrency: 5,
  })
})
```

- [ ] **Step 2: Register queue as preload in `apps/api/adonisrc.ts`**

In the `preloads` array, add the queue entry after socket:

```ts
preloads: [
  () => import('#start/routes'),
  () => import('#start/kernel'),
  () => import('#start/socket'),
  () => import('#start/queue'),
],
```

- [ ] **Step 3: Verify the app still starts**

```bash
cd apps/api && node ace serve
```

Expected: server starts without errors on port 3333. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add apps/api/start/queue.ts apps/api/adonisrc.ts
git commit -m "feat: add BullMQ queue and worker with Redis"
```

---

## Task 6: Wire Up Socket

**Files:**
- Modify: `apps/api/start/socket.ts`

- [ ] **Step 1: Import notificationQueue and enqueue job after message create**

In `apps/api/start/socket.ts`, find the `send` event handler. After `io.to(...).emit('new_message', message.serialize())`, add the job enqueue.

The updated `send` handler should look like:

```ts
socket.on(
  'send',
  async ({ conversationId, text }: { conversationId: number; text: string }) => {
    const conversation = await Conversation.query()
      .where('id', conversationId)
      .where((q) => q.where('buyer_id', user.id).orWhere('seller_id', user.id))
      .first()

    if (!conversation || !text?.trim()) return

    const message = await Message.create({
      conversationId,
      senderId: user.id,
      text: text.trim(),
    })

    io.to(`conversation:${conversationId}`).emit('new_message', message.serialize())

    const { notificationQueue } = await import('#start/queue')
    if (notificationQueue) {
      await notificationQueue.add(
        'message',
        { messageId: message.id },
        {
          delay: 30 * 60 * 1000,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        }
      )
    }
  }
)
```

- [ ] **Step 2: Verify app starts and typecheck passes**

```bash
cd apps/api && node ace serve
```

In a separate terminal:
```bash
cd apps/api && pnpm typecheck
```

Expected: no TypeScript errors, server starts.

- [ ] **Step 3: Commit**

```bash
git add apps/api/start/socket.ts
git commit -m "feat: enqueue notification job on message send"
```

---

## Task 7: Deploy to Railway

- [ ] **Step 1: Push all changes**

```bash
git push origin main
```

- [ ] **Step 2: Add Redis on Railway**

In Railway project → **+ Add** → **Database** → **Redis**. Wait for it to deploy.

- [ ] **Step 3: Add env vars to `api` service on Railway**

In Railway → `api` service → **Variables**, add:

| Variable | Value |
|---|---|
| `REDIS_URL` | Add Reference → Redis → `REDIS_URL` |
| `MAILGUN_API_KEY` | your Mailgun private API key |
| `MAILGUN_DOMAIN` | your Mailgun sending domain |
| `MAIL_FROM` | `noreply@<your-domain>` |

- [ ] **Step 4: Run migration on Railway**

In Railway → `api` service → **Console**:

```bash
node ace.js migration:run
```

Type `y` when prompted.

Expected: `migrated database/migrations/1780700000000_add_notification_sent_at_to_messages`

- [ ] **Step 5: Verify deployment**

Check Railway `api` → **Deploy Logs** — should show no startup errors. Send a test message in the app and wait 30 minutes (or temporarily change delay to `10 * 1000` for a 10-second test, then revert).
