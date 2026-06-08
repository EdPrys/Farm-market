# Email Notifications for New Messages — Design

## Overview

When a user receives a new chat message and doesn't read it within 30 minutes, send one email notification via Mailgun. Uses BullMQ + Redis to guarantee exactly-one delivery across multiple API instances.

## Architecture

```
User sends message (socket 'send')
  → create Message in DB
  → emit 'new_message' to conversation room [existing]
  → enqueue BullMQ job with 30min delay

BullMQ Worker (30 min later):
  → load Message with conversation + buyer + seller
  → message.readAt !== null → skip (already read)
  → message.notificationSentAt !== null → skip (already notified)
  → send email via Mailgun REST API
  → set message.notificationSentAt = now()
```

## Database

**Migration:** add `notification_sent_at` column to `messages` table.

```ts
table.timestamp('notification_sent_at').nullable()
```

**Schema update:** add `notificationSentAt: DateTime | null` to `MessageSchema`.

## Environment Variables

Added to `apps/api`:

| Variable | Description |
|---|---|
| `REDIS_URL` | Redis connection string from Railway |
| `MAILGUN_API_KEY` | Mailgun private API key |
| `MAILGUN_DOMAIN` | Mailgun sending domain (e.g. `mg.farm-market.com`) |
| `MAIL_FROM` | Sender address (e.g. `noreply@farm-market.com`) |

Added to `start/env.ts` validation.

## Queue Setup (`start/queue.ts`)

- Creates `ioredis` connection from `REDIS_URL`
- Exports `notificationQueue` (BullMQ `Queue`) for enqueueing
- Creates BullMQ `Worker` that processes `'message'` jobs
- Worker runs in the same process as the API — BullMQ uses Redis distributed lock so only one worker instance processes each job

## Job Logic (`app/jobs/send_message_notification.ts`)

Worker handler for `'message'` jobs:

1. Load `Message` with `conversation → buyer + seller` preloaded
2. If `message.readAt` is set → skip (user read it in time)
3. If `message.notificationSentAt` is set → skip (already notified, duplicate job)
4. Determine recipient: if `message.senderId === conversation.buyerId` → recipient is seller, else buyer
5. Send email via Mailgun REST API (`fetch` POST to `https://api.mailgun.net/v3/{domain}/messages`)
6. Update `message.notificationSentAt = DateTime.now()`

## Email Content

- **Subject:** `Нове повідомлення в Farm Market`
- **Body (text):** `У вас є непрочитане повідомлення. Відкрийте чат: {APP_URL}/chat/{conversationId}`

## Socket Change (`start/socket.ts`)

After `Message.create(...)` and `io.emit(...)`:

```ts
await notificationQueue.add('message', { messageId: message.id }, {
  delay: 30 * 60 * 1000,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
})
```

`attempts: 3` with exponential backoff handles transient Mailgun failures.

## Infrastructure

- Add **Redis** service on Railway
- Set `REDIS_URL` in `api` Variables (reference from Redis service)
- Set Mailgun env vars in `api` Variables

## New Files

| File | Purpose |
|---|---|
| `start/queue.ts` | Redis connection, Queue + Worker init |
| `app/jobs/send_message_notification.ts` | Job handler logic |
| `database/migrations/..._add_notification_sent_at_to_messages.ts` | DB migration |

## Modified Files

| File | Change |
|---|---|
| `start/socket.ts` | Enqueue job after message create |
| `start/env.ts` | Add REDIS_URL, MAILGUN_*, MAIL_FROM validation |
| `database/schema.ts` | Add notificationSentAt to MessageSchema |
| `apps/api/package.json` | Add bullmq, ioredis dependencies |
