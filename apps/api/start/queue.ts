import { Queue, Worker } from 'bullmq'
import app from '@adonisjs/core/services/app'

export let notificationQueue: Queue

app.ready(async () => {
  const redisUrl = new URL(process.env.REDIS_URL!)
  const connection = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port) || 6379,
    password: redisUrl.password || undefined,
    tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  }

  notificationQueue = new Queue('notifications', { connection })

  const { processMessageNotification } = await import('#jobs/send_message_notification')

  new Worker('notifications', processMessageNotification, {
    connection,
    concurrency: 5,
  })
})
