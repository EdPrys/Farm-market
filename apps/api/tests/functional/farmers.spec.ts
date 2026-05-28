import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

test.group('GET /api/v1/farmers/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns 404 when user does not exist', async ({ client }) => {
    const response = await client.get('/api/v1/farmers/999')
    response.assertStatus(404)
  })

  test('returns 404 when user is not a seller', async ({ client }) => {
    const [user] = await db
      .table('users')
      .insert({
        email: 'buyer@test.com',
        password: 'x',
        is_seller: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id'])

    const response = await client.get(`/api/v1/farmers/${user.id}`)
    response.assertStatus(404)
  })

  test('returns farmer profile with products', async ({ client, assert }) => {
    const [seller] = await db
      .table('users')
      .insert({
        email: 'farmer@test.com',
        password: 'x',
        full_name: 'Іван Петренко',
        farm_name: 'Ферма Петренко',
        is_seller: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id'])

    const [cat] = await db
      .table('categories')
      .insert({ name: 'Овочі', slug: 'veg', created_at: new Date(), updated_at: new Date() })
      .returning(['id'])

    await db.table('products').insert({
      name: 'Картопля',
      price: '20',
      unit: 'кг',
      quantity: '100',
      status: 'active',
      category_id: cat.id,
      seller_id: seller.id,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const response = await client.get(`/api/v1/farmers/${seller.id}`)
    response.assertStatus(200)
    response.assertBodyContains({
      id: seller.id,
      fullName: 'Іван Петренко',
      farmName: 'Ферма Петренко',
    })
    const body = response.body() as { products: { name: string }[] }
    assert.lengthOf(body.products, 1)
    assert.equal(body.products[0].name, 'Картопля')
  })

  test('does not include inactive products', async ({ client, assert }) => {
    const [seller] = await db
      .table('users')
      .insert({
        email: 'farm2@test.com',
        password: 'x',
        is_seller: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id'])

    const [cat] = await db
      .table('categories')
      .insert({ name: 'Фрукти', slug: 'fr', created_at: new Date(), updated_at: new Date() })
      .returning(['id'])

    await db.table('products').insert({
      name: 'Архівний товар',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'archived',
      category_id: cat.id,
      seller_id: seller.id,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const response = await client.get(`/api/v1/farmers/${seller.id}`)
    response.assertStatus(200)
    const body = response.body() as { products: unknown[] }
    assert.lengthOf(body.products, 0)
  })
})
