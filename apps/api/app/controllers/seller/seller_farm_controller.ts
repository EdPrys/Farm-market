import type { HttpContext } from '@adonisjs/core/http'
import Farm from '#models/farm'
import FarmTransformer from '#transformers/farm_transformer'
import { zodValidate } from '#lib/zod_validate'
import { createFarmSchema, updateFarmSchema } from '#validators/farm'
import { getStorageService } from '#services/storage_service'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

export default class SellerFarmController {
  async show({ auth, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const farm = await Farm.query()
      .where('user_id', seller.id)
      .preload('photos', (q) => q.orderBy('position', 'asc').orderBy('created_at', 'asc'))
      .first()

    if (!farm) return response.notFound({ message: 'Farm not found' })

    farm.$extras.products = []
    return serialize.withoutWrapping(FarmTransformer.transform(farm))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()

    const existing = await Farm.query().where('user_id', seller.id).first()
    if (existing) return response.conflict({ message: 'Farm already exists' })

    const data = zodValidate(createFarmSchema, request.body())
    const farm = await Farm.create({
      userId: seller.id,
      name: data.name,
      description: data.description ?? null,
      location: data.location ?? null,
      activities: data.activities ?? [],
      instagram: data.instagram ?? null,
    })
    await farm.load('photos')
    farm.$extras.products = []

    response.status(201)
    return serialize.withoutWrapping(FarmTransformer.transform(farm))
  }

  async update({ auth, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const farm = await Farm.query().where('user_id', seller.id).preload('photos').first()

    if (!farm) return response.notFound({ message: 'Farm not found' })

    const data = zodValidate(updateFarmSchema, request.body())
    if (data.name !== undefined) farm.name = data.name
    if (data.description !== undefined) farm.description = data.description ?? null
    if (data.location !== undefined) farm.location = data.location ?? null
    if (data.activities !== undefined) farm.activities = data.activities
    if (data.instagram !== undefined) farm.instagram = data.instagram ?? null
    await farm.save()

    farm.$extras.products = []
    return serialize.withoutWrapping(FarmTransformer.transform(farm))
  }

  async uploadCover({ auth, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const farm = await Farm.query().where('user_id', seller.id).preload('photos').first()

    if (!farm) return response.notFound({ message: 'Farm not found' })

    const image = request.file('image', { size: '5mb', extnames: ['jpg', 'jpeg', 'png', 'webp'] })
    if (!image) return response.unprocessableEntity({ message: 'No image provided' })
    if (!image.isValid) return response.unprocessableEntity({ message: image.errors })

    const key = `farms/covers/${randomUUID()}.${image.extname}`
    const buffer = await readFile(image.tmpPath!)
    const contentType = image.headers['content-type'] ?? 'image/jpeg'

    farm.coverImagePath = await getStorageService().upload(buffer, key, contentType)
    await farm.save()

    farm.$extras.products = []
    return serialize.withoutWrapping(FarmTransformer.transform(farm))
  }
}
