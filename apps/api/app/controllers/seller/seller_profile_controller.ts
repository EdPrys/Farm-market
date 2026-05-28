import type { HttpContext } from '@adonisjs/core/http'
import { zodValidate } from '#lib/zod_validate'
import { updateSellerProfileSchema } from '#validators/user'

export default class SellerProfileController {
  async show({ auth, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    return serialize.withoutWrapping({
      phone: seller.phone ?? null,
      telegram: seller.telegram ?? null,
      viber: seller.viber ?? null,
    })
  }

  async update({ auth, request, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const data = zodValidate(updateSellerProfileSchema, request.body())
    if (data.phone !== undefined) seller.phone = data.phone ?? null
    if (data.telegram !== undefined) seller.telegram = data.telegram ?? null
    if (data.viber !== undefined) seller.viber = data.viber ?? null
    await seller.save()
    return serialize.withoutWrapping({
      phone: seller.phone ?? null,
      telegram: seller.telegram ?? null,
      viber: seller.viber ?? null,
    })
  }
}
