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
