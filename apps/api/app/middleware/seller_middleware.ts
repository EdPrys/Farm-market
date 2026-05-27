import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SellerMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()
    if (!user.isSeller) {
      return response.forbidden({ message: 'Seller access required' })
    }
    return next()
  }
}
