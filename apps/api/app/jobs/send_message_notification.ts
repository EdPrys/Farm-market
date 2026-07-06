import { DateTime } from 'luxon'
import Message from '#models/message'
import mail from '@adonisjs/mail/services/main'

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  const from = process.env.MAIL_FROM!

  await mail.send((message) => {
    message.to(to).from(from).subject(subject).text(text)
    if (html) message.html(html)
  })
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
