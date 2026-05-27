import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

test.group('GET /api/v1/categories', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns all categories with id, name, slug', async ({ client }) => {
    await db.table('categories').multiInsert([
      { name: 'Овочі', slug: 'vegetables', created_at: new Date(), updated_at: new Date() },
      { name: 'Фрукти', slug: 'fruits', created_at: new Date(), updated_at: new Date() },
    ])

    const response = await client.get('/api/v1/categories')

    response.assertStatus(200)
    response.assertBodyContains({
      data: [
        { name: 'Овочі', slug: 'vegetables' },
        { name: 'Фрукти', slug: 'fruits' },
      ],
    })
  })

  test('returns empty array when no categories', async ({ client }) => {
    const response = await client.get('/api/v1/categories')
    response.assertStatus(200)
    response.assertBodyContains({ data: [] })
  })
})
