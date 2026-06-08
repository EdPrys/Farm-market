import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Farm from '#models/farm'
import Product from '#models/product'
import Category from '#models/category'

async function createSellerWithFarm() {
  const seller = await User.create({
    fullName: 'Іван Петренко',
    email: `farmer_${Date.now()}@test.com`,
    password: 'secret123',
    isSeller: true,
  })
  const farm = await Farm.create({
    userId: seller.id,
    name: 'Ферма Петренка',
    description: 'Органічні овочі',
    location: 'Полтавська обл.',
    activities: ['рибалка', 'екскурсії'],
    instagram: 'https://instagram.com/farm',
  })
  return { seller, farm }
}

test.group('GET /api/v1/farms', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns empty list when no farms', async ({ client, assert }) => {
    const response = await client.get('/api/v1/farms')
    response.assertStatus(200)
    assert.isArray(response.body().data)
    assert.equal(response.body().data.length, 0)
    assert.exists(response.body().meta)
  })

  test('returns farms with review stats', async ({ client, assert }) => {
    const { seller, farm } = await createSellerWithFarm()
    await db.table('farm_reviews').insert({
      farm_id: farm.id,
      user_id: seller.id,
      rating: 4,
      text: 'Гарно',
      created_at: new Date(),
    })

    const response = await client.get('/api/v1/farms')
    response.assertStatus(200)
    const item = response.body().data[0]
    assert.equal(item.name, 'Ферма Петренка')
    assert.equal(item.reviewCount, 1)
    assert.equal(item.avgRating, 4)
    assert.isNull(item.coverImagePath)
    assert.isArray(item.activities)
    assert.exists(response.body().meta.currentPage)
  })

  test('returns null avgRating when no reviews', async ({ client, assert }) => {
    await createSellerWithFarm()
    const response = await client.get('/api/v1/farms')
    response.assertStatus(200)
    assert.equal(response.body().data[0].reviewCount, 0)
    assert.isNull(response.body().data[0].avgRating)
  })
})

test.group('GET /api/v1/farms/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns farm profile with photos and products', async ({ client, assert }) => {
    const { seller, farm } = await createSellerWithFarm()
    await db.table('farm_photos').insert({
      farm_id: farm.id,
      image_path: 'https://example.com/photo.jpg',
      position: 0,
      created_at: new Date(),
    })
    const category = await Category.create({ name: 'Овочі', slug: `veg_${Date.now()}` })
    await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Томати',
      price: '45',
      unit: 'кг',
      quantity: '100',
      status: 'active',
    })

    const response = await client.get(`/api/v1/farms/${farm.id}`)

    response.assertStatus(200)
    assert.equal(response.body().name, 'Ферма Петренка')
    assert.equal(response.body().location, 'Полтавська обл.')
    assert.deepEqual(response.body().activities, ['рибалка', 'екскурсії'])
    assert.lengthOf(response.body().photos, 1)
    assert.lengthOf(response.body().products, 1)
    assert.equal(response.body().products[0].name, 'Томати')
    assert.equal(response.body().products[0].price, '45.00')
    assert.isNotNull(response.body().products[0].category)
    assert.equal(response.body().farmer.fullName, 'Іван Петренко')
  })

  test('returns 404 for unknown farm id', async ({ client }) => {
    const response = await client.get('/api/v1/farms/999999')
    response.assertStatus(404)
  })

  test('does not include inactive products', async ({ client, assert }) => {
    const { seller, farm } = await createSellerWithFarm()
    const category = await Category.create({ name: 'Овочі', slug: `veg_${Date.now()}` })
    await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Томати',
      price: '45',
      unit: 'кг',
      quantity: '100',
      status: 'inactive',
    })

    const response = await client.get(`/api/v1/farms/${farm.id}`)

    response.assertStatus(200)
    assert.lengthOf(response.body().products, 0)
  })
})
