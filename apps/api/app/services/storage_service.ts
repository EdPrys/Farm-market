import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export class StorageService {
  constructor(private readonly client: S3Client) {}

  async upload(buffer: Buffer, key: string, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )
    return `${process.env.B2_PUBLIC_URL}/${key}`
  }
}

let cachedInstance: StorageService | null = null

export function getStorageService(): StorageService {
  cachedInstance ??= new StorageService(
    new S3Client({
      endpoint: process.env.B2_ENDPOINT!,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.B2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
      },
    })
  )
  return cachedInstance
}
