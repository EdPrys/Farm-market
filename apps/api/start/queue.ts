import { Queue, Worker } from 'bullmq'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

const QUEUE_NAME = 'notifications'

export let notificationQueue: Queue

app.ready(async () => {
  const redisUrl = new URL(env.get('REDIS_URL'))

  const connection = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port) || 6379,
    password: redisUrl.password || undefined,
    username: redisUrl.username || undefined,
    tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  }

  notificationQueue = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  })

  const { processMessageNotification } = await import('#jobs/send_message_notification')

  const worker = new Worker(QUEUE_NAME, processMessageNotification, {
    connection,
    concurrency: 5,
  })

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'notification job failed')
  })

  worker.on('error', (err) => {
    logger.error({ err }, 'notification worker error')
  })

  app.terminating(async () => {
    await worker.close()
    await notificationQueue.close()
  })
})
