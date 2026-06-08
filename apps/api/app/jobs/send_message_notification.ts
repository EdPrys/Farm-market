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
