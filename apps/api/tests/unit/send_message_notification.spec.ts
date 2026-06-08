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
