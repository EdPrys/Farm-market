import Conversation from '#models/conversation'
import type { HttpContext } from '@adonisjs/core/http'

export default class ConversationsController {
  // GET /api/v1/conversations — мої розмови
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    const conversations = await Conversation.query()
      .where('buyer_id', user.id)
      .orWhere('seller_id', user.id)
      .preload('buyer')
      .preload('seller')
      .preload('messages', (q) => q.orderBy('created_at', 'desc').limit(1))
      .orderBy('updated_at', 'desc')

    return serialize.withoutWrapping(conversations.map((c) => c.serialize()))
  }
  async store({ auth, request, serialize }: HttpContext) {
    // POST /api/v1/conversations — знайти або створити розмов
    const user = auth.getUserOrFail()
    const { sellerId } = request.only(['sellerId'])

    const existing = await Conversation.query()
      .where('buyer_id', user.id)
      .where('seller_id', sellerId)
      .first()

    if (existing) {
      return serialize.withoutWrapping(existing.serialize())
    }

    const conversation = await Conversation.create({
      buyerId: user.id,
      sellerId,
    })

    return serialize.withoutWrapping(conversation.serialize())
  }
}
