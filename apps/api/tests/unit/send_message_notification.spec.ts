import { test } from '@japa/runner'
import { sendEmail, processMessageNotification } from '#jobs/send_message_notification'

test.group('sendEmail', (group) => {
  let originalFetch: typeof global.fetch

  group.each.setup(() => {
    originalFetch = global.fetch
  })

  group.each.teardown(() => {
    global.fetch = originalFetch
  })

  test('sends POST request to Resend with correct auth header', async ({ assert }) => {
    const calls: { url: string; init: RequestInit }[] = []

    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: url.toString(), init: init ?? {} })
      return new Response(JSON.stringify({ id: 'test-id' }), { status: 200 })
    }

    process.env.RESEND_API_KEY = 'test-key'
    process.env.MAIL_FROM = 'noreply@example.com'

    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      text: 'Hello',
    })

    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://api.resend.com/emails')
    assert.equal((calls[0].init as RequestInit).method, 'POST')
    const authHeader = ((calls[0].init as RequestInit).headers as Record<string, string>)[
      'Authorization'
    ]
    assert.equal(authHeader, 'Bearer test-key')
  })

  test('throws when Resend returns non-200', async ({ assert }) => {
    global.fetch = async () => new Response('Bad Request', { status: 400 })

    process.env.RESEND_API_KEY = 'test-key'
    process.env.MAIL_FROM = 'noreply@example.com'

    await assert.rejects(
      () => sendEmail({ to: 'user@example.com', subject: 'Test', text: 'Hello' }),
      /Resend error: 400/
    )
  })
})

test.group('processMessageNotification', (group) => {
  let originalFetch: typeof global.fetch

  group.each.setup(() => {
    originalFetch = global.fetch
  })

  group.each.teardown(() => {
    global.fetch = originalFetch
  })

  test('skips if message was already read', async ({ assert }) => {
    let fetchCalled = false
    global.fetch = async () => {
      fetchCalled = true
      return new Response('{}', { status: 200 })
    }

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

    assert.isFalse(fetchCalled)
  })

  test('skips if notification was already sent', async ({ assert }) => {
    let fetchCalled = false
    global.fetch = async () => {
      fetchCalled = true
      return new Response('{}', { status: 200 })
    }

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

    assert.isFalse(fetchCalled)
  })
})
