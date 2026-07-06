# B2 Image Storage — Design

## Context

Product images are currently saved to the local filesystem (`storage/uploads/products/`) and served via a `/uploads/*` route. On Railway, the filesystem is ephemeral — files are lost on every redeploy. The fix is to store images in Backblaze B2 (S3-compatible object storage, free tier 10GB).

## Scope

- One upload endpoint: `uploadImage` in `seller_products_controller.ts`
- No profile/avatar uploads exist yet
- Frontend uses `imagePath` directly as `<img src>` — no changes needed there

## Architecture

### New: `app/services/storage_service.ts`

Wraps `@aws-sdk/client-s3`. Exposes a single method:

```ts
upload(buffer: Buffer, key: string, contentType: string): Promise<string>
```

Returns the full public URL. Instantiated once and reused (singleton via module-level constant).

### Updated: `seller_products_controller.ts` — `uploadImage`

1. Receive multipart file (same validation as today)
2. Read file into buffer via `fs.readFile(image.tmpPath!)`
3. Generate `key = products/${randomUUID()}.${ext}`
4. Call `storageService.upload(buffer, key, contentType)`
5. Save returned URL to `product.imagePath`

### Removed: `/uploads/*` route in `start/routes.ts`

No longer needed — images are served directly from B2's public URL.

### `imagePath` in DB

Changes from a relative path (`/uploads/products/uuid.jpg`) to a full URL (`https://f<xxx>.backblazeb2.com/file/<bucket>/<key>`). Existing rows with old paths will show broken images — acceptable since this is dev data.

## Environment Variables

| Variable | Description |
|---|---|
| `B2_ENDPOINT` | S3-compatible endpoint, e.g. `https://s3.us-west-004.backblazeb2.com` |
| `B2_ACCESS_KEY_ID` | Application Key ID |
| `B2_SECRET_ACCESS_KEY` | Application Key |
| `B2_BUCKET_NAME` | Bucket name |
| `B2_PUBLIC_URL` | Public base URL, e.g. `https://f004.backblazeb2.com/file/<bucket-name>` |

These must be added to `.env` (local) and Railway environment variables (production).

## Backblaze B2 Setup (manual, before deploy)

1. Create account at backblaze.com → Go to B2 Cloud Storage
2. Create bucket — set **Files in Bucket are: Public**
3. Note the **Endpoint** shown on the bucket page (e.g. `s3.us-west-004.backblazeb2.com`)
4. Note the **Public URL** base: `https://f004.backblazeb2.com/file/<bucket-name>`
5. Go to **App Keys** → Add a New Application Key
   - Bucket: restrict to your bucket
   - Permissions: Read and Write
6. Copy **keyID** → `B2_ACCESS_KEY_ID` and **applicationKey** → `B2_SECRET_ACCESS_KEY`

## Dependencies

- `@aws-sdk/client-s3` — S3-compatible client, works with B2

## Error Handling

- Missing env vars → throw at startup (fail fast)
- S3 upload error → propagate as 500 (AdonisJS default error handler)
- Invalid file (size/ext) → existing validation, unchanged

## Testing

- Unit test for `storage_service.ts`: mock `S3Client`, verify correct `PutObjectCommand` params and URL format
- Existing functional tests for `uploadImage` don't test file storage — no changes needed there
