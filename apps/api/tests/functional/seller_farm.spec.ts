import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Farm from '#models/farm'

async function createSeller() {
  return User.create({
    fullName: 'Продавець',
    email: `seller_${Date.now()}@test.com`,
    password: 'secret123',
    isSeller: true,
  })
}

test.group('Seller farm — auth guard', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('rejects unauthenticated request', async ({ client }) => {
    const response = await client.get('/api/v1/seller/farm')
    response.assertStatus(401)
  })

  test('rejects non-seller user', async ({ client }) => {
    const buyer = await User.create({
      fullName: 'Buyer',
      email: 'buyer@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client.get('/api/v1/seller/farm').loginAs(buyer)
    response.assertStatus(403)
  })
})

test.group('POST /api/v1/seller/farm', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('creates farm for seller', async ({ client, assert }) => {
    const seller = await createSeller()
    const response = await client
      .post('/api/v1/seller/farm')
      .json({ name: 'Моя ферма', location: 'Київська обл.', activities: ['рибалка'] })
      .loginAs(seller)

    response.assertStatus(201)
    assert.equal(response.body().name, 'Моя ферма')
    assert.equal(response.body().location, 'Київська обл.')
    assert.deepEqual(response.body().activities, ['рибалка'])
  })

  test('returns 409 if farm already exists', async ({ client }) => {
    const seller = await createSeller()
    await Farm.create({ userId: seller.id, name: 'Існуюча ферма', activities: [] })

    const response = await client
      .post('/api/v1/seller/farm')
      .json({ name: 'Нова ферма' })
      .loginAs(seller)

    response.assertStatus(409)
  })
})

test.group('GET /api/v1/seller/farm', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns my farm', async ({ client, assert }) => {
    const seller = await createSeller()
    await Farm.create({ userId: seller.id, name: 'Моя ферма', activities: [] })

    const response = await client.get('/api/v1/seller/farm').loginAs(seller)

    response.assertStatus(200)
    assert.equal(response.body().name, 'Моя ферма')
  })

  test('returns 404 if no farm yet', async ({ client }) => {
    const seller = await createSeller()
    const response = await client.get('/api/v1/seller/farm').loginAs(seller)
    response.assertStatus(404)
  })
})

test.group('PATCH /api/v1/seller/farm', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('updates farm fields', async ({ client, assert }) => {
    const seller = await createSeller()
    await Farm.create({ userId: seller.id, name: 'Стара назва', activities: [] })

    const response = await client
      .patch('/api/v1/seller/farm')
      .json({ name: 'Нова назва', instagram: 'https://instagram.com/farm' })
      .loginAs(seller)

    response.assertStatus(200)
    assert.equal(response.body().name, 'Нова назва')
    assert.equal(response.body().instagram, 'https://instagram.com/farm')
  })
})

test.group('POST /api/v1/seller/farm/photos', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns 422 when farm has 10 photos', async ({ client }) => {
    const seller = await createSeller()
    const farm = await Farm.create({ userId: seller.id, name: 'Ферма', activities: [] })
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        db.table('farm_photos').insert({
          farm_id: farm.id,
          image_path: `https://example.com/photo${i}.jpg`,
          position: i,
          created_at: new Date(),
        })
      )
    )

    const response = await client.post('/api/v1/seller/farm/photos').loginAs(seller)
    response.assertStatus(422)
  })
})

test.group('DELETE /api/v1/seller/farm/photos/:photoId', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('deletes own farm photo', async ({ client, assert }) => {
    const seller = await createSeller()
    const farm = await Farm.create({ userId: seller.id, name: 'Ферма', activities: [] })
    const [photo] = await db
      .table('farm_photos')
      .insert({
        farm_id: farm.id,
        image_path: 'https://example.com/a.jpg',
        position: 0,
        created_at: new Date(),
      })
      .returning('id')

    const response = await client.delete(`/api/v1/seller/farm/photos/${photo.id}`).loginAs(seller)

    response.assertStatus(204)
    const count = await db.from('farm_photos').where('id', photo.id).count('* as total')
    assert.equal(Number(count[0].total), 0)
  })

  test('returns 404 for photo belonging to another farm', async ({ client }) => {
    const seller = await createSeller()
    await Farm.create({ userId: seller.id, name: 'Ферма', activities: [] })

    const otherSeller = await User.create({
      fullName: 'Other',
      email: `other_${Date.now()}@test.com`,
      password: 'secret123',
      isSeller: true,
    })
    const otherFarm = await Farm.create({ userId: otherSeller.id, name: 'Інша', activities: [] })
    const [photo] = await db
      .table('farm_photos')
      .insert({
        farm_id: otherFarm.id,
        image_path: 'https://example.com/b.jpg',
        position: 0,
        created_at: new Date(),
      })
      .returning('id')

    const response = await client.delete(`/api/v1/seller/farm/photos/${photo.id}`).loginAs(seller)

    response.assertStatus(404)
  })
})
