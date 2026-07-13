import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Category from '#models/category'
import Product from '#models/product'

async function seedProduct(name: string, categoryId: number, sellerId: number) {
  await db.table('products').insert({
    name,
    price: '10',
    unit: 'кг',
    quantity: '5',
    status: 'active',
    category_id: categoryId,
    seller_id: sellerId,
    created_at: new Date(),
    updated_at: new Date(),
  })
}

test.group('GET /api/v1/products — limit + random', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('respects limit param', async ({ client, assert }) => {
    const [cat] = await db
      .table('categories')
      .insert({ name: 'Т', slug: 'test', created_at: new Date(), updated_at: new Date() })
      .returning(['id'])
    const [seller] = await db
      .table('users')
      .insert({
        email: 'a@b.com',
        password: 'x',
        is_seller: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id'])

    await seedProduct('A', cat.id, seller.id)
    await seedProduct('B', cat.id, seller.id)
    await seedProduct('C', cat.id, seller.id)

    const response = await client.get('/api/v1/products?limit=2')
    response.assertStatus(200)
    const body = response.body() as { data: unknown[] }
    assert.lengthOf(body.data, 2)
  })

  test('random param does not break the query', async ({ client }) => {
    const [cat] = await db
      .table('categories')
      .insert({ name: 'Т', slug: 'test2', created_at: new Date(), updated_at: new Date() })
      .returning(['id'])
    const [seller] = await db
      .table('users')
      .insert({
        email: 'c@d.com',
        password: 'x',
        is_seller: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id'])

    await seedProduct('X', cat.id, seller.id)

    const response = await client.get('/api/v1/products?random=true')
    response.assertStatus(200)
    response.assertBodyContains({ data: [{ name: 'X' }] })
  })
})

test.group('GET /api/v1/products', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns active products with category and seller', async ({ client }) => {
    const seller = await User.create({
      fullName: 'Іван Петренко',
      email: 'ivan@test.com',
      password: 'secret123',
      isSeller: true,
      farmName: 'Ферма Петренків',
    })
    const category = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Томати',
      price: '45',
      unit: 'кг',
      quantity: '50',
      status: 'active',
    })

    const response = await client.get('/api/v1/products')

    response.assertStatus(200)
    response.assertBodyContains({
      data: [
        {
          name: 'Томати',
          category: { slug: 'vegetables' },
          seller: { farmName: 'Ферма Петренків' },
        },
      ],
    })
  })

  test('does not return inactive or archived products', async ({ client }) => {
    const seller = await User.create({
      fullName: 'Іван',
      email: 'ivan2@test.com',
      password: 'secret123',
      isSeller: true,
    })
    const category = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    await Product.createMany([
      {
        sellerId: seller.id,
        categoryId: category.id,
        name: 'A',
        price: '10',
        unit: 'кг',
        quantity: '1',
        status: 'inactive',
      },
      {
        sellerId: seller.id,
        categoryId: category.id,
        name: 'B',
        price: '10',
        unit: 'кг',
        quantity: '1',
        status: 'archived',
      },
    ])

    const response = await client.get('/api/v1/products')
    response.assertStatus(200)
    response.assertBodyContains({ data: [] })
  })

  test('filters by category slug', async ({ client, assert }) => {
    const seller = await User.create({
      fullName: 'X',
      email: 'x@test.com',
      password: 'secret123',
      isSeller: true,
    })
    const cat1 = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    const cat2 = await Category.create({ name: 'Фрукти', slug: 'fruits' })
    await Product.create({
      sellerId: seller.id,
      categoryId: cat1.id,
      name: 'Томат',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
    })
    await Product.create({
      sellerId: seller.id,
      categoryId: cat2.id,
      name: 'Яблуко',
      price: '20',
      unit: 'кг',
      quantity: '1',
      status: 'active',
    })

    const response = await client.get('/api/v1/products?category=vegetables')
    response.assertStatus(200)
    const body = response.body() as { data: { name: string }[] }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0]!.name, 'Томат')
  })

  test('filters by name search', async ({ client, assert }) => {
    const seller = await User.create({
      fullName: 'X',
      email: 'x2@test.com',
      password: 'secret123',
      isSeller: true,
    })
    const cat = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    await Product.create({
      sellerId: seller.id,
      categoryId: cat.id,
      name: 'Томати черрі',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
    })
    await Product.create({
      sellerId: seller.id,
      categoryId: cat.id,
      name: 'Огірки',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
    })

    const response = await client.get('/api/v1/products?search=Томати')
    response.assertStatus(200)
    const body = response.body() as { data: { name: string }[] }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0]!.name, 'Томати черрі')
  })

  test('filters by delivery method', async ({ client, assert }) => {
    const seller = await User.create({
      fullName: 'Y',
      email: 'y@test.com',
      password: 'secret123',
      isSeller: true,
    })
    const category = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Кролятина',
      price: '200',
      unit: 'кг',
      quantity: '10',
      status: 'active',
      deliveryMethods: ['nova_poshta'],
    })
    await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Огірки',
      price: '10',
      unit: 'кг',
      quantity: '1',
      status: 'active',
      deliveryMethods: ['pickup'],
    })

    const response = await client.get('/api/v1/products?deliveryMethod=nova_poshta')
    response.assertStatus(200)
    const body = response.body() as { data: { name: string }[] }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0]!.name, 'Кролятина')
  })
})

test.group('GET /api/v1/products/:id', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('returns single product', async ({ client }) => {
    const seller = await User.create({
      fullName: 'Іван',
      email: 'ivan3@test.com',
      password: 'secret123',
      isSeller: true,
    })
    const category = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    const product = await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Томати',
      price: '45',
      unit: 'кг',
      quantity: '50',
      status: 'active',
    })

    const response = await client.get(`/api/v1/products/${product.id}`)
    response.assertStatus(200)
    response.assertBodyContains({ name: 'Томати', category: { slug: 'vegetables' } })
  })

  test('returns delivery methods', async ({ client }) => {
    const seller = await User.create({
      fullName: 'Іван',
      email: 'ivan4@test.com',
      password: 'secret123',
      isSeller: true,
    })
    const category = await Category.create({ name: 'Овочі', slug: 'vegetables' })
    const product = await Product.create({
      sellerId: seller.id,
      categoryId: category.id,
      name: 'Кролятина',
      price: '200',
      unit: 'кг',
      quantity: '10',
      status: 'active',
      deliveryMethods: ['nova_poshta'],
    })

    const response = await client.get(`/api/v1/products/${product.id}`)
    response.assertStatus(200)
    response.assertBodyContains({ deliveryMethods: ['nova_poshta'] })
  })

  test('returns 404 for non-existent product', async ({ client }) => {
    const response = await client.get('/api/v1/products/9999')
    response.assertStatus(404)
  })
})
