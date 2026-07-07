# Chat Message Validation — Design

## Context

Phase-1 soft-launch item 3 (see project memory `project_launch_plan.md`): the chat `send` socket handler in `apps/api/start/socket.ts` currently does only `if (!conversation || !text?.trim()) return` — no schema, no length limit, no type guarantee on `text` or `conversationId`. Two concrete risks:
- A non-string `text` (e.g. a number or object sent by a malformed/malicious client) throws inside `text?.trim()` — optional chaining only guards `null`/`undefined`, not wrong types.
- No upper bound on message length — a client can send an arbitrarily large string, stored unbounded in Postgres and broadcast to the other party.

`apps/api/app/controllers/chat/messages_controller.ts` (`index`, `markRead`) accepts no message content — messages are only ever created through the socket `send` handler, so it needs no changes.

## Changes

### 1. New validator (`apps/api/app/validators/chat.ts`)

Following the existing pattern in `apps/api/app/validators/buyer_request.ts` (Zod, `min`/`max` on strings, `z.number().int().positive()` for IDs):

```ts
import { z } from 'zod'

export const sendMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  text: z.string().trim().min(1).max(1000),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
```

1000-character limit (user-confirmed during brainstorming). `.trim()` on the Zod string transforms the value directly, replacing the current manual `text.trim()` call at the point of use.

### 2. `apps/api/start/socket.ts` — `send` handler

Current:

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
    ...
```

New: validate the raw payload with `sendMessageSchema.safeParse(...)` *before* querying the database (so a garbage payload never reaches a DB query), and use the parsed/trimmed `text`:

```ts
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
  ...
```

On validation failure, the handler silently returns — identical to today's behavior for an empty message (user-confirmed: no error event back to the client, no new frontend error-handling UI; this is a backend hardening fix, not a UX feature).

### 3. Frontend guard (`apps/web/src/routes/chat/$id.tsx`)

Add `maxLength={1000}` to the message `<input>` so a user typing in the normal UI can never produce a payload the backend would reject — this is a soft guard, not a substitute for the backend validation above (the backend is the actual enforcement point; the socket payload doesn't go through this input's constraints if bypassed).

## Testing

New unit test file `apps/api/tests/unit/chat_validator.spec.ts`, following the `test.group`/`assert` pattern in `apps/api/tests/unit/storage_service.spec.ts`, covering `sendMessageSchema`:
- Valid payload (`conversationId` positive int, `text` 1-1000 chars) parses successfully and trims whitespace.
- Rejects `text` over 1000 characters.
- Rejects empty/whitespace-only `text`.
- Rejects non-number `conversationId` (e.g. a string).
- Rejects non-string `text` (e.g. a number) — this is the exact crash scenario from the Context section.

No existing test touches `socket.ts` directly (it's a live Socket.IO server, not something the current test suite exercises), so the validator unit test is the practical, in-scope test surface — consistent with how `buyer_request.ts`'s schemas aren't separately re-tested at the socket/controller call site either.

Manual verification: run the app, send a message under and over 1000 characters from the chat UI, confirm the browser `<input maxLength>` prevents typing past the limit.

## Out of Scope

- No error event emitted back to the client on validation failure, no new frontend error UI — matches user's explicit choice to keep current silent-drop behavior.
- No changes to `messages_controller.ts` (`index`, `markRead`) — neither accepts message content.
- No changes to the `join` socket handler's `conversationId` handling — not part of the identified risk (a malformed `join` payload fails the DB lookup harmlessly; it doesn't call `.trim()` on anything).
- No rate limiting on message sending — tracked separately as a deferred phase-1 item, not part of this task.
