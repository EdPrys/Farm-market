import UserTransformer from '#transformers/user_transformer'
import { updateProfileSchema } from '#validators/account'
import { zodValidate } from '#lib/zod_validate'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth, serialize }: HttpContext) {
    return serialize.withoutWrapping(UserTransformer.transform(auth.getUserOrFail()))
  }

  async update({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = zodValidate(updateProfileSchema, request.body())

    if (data.fullName !== undefined) {
      user.fullName = data.fullName
    }
    if (data.isSeller) {
      user.isSeller = true
      user.farmName = data.farmName!
    }
    await user.save()
    return serialize.withoutWrapping(UserTransformer.transform(user))
  }
}
