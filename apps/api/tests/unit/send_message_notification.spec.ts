import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import { Mailer } from '@adonisjs/mail'
import { SMTPTransport } from '@adonisjs/mail/transports/smtp'
import emitter from '@adonisjs/core/services/emitter'
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

  test('the SMTP transport rejects when the server is unreachable (the mechanism sendEmail() relies on for error propagation)', async ({
    assert,
  }) => {
    // sendEmail() always sends through the app's globally configured 'smtp' mailer, whose
    // host/port are fixed for the whole test run (config/mail.ts resolves them from env once
    // at boot). To exercise an unreachable-host failure without changing sendEmail()'s
    // signature, this builds an isolated Mailer wrapping the same SMTPTransport class
    // sendEmail() uses under the hood, pointed at a port nothing is listening on.
    const unreachableMailer = new Mailer(
      'unreachable',
      new SMTPTransport({ host: '127.0.0.1', port: 1, connectionTimeout: 2000 }),
      emitter
    )

    await assert.rejects(() =>
      unreachableMailer.send((message) => {
        message.to('user@example.com').from('noreply@example.com').subject('Test').text('Hello')
      })
    )
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
