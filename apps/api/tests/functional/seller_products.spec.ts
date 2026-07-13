import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'

async function createSellerAndCategory() {
  const seller = await User.create({
    fullName: 'Іван',
    email: `seller_${Date.now()}@test.com`,
    password: 'secret123',
    isSeller: true,
  })
  const category = await Category.create({ name: 'Овочі', slug: `vegetables_${Date.now()}` })
  return { seller, category }
}

test.group('Seller products — auth guard', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('rejects unauthenticated requests', async ({ client }) => {
    const response = await client.get('/api/v1/seller/products')
    response.assertStatus(401)
  })

  test('rejects non-seller users', async ({ client }) => {
    const buyer = await User.create({
      fullName: 'Buyer',
      email: 'buyer@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client.get('/api/v1/seller/products').loginAs(buyer)
    response.assertStatus(403)
  })
})

test.group('GET /api/v1/seller/products', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns all own products including inactive', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    await Product.createMany([
      {
        sellerId: seller.id,
        categoryId: category.id,
        name: 'A',
        price: '10',
        unit: 'кг',
        quantity: '1',
        status: 'active',
      },
      {
        sellerId: seller.id,
        categoryId: category.id,
        name: 'B',
        price: '10',
        unit: 'кг',
        quantity: '1',
        status: 'inactive',
      },
    ])

    const response = await client.get('/api/v1/seller/products').loginAs(seller)
    response.assertStatus(200)
    const body = response.body() as { data: unknown[] }
    assert.lengthOf(body.data, 2)
  })

  test('does not return other sellers products', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    const otherSeller = await User.create({
      fullName: 'Other',
      email: `other_${Date.now()}@test.com`,
      password: 'secret123',
      isSeller: true,
    })
    await Product.create({
      sellerId: otherSeller.id,
      categoryId: category.id,
      name: 'Other product',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
    })

    const response = await client.get('/api/v1/seller/products').loginAs(seller)
    response.assertStatus(200)
    const body = response.body() as { data: unknown[] }
    assert.lengthOf(body.data, 0)
  })
})

test.group('POST /api/v1/seller/products', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('creates a product', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()

    const response = await client
      .post('/api/v1/seller/products')
      .json({ name: 'Томати', categoryId: category.id, price: 45, unit: 'кг', quantity: 50 })
      .loginAs(seller)

    response.assertStatus(201)
    const body = response.body() as { name: string; status: string; deliveryMethods: string[] }
    assert.equal(body.name, 'Томати')
    assert.equal(body.status, 'active')
    assert.deepEqual(body.deliveryMethods, [])
  })

  test('creates a product with delivery methods', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()

    const response = await client
      .post('/api/v1/seller/products')
      .json({
        name: 'Кролятина',
        categoryId: category.id,
        price: 200,
        unit: 'кг',
        quantity: 10,
        deliveryMethods: ['nova_poshta', 'pickup'],
      })
      .loginAs(seller)

    response.assertStatus(201)
    const body = response.body() as { deliveryMethods: string[] }
    assert.deepEqual(body.deliveryMethods, ['nova_poshta', 'pickup'])
  })

  test('returns 422 for missing required fields', async ({ client }) => {
    const { seller } = await createSellerAndCategory()
    const response = await client
      .post('/api/v1/seller/products')
      .json({ name: 'Томати' })
      .loginAs(seller)
    response.assertStatus(422)
  })
})

test.group('PUT /api/v1/seller/products/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('updates own product', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    const product = await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Old',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
    })

    const response = await client
      .put(`/api/v1/seller/products/${product.id}`)
      .json({ name: 'New', status: 'inactive' })
      .loginAs(seller)

    response.assertStatus(200)
    const body = response.body() as { name: string; status: string }
    assert.equal(body.name, 'New')
    assert.equal(body.status, 'inactive')
  })

  test('updates delivery methods', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    const product = await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Old',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
      deliveryMethods: ['pickup'],
    })

    const response = await client
      .put(`/api/v1/seller/products/${product.id}`)
      .json({ deliveryMethods: ['nova_poshta', 'ukrposhta'] })
      .loginAs(seller)

    response.assertStatus(200)
    const body = response.body() as { deliveryMethods: string[] }
    assert.deepEqual(body.deliveryMethods, ['nova_poshta', 'ukrposhta'])
  })

  test('cannot update another sellers product', async ({ client }) => {
    const { seller, category } = await createSellerAndCategory()
    const otherSeller = await User.create({
      fullName: 'Other',
      email: `other2_${Date.now()}@test.com`,
      password: 'secret123',
      isSeller: true,
    })
    const product = await Product.create({
      sellerId: otherSeller.id,
      categoryId: category.id,
      name: 'X',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
    })

    const response = await client
      .put(`/api/v1/seller/products/${product.id}`)
      .json({ name: 'Hack' })
      .loginAs(seller)

    response.assertStatus(404)
  })
})

test.group('DELETE /api/v1/seller/products/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('deletes own product', async ({ client, assert }) => {
    const { seller, category } = await createSellerAndCategory()
    const product = await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'X',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
    })

    const response = await client.delete(`/api/v1/seller/products/${product.id}`).loginAs(seller)
    response.assertStatus(204)

    const count = await Product.query().where('id', product.id).count('* as total')
    assert.equal(count[0]!.$extras.total, '0')
  })

  test('cannot delete another sellers product', async ({ client }) => {
    const { seller, category } = await createSellerAndCategory()
    const otherSeller = await User.create({
      fullName: 'Other',
      email: `other3_${Date.now()}@test.com`,
      password: 'secret123',
      isSeller: true,
    })
    const product = await Product.create({
      sellerId: otherSeller.id,
      categoryId: category.id,
      name: 'X',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
    })

    const response = await client.delete(`/api/v1/seller/products/${product.id}`).loginAs(seller)
    response.assertStatus(404)
  })
})
