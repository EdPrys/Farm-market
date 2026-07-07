import server from '@adonisjs/core/services/server'
import app from '@adonisjs/core/services/app'
import { Server, type Socket } from 'socket.io'
import User from '#models/user'
import Conversation from '#models/conversation'
import Message from '#models/message'
import { Secret } from '@adonisjs/core/helpers'
import { sendMessageSchema } from '#validators/chat'

export let io: Server

app.ready(async () => {
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173']
  io = new Server(server.getNodeServer(), {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  })

  // Перевіряємо токен при підключенні
  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth.token as string
      const headerToken = socket.handshake.headers.authorization?.replace('Bearer ', '')
      const token = authToken || headerToken

      if (!token) return next(new Error('Unauthorized'))

      const accessToken = await User.accessTokens.verify(new Secret(token))

      if (!accessToken) return next(new Error('Unauthorized'))

      const user = await User.find(accessToken.tokenableId)

      if (!user) return next(new Error('Unauthorized'))

      socket.data.user = user
      next()
    } catch (e) {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as User

    // Приєднатись до кімнати розмови
    socket.on('join', async ({ conversationId }: { conversationId: number }) => {
      const conversation = await Conversation.query()
        .where('id', conversationId)
        .where((q) => q.where('buyer_id', user.id).orWhere('seller_id', user.id))
        .first()

      if (!conversation) return

      socket.join(`conversation:${conversationId}`)
    })

    // Надіслати повідомлення
    socket.on('send', async (payload: unknown) => {
      const result = sendMessageSchema.safeParse(payload)
      if (!result.success) return

      const { conversationId, text } = result.data

      const conversation = await Conversation.query()
        .where('id', conversationId)
        .where((q) => q.where('buyer_id', user.id).orWhere('seller_id', user.id))
        .first()

      if (!conversation) return

      const message = await Message.create({
        conversationId,
        senderId: user.id,
        text,
      })

      io.to(`conversation:${conversationId}`).emit('new_message', message.serialize())

      const { notificationQueue } = await import('#start/queue')
      if (notificationQueue) {
        await notificationQueue.add(
          'message',
          { messageId: message.id },
          {
            delay: 5 * 60 * 1000,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          }
        )
      }
    })
  })
})
