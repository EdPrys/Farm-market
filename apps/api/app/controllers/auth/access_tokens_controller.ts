import User from '#models/user'
import { loginSchema } from '#validators/user'
import { zodValidate } from '#lib/zod_validate'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccessTokensController {
  async store({ request }: HttpContext) {
    const { email, password } = zodValidate(loginSchema, request.body())

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return {
      token: token.value!.release(),
    }
  }

  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }
}
