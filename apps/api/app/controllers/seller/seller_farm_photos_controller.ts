import type { HttpContext } from '@adonisjs/core/http'
import Farm from '#models/farm'
import FarmPhoto from '#models/farm_photo'
import FarmTransformer from '#transformers/farm_transformer'
import { getStorageService } from '#services/storage_service'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

const MAX_PHOTOS = 10

export default class SellerFarmPhotosController {
  async store({ auth, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const farm = await Farm.query()
      .where('user_id', seller.id)
      .preload('photos', (q) => q.orderBy('position', 'asc').orderBy('created_at', 'asc'))
      .first()

    if (!farm) return response.notFound({ message: 'Farm not found' })
    if (farm.photos.length >= MAX_PHOTOS) {
      return response.unprocessableEntity({ message: `Maximum ${MAX_PHOTOS} photos allowed` })
    }

    const image = request.file('image', { size: '5mb', extnames: ['jpg', 'jpeg', 'png', 'webp'] })
    if (!image) return response.unprocessableEntity({ message: 'No image provided' })
    if (!image.isValid) return response.unprocessableEntity({ message: image.errors })

    const key = `farms/photos/${randomUUID()}.${image.extname}`
    const buffer = await readFile(image.tmpPath!)
    const contentType = image.headers['content-type'] ?? 'image/jpeg'
    const imagePath = await getStorageService().upload(buffer, key, contentType)

    const position = farm.photos.length
    await FarmPhoto.create({ farmId: farm.id, imagePath, position })

    await farm.load('photos', (q) => q.orderBy('position', 'asc').orderBy('created_at', 'asc'))
    farm.$extras.products = []
    return serialize.withoutWrapping(FarmTransformer.transform(farm))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const seller = auth.getUserOrFail()
    const farm = await Farm.query().where('user_id', seller.id).first()

    if (!farm) return response.notFound({ message: 'Farm not found' })

    const photo = await FarmPhoto.query()
      .where('id', params.photoId)
      .where('farm_id', farm.id)
      .first()

    if (!photo) return response.notFound({ message: 'Photo not found' })

    await photo.delete()
    return response.noContent()
  }
}
