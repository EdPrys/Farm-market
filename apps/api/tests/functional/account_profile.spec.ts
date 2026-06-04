import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('PATCH /api/v1/account/profile — auth guard', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('rejects unauthenticated request', async ({ client }) => {
    const response = await client.patch('/api/v1/account/profile').json({ fullName: 'Test' })
    response.assertStatus(401)
  })
})

test.group('PATCH /api/v1/account/profile — update fullName', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('updates fullName and returns updated user', async ({ client, assert }) => {
    const user = await User.create({
      email: 'buyer@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client
      .patch('/api/v1/account/profile')
      .loginAs(user)
      .json({ fullName: 'Іван Петренко' })
    response.assertStatus(200)
    assert.equal(response.body().fullName, 'Іван Петренко')
    assert.isFalse(response.body().isSeller)
  })

  test('sets fullName to null', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Старе Імʼя',
      email: 'buyer2@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client
      .patch('/api/v1/account/profile')
      .loginAs(user)
      .json({ fullName: null })
    response.assertStatus(200)
    assert.isNull(response.body().fullName)
  })
})

test.group('PATCH /api/v1/account/profile — become seller', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('sets isSeller=true and farmName', async ({ client, assert }) => {
    const user = await User.create({
      email: 'buyer3@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client
      .patch('/api/v1/account/profile')
      .loginAs(user)
      .json({ isSeller: true, farmName: 'Ферма Тест' })
    response.assertStatus(200)
    assert.isTrue(response.body().isSeller)
    assert.equal(response.body().farmName, 'Ферма Тест')
  })

  test('rejects become-seller without farmName', async ({ client }) => {
    const user = await User.create({
      email: 'buyer4@test.com',
      password: 'secret123',
      isSeller: false,
    })
    const response = await client
      .patch('/api/v1/account/profile')
      .loginAs(user)
      .json({ isSeller: true })
    response.assertStatus(422)
  })
})
