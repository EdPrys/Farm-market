import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import { DateTime } from 'luxon'

let savedFetch: typeof global.fetch

function mockFetch() {
  savedFetch = global.fetch
  global.fetch = async (_url: unknown, _init?: RequestInit) =>
    new Response(JSON.stringify({ id: 'test-id' }), { status: 200 })
}

function restoreFetch() {
  global.fetch = savedFetch
}

test.group('POST /api/v1/auth/forgot-password', (group) => {
  group.each.setup(() => {
    process.env.FRONTEND_URL = 'http://localhost:5173'
    mockFetch()
    return async () => {
      restoreFetch()
      delete process.env.FRONTEND_URL
      await testUtils.db().truncate()
    }
  })

  test('returns ok when email is not registered', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/forgot-password')
      .json({ email: 'nobody@example.com' })
    response.assertStatus(200)
    assert.equal(response.body().message, 'ok')
  })

  test('creates token and sends email when user exists', async ({ client, assert }) => {
    const user = await User.create({ email: 'user@example.com', password: 'secret123' })
    const response = await client
      .post('/api/v1/auth/forgot-password')
      .json({ email: 'user@example.com' })
    response.assertStatus(200)
    assert.equal(response.body().message, 'ok')
    const token = await PasswordResetToken.findBy('userId', user.id)
    assert.isNotNull(token)
    assert.equal(token!.token.length, 64)
    assert.isTrue(token!.expiresAt > DateTime.now())
  })

  test('replaces existing token on second request', async ({ client, assert }) => {
    const user = await User.create({ email: 'user2@example.com', password: 'secret123' })
    await PasswordResetToken.create({
      userId: user.id,
      token: 'a'.repeat(64),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })
    await client.post('/api/v1/auth/forgot-password').json({ email: 'user2@example.com' })
    const tokens = await PasswordResetToken.query().where('userId', user.id)
    assert.equal(tokens.length, 1)
    assert.notEqual(tokens[0].token, 'a'.repeat(64))
  })
})

test.group('POST /api/v1/auth/reset-password', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('resets password with a valid token', async ({ client, assert }) => {
    const user = await User.create({ email: 'user3@example.com', password: 'oldpassword' })
    const tokenRecord = await PasswordResetToken.create({
      userId: user.id,
      token: 'b'.repeat(64),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })
    const response = await client
      .post('/api/v1/auth/reset-password')
      .json({ token: 'b'.repeat(64), password: 'newpassword123' })
    response.assertStatus(200)
    assert.equal(response.body().message, 'ok')
    const remaining = await PasswordResetToken.find(tokenRecord.id)
    assert.isNull(remaining)
    await assert.doesNotReject(() => User.verifyCredentials('user3@example.com', 'newpassword123'))
  })

  test('returns 422 for an expired token', async ({ client }) => {
    const user = await User.create({ email: 'user4@example.com', password: 'secret123' })
    await PasswordResetToken.create({
      userId: user.id,
      token: 'c'.repeat(64),
      expiresAt: DateTime.now().minus({ hours: 2 }),
    })
    const response = await client
      .post('/api/v1/auth/reset-password')
      .json({ token: 'c'.repeat(64), password: 'newpassword123' })
    response.assertStatus(422)
  })

  test('returns 422 for an unknown token', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/reset-password')
      .json({ token: 'd'.repeat(64), password: 'newpassword123' })
    response.assertStatus(422)
  })
})
