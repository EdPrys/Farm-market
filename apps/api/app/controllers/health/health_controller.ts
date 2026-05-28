import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class HealthController {
  async show({ response }: HttpContext) {
    const timestamp = new Date().toISOString()
    try {
      await db.rawQuery('SELECT 1')
      return response.ok({ status: 'ok', db: 'ok', timestamp })
    } catch {
      return response.serviceUnavailable({ status: 'degraded', db: 'error', timestamp })
    }
  }
}
