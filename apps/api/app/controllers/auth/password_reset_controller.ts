import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import { sendEmail } from '#jobs/send_message_notification'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import { z } from 'zod'
import { zodValidate } from '#lib/zod_validate'
import type { HttpContext } from '@adonisjs/core/http'

const forgotSchema = z.object({ email: z.string().email() })
const resetSchema = z.object({
  token: z.string().length(64),
  password: z.string().min(8),
})

export default class PasswordResetController {
  async forgot({ request }: HttpContext) {
    const { email } = zodValidate(forgotSchema, request.body())

    const user = await User.findBy('email', email)

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = DateTime.now().plus({ hours: 1 })

      await db.transaction(async (trx) => {
        await PasswordResetToken.query({ client: trx }).where('userId', user.id).delete()
        await PasswordResetToken.create({ userId: user.id, token, expiresAt }, { client: trx })
      })

      const frontendUrl = env.get('FRONTEND_URL')
      const resetLink = `${frontendUrl}/reset-password?token=${token}`
      const name = user.fullName ?? user.email

      sendEmail({
        to: user.email,
        subject: 'Скидання паролю — Farm Market',
        text: `Привіт, ${name}!\n\nДля скидання паролю перейдіть за посиланням:\n${resetLink}\n\nПосилання дійсне 1 годину.\n\nЯкщо ви не запитували скидання паролю, проігноруйте цей лист.`,
        html: `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
  <h2 style="font-size:20px;margin-bottom:8px">Скидання паролю</h2>
  <p>Привіт, ${name}!</p>
  <p>Ми отримали запит на скидання паролю для вашого акаунту.</p>
  <p style="margin:32px 0">
    <a href="${resetLink}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
      Скинути пароль
    </a>
  </p>
  <p style="color:#666;font-size:14px">Посилання дійсне 1 годину. Якщо ви не запитували скидання — проігноруйте цей лист.</p>
</body>
</html>`,
      }).catch((err: unknown) => console.error('Failed to send reset email', err))
    }

    return { message: 'ok' }
  }

  async reset({ request, response }: HttpContext) {
    const { token, password } = zodValidate(resetSchema, request.body())

    const resetToken = await PasswordResetToken.query()
      .where('token', token)
      .whereRaw('expires_at > NOW()')
      .first()

    if (!resetToken) {
      return response.unprocessableEntity({
        errors: [{ message: 'Посилання недійсне або застаріло' }],
      })
    }

    await db.transaction(async (trx) => {
      const user = await User.findOrFail(resetToken.userId, { client: trx })
      user.password = password
      await user.useTransaction(trx).save()
      await resetToken.useTransaction(trx).delete()
    })

    return { message: 'ok' }
  }
}
