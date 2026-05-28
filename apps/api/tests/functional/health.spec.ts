import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

test.group('GET /health', () => {
  test('returns 200 with status ok when db is reachable', async ({ client }) => {
    const response = await client.get('/health')
    response.assertStatus(200)
    response.assertBodyContains({ status: 'ok', db: 'ok' })
  })

  test('response includes timestamp string', async ({ client, assert }) => {
    const response = await client.get('/health')
    response.assertStatus(200)
    const body = response.body() as { timestamp: string }
    assert.isString(body.timestamp)
  })

  test('returns 503 with status degraded when db throws', async ({ client }) => {
    const original = db.rawQuery.bind(db)
    // @ts-expect-error — patching for test
    db.rawQuery = async () => {
      throw new Error('connection refused')
    }

    const response = await client.get('/health')

    db.rawQuery = original

    response.assertStatus(503)
    response.assertBodyContains({ status: 'degraded', db: 'error' })
  })
})
