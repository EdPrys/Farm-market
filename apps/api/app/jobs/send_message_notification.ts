import { DateTime } from 'luxon'
import Message from '#models/message'

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string
  subject: string
  text: string
}) {
  const apiKey = process.env.RESEND_API_KEY!
  const from = process.env.MAIL_FROM!

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text }),
  })

  if (!response.ok) {
    throw new Error(`Resend error: ${response.status} ${await response.text()}`)
  }
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
