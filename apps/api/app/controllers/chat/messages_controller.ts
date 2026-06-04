import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Conversation from '#models/conversation'
import Message from '#models/message'

export default class MessagesController {
  async index({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    const conversation = await Conversation.query()
      .where('id', params.id)
      .where((q) => q.where('buyer_id', user.id).orWhere('seller_id', user.id))
      .firstOrFail()

    const messages = await Message.query()
      .where('conversation_id', conversation.id)
      .orderBy('created_at', 'asc')

    return serialize.withoutWrapping(messages.map((m) => m.serialize()))
  }

  // PATCH /api/v1/conversations/:id/read — помітити всі отримані повідомлення як прочитані
  async markRead({ auth, params }: HttpContext) {
    const user = auth.getUserOrFail()

    const conversation = await Conversation.query()
      .where('id', params.id)
      .where((q) => q.where('buyer_id', user.id).orWhere('seller_id', user.id))
      .firstOrFail()

    await Message.query()
      .where('conversation_id', conversation.id)
      .whereNot('sender_id', user.id)
      .whereNull('read_at')
      .update({ readAt: DateTime.now() })
  }
}
