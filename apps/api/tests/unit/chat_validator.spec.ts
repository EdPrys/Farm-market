import { test } from '@japa/runner'
import { sendMessageSchema } from '#validators/chat'

test.group('sendMessageSchema', () => {
  test('accepts a valid payload and trims whitespace', ({ assert }) => {
    const result = sendMessageSchema.safeParse({ conversationId: 5, text: '  Привіт!  ' })

    assert.isTrue(result.success)
    if (result.success) {
      assert.deepEqual(result.data, { conversationId: 5, text: 'Привіт!' })
    }
  })

  test('rejects text over 1000 characters', ({ assert }) => {
    const result = sendMessageSchema.safeParse({
      conversationId: 5,
      text: 'a'.repeat(1001),
    })

    assert.isFalse(result.success)
  })

  test('accepts text at exactly 1000 characters', ({ assert }) => {
    const result = sendMessageSchema.safeParse({
      conversationId: 5,
      text: 'a'.repeat(1000),
    })

    assert.isTrue(result.success)
  })

  test('rejects empty or whitespace-only text', ({ assert }) => {
    const result = sendMessageSchema.safeParse({ conversationId: 5, text: '   ' })

    assert.isFalse(result.success)
  })

  test('rejects a non-number conversationId', ({ assert }) => {
    const result = sendMessageSchema.safeParse({ conversationId: '5', text: 'hello' })

    assert.isFalse(result.success)
  })

  test('rejects a non-string text (the crash scenario this task fixes)', ({ assert }) => {
    const result = sendMessageSchema.safeParse({ conversationId: 5, text: 12345 })

    assert.isFalse(result.success)
  })
})
