# Chat Message Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the validation gap in the chat `send` socket handler — a non-string `text` currently crashes `.trim()`, and there's no upper bound on message length — by adding a Zod schema, matching the project's existing validator convention.

**Architecture:** One new validator file (`apps/api/app/validators/chat.ts`) exporting a Zod schema, wired into the `send` handler in `apps/api/start/socket.ts` via `.safeParse()` before any database query, plus a `maxLength` HTML attribute on the chat input as a soft frontend guard.

**Tech Stack:** Zod (already used throughout `apps/api/app/validators/`), AdonisJS v6, Socket.IO, Japa test runner.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-07-chat-message-validation-design.md`
- Message length limit: exactly 1000 characters (user-confirmed).
- On validation failure, the `send` handler silently returns — no error event emitted to the client, no new frontend error-handling UI (user-confirmed: matches today's behavior for an empty message).
- `apps/api/app/controllers/chat/messages_controller.ts` (`index`, `markRead`) is NOT touched — neither method accepts message content.
- The `join` socket handler is NOT touched — out of scope per the spec.
- No rate limiting in this task — tracked separately as a deferred phase-1 item.
- Do not commit. Make the changes and report back — the user reviews and commits manually.

---

### Task 1: `sendMessageSchema` validator with tests

**Files:**
- Create: `apps/api/app/validators/chat.ts`
- Create: `apps/api/tests/unit/chat_validator.spec.ts`

**Interfaces:**
- Produces: `sendMessageSchema` (a `ZodSchema<{ conversationId: number; text: string }>`, named export) and `SendMessageInput` (the inferred type, named export) from `#validators/chat` — Task 2 imports both.

- [ ] **Step 1: Write the failing tests**

Create `apps/api/tests/unit/chat_validator.spec.ts`:

```ts
import { test } from '@japa/runner'
import { sendMessageSchema } from '#validators/chat'

test.group('sendMessageSchema', () => {
  test('accepts a valid payload and trims whitespace', ({ assert }) => {
    const result = sendMessageSchema.safeParse({ conversationId: 5, text: '  Привіт!  ' })

    assert.isTrue(result.success)
    if (result.success) {
      assert.deepEqual(result.data, { conversationId: 5, text: 'Привіт!' })
    }
  })

  test('rejects text over 1000 characters', ({ assert }) => {
    const result = sendMessageSchema.safeParse({
      conversationId: 5,
      text: 'a'.repeat(1001),
    })

    assert.isFalse(result.success)
  })

  test('accepts text at exactly 1000 characters', ({ assert }) => {
    const result = sendMessageSchema.safeParse({
      conversationId: 5,
      text: 'a'.repeat(1000),
    })

    assert.isTrue(result.success)
  })

  test('rejects empty or whitespace-only text', ({ assert }) => {
    const result = sendMessageSchema.safeParse({ conversationId: 5, text: '   ' })

    assert.isFalse(result.success)
  })

  test('rejects a non-number conversationId', ({ assert }) => {
    const result = sendMessageSchema.safeParse({ conversationId: '5', text: 'hello' })

    assert.isFalse(result.success)
  })

  test('rejects a non-string text (the crash scenario this task fixes)', ({ assert }) => {
    const result = sendMessageSchema.safeParse({ conversationId: 5, text: 12345 })

    assert.isFalse(result.success)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter api test`
Expected: FAIL — `chat_validator.spec.ts` errors because `#validators/chat` does not exist yet.

- [ ] **Step 3: Create the validator**

Create `apps/api/app/validators/chat.ts`:

```ts
import { z } from 'zod'

export const sendMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  text: z.string().trim().min(1).max(1000),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter api test`
Expected: PASS — all 6 new tests in `chat_validator.spec.ts` pass, and the full existing suite still passes (70/70 plus the 6 new ones).

- [ ] **Step 5: Report**

Do NOT commit. Report back: files created, full test output (pass/fail counts).

---

