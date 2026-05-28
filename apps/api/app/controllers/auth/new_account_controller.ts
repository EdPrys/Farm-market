import User from '#models/user'
import { signupSchema } from '#validators/user'
import { zodValidate } from '#lib/zod_validate'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, serialize, response }: HttpContext) {
    const data = zodValidate(signupSchema, request.body())

    try {
      const user = await User.create({
        fullName: data.fullName ?? null,
        email: data.email,
        password: data.password,
        isSeller: data.isSeller ?? false,
        farmName: data.farmName ?? null,
      })
      const token = await User.accessTokens.create(user)

      return serialize.withoutWrapping({
        user: UserTransformer.transform(user),
        token: token.value!.release(),
      })
    } catch (error: unknown) {
      const isUniqueViolation =
        error instanceof Error && 'code' in error && (error as { code: string }).code === '23505'
      if (isUniqueViolation) {
        return response.unprocessableEntity({
          errors: [{ field: 'email', message: 'Email is already taken', rule: 'unique' }],
        })
      }
      throw error
    }
  }
}
