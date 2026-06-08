import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Farm from '#models/farm'

async function createSellerWithFarm() {
  const seller = await User.create({
    fullName: 'Іван Петренко',
    email: `seller_${Date.now()}@test.com`,
    password: 'secret123',
    isSeller: true,
  })
  const farm = await Farm.create({ userId: seller.id, name: 'Ферма Петренка', activities: [] })
  return { seller, farm }
}

async function createBuyer() {
  return User.create({
    fullName: 'Олена Покупець',
    email: `buyer_${Date.now()}@test.com`,
    password: 'secret123',
    isSeller: false,
  })
}

test.group('GET /api/v1/farms/:id/reviews', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns reviews with user info', async ({ client, assert }) => {
    const { farm } = await createSellerWithFarm()
    const buyer = await createBuyer()
    await db.table('farm_reviews').insert({
      farm_id: farm.id,
      user_id: buyer.id,
      rating: 5,
      text: 'Чудово!',
      created_at: new Date(),
    })

    const response = await client.get(`/api/v1/farms/${farm.id}/reviews`)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].rating, 5)
    assert.equal(response.body().data[0].text, 'Чудово!')
    assert.equal(response.body().data[0].user.fullName, 'Олена Покупець')
    assert.exists(response.body().meta)
  })

  test('returns empty list when no reviews', async ({ client, assert }) => {
    const { farm } = await createSellerWithFarm()
    const response = await client.get(`/api/v1/farms/${farm.id}/reviews`)
    response.assertStatus(200)
    assert.lengthOf(response.body().data, 0)
  })

  test('returns 404 for unknown farm', async ({ client }) => {
    const response = await client.get('/api/v1/farms/999999/reviews')
    response.assertStatus(404)
  })
})

test.group('POST /api/v1/farms/:id/reviews', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('creates review for authenticated user', async ({ client, assert }) => {
    const { farm } = await createSellerWithFarm()
    const buyer = await createBuyer()

    const response = await client
      .post(`/api/v1/farms/${farm.id}/reviews`)
      .json({ rating: 4, text: 'Гарна ферма!' })
      .loginAs(buyer)

    response.assertStatus(201)
    assert.equal(response.body().rating, 4)
    assert.equal(response.body().text, 'Гарна ферма!')
    assert.equal(response.body().user.fullName, 'Олена Покупець')
  })

  test('rejects unauthenticated request', async ({ client }) => {
    const { farm } = await createSellerWithFarm()
    const response = await client
      .post(`/api/v1/farms/${farm.id}/reviews`)
      .json({ rating: 4, text: 'Відгук' })
    response.assertStatus(401)
  })

  test('rejects rating above 5', async ({ client }) => {
    const { farm } = await createSellerWithFarm()
    const buyer = await createBuyer()
    const response = await client
      .post(`/api/v1/farms/${farm.id}/reviews`)
      .json({ rating: 6, text: 'Відгук' })
      .loginAs(buyer)
    response.assertStatus(422)
  })

  test('rejects empty text', async ({ client }) => {
    const { farm } = await createSellerWithFarm()
    const buyer = await createBuyer()
    const response = await client
      .post(`/api/v1/farms/${farm.id}/reviews`)
      .json({ rating: 3, text: '' })
      .loginAs(buyer)
    response.assertStatus(422)
  })

  test('returns 404 for unknown farm', async ({ client }) => {
    const buyer = await createBuyer()
    const response = await client
      .post('/api/v1/farms/999999/reviews')
      .json({ rating: 4, text: 'Відгук' })
      .loginAs(buyer)
    response.assertStatus(404)
  })
})