### Task 2: Wire validation into the `send` socket handler + frontend guard

**Files:**
- Modify: `apps/api/start/socket.ts`
- Modify: `apps/web/src/routes/chat/$id.tsx`

**Interfaces:**
- Consumes: `sendMessageSchema` from `#validators/chat` (Task 1) — `.safeParse(payload)` returns `{ success: true, data: { conversationId: number; text: string } }` or `{ success: false, error: ZodError }`.

- [ ] **Step 1: Update the `send` handler**

Modify `apps/api/start/socket.ts`. Current:

```ts
    // Надіслати повідомлення
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
              delay: 5 * 60 * 1000,
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
            }
          )
        }
      }
    )
```

New (validate the raw payload before touching the database, use the parsed/trimmed `text`):

```ts
    // Надіслати повідомлення
    socket.on('send', async (payload: unknown) => {
      const result = sendMessageSchema.safeParse(payload)
      if (!result.success) return

      const { conversationId, text } = result.data

      const conversation = await Conversation.query()
        .where('id', conversationId)
        .where((q) => q.where('buyer_id', user.id).orWhere('seller_id', user.id))
        .first()

      if (!conversation) return

      const message = await Message.create({
        conversationId,
        senderId: user.id,
        text,
      })

      io.to(`conversation:${conversationId}`).emit('new_message', message.serialize())

      const { notificationQueue } = await import('#start/queue')
      if (notificationQueue) {
        await notificationQueue.add(
          'message',
          { messageId: message.id },
          {
            delay: 5 * 60 * 1000,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          }
        )
      }
    })
```

Add the import at the top of `apps/api/start/socket.ts`, alongside the existing imports:

```ts
import { sendMessageSchema } from '#validators/chat'
```

- [ ] **Step 2: Run the API test suite and typecheck**

Run: `pnpm --filter api test`
Expected: PASS — full suite including the new validator tests.

Run: `pnpm --filter api typecheck`
Expected: PASS.

- [ ] **Step 3: Add the frontend `maxLength` guard**

Modify `apps/web/src/routes/chat/$id.tsx`. Current input (around line 83-88):

```tsx
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Написати повідомлення..."
              className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
```

New (add `maxLength={1000}`):

```tsx
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Написати повідомлення..."
              maxLength={1000}
              className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
```

- [ ] **Step 4: Frontend typecheck and lint**

Run: `pnpm --filter web typecheck`
Expected: PASS.

Run: `pnpm --filter web lint`
Expected: 0 errors (the 3 pre-existing `react-refresh/only-export-components` warnings are expected).

- [ ] **Step 5: Manual verification**

With the API and web dev servers running (see `apps/api/.env` for DB/redis setup; copy `.env` from the main checkout and run `node ace serve` once if `.adonisjs/client/registry/schema.d.ts` doesn't exist yet — a fresh worktree needs this one-time codegen step), log in as a seeded user (`maria@test.com` / `password123`), open a conversation, and confirm:
- Typing in the message input stops accepting new characters at 1000 (the browser enforces `maxLength` directly — try pasting a longer string and confirm it's truncated to 1000 on paste).
- A normal message still sends and appears in the conversation.

- [ ] **Step 6: Report**

Do NOT commit. Report back: diff summary, test/typecheck/lint results, manual verification observations. The user reviews and commits manually.

---

### Task 3: Final verification

**Files:** None expected — this task verifies Tasks 1-2 left the app in a working state.

- [ ] **Step 1: Full verification**

Run: `pnpm --filter api test && pnpm --filter api typecheck`
Expected: PASS.

Run: `pnpm --filter web typecheck && pnpm --filter web lint`
Expected: PASS (only the 3 pre-existing unrelated warnings).

- [ ] **Step 2: Report to the user**

Summarize what changed (new validator + tests, socket handler hardened, frontend `maxLength` guard) and stop. Do not commit — the user reviews and commits/pushes manually per project convention.
