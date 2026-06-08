import { test } from '@japa/runner'
import type { S3Client } from '@aws-sdk/client-s3'
import { StorageService } from '#services/storage_service'

test.group('StorageService', (group) => {
  let originalBucket: string | undefined
  let originalUrl: string | undefined

  group.setup(() => {
    originalBucket = process.env.B2_BUCKET_NAME
    originalUrl = process.env.B2_PUBLIC_URL
    process.env.B2_BUCKET_NAME = 'test-bucket'
    process.env.B2_PUBLIC_URL = 'https://f003.backblazeb2.com/file/test-bucket'
  })

  group.teardown(() => {
    process.env.B2_BUCKET_NAME = originalBucket
    process.env.B2_PUBLIC_URL = originalUrl
  })

  test('upload sends PutObjectCommand with correct params and returns public URL', async ({
    assert,
  }) => {
    const calls: { input: Record<string, unknown> }[] = []
    const mockClient = {
      send: async (command: { input: Record<string, unknown> }) => {
        calls.push(command)
        return {}
      },
    } as unknown as S3Client

    const service = new StorageService(mockClient)
    const url = await service.upload(Buffer.from('test'), 'products/abc.jpg', 'image/jpeg')

    assert.equal(url, 'https://f003.backblazeb2.com/file/test-bucket/products/abc.jpg')
    assert.lengthOf(calls, 1)
    assert.equal(calls[0].input['Bucket'], 'test-bucket')
    assert.equal(calls[0].input['Key'], 'products/abc.jpg')
    assert.equal(calls[0].input['ContentType'], 'image/jpeg')
    assert.deepEqual(calls[0].input['Body'], Buffer.from('test'))
  })
})
