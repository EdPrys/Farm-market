import Product from '#models/product'
import ProductTransformer from '#transformers/product_transformer'
import { createProductSchema, updateProductSchema } from '#validators/product'
import { zodValidate } from '#lib/zod_validate'
import { getStorageService } from '#services/storage_service'
import type { HttpContext } from '@adonisjs/core/http'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

export default class SellerProductsController {
  async index({ auth, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const products = await Product.query()
      .where('seller_id', seller.id)
      .preload('category')
      .preload('seller')
      .orderBy('created_at', 'desc')
    return serialize(ProductTransformer.transform(products))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const data = zodValidate(createProductSchema, request.body())
    const product = await Product.create({
      name: data.name,
      categoryId: data.categoryId,
      description: data.description ?? null,
      price: String(data.price),
      unit: data.unit,
      quantity: String(data.quantity),
      status: data.status ?? 'active',
      deliveryMethods: data.deliveryMethods ?? [],
      sellerId: seller.id,
    })
    await product.load('category')
    await product.load('seller')
    response.status(201)
    return serialize.withoutWrapping(ProductTransformer.transform(product))
  }

  async update({ auth, params, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const product = await Product.query()
      .where('id', params.id)
      .where('seller_id', seller.id)
      .preload('category')
      .preload('seller')
      .first()

    if (!product) return response.notFound({ message: 'Product not found' })

    const data = zodValidate(updateProductSchema, request.body())
    if (data.name !== undefined) product.name = data.name
    if (data.categoryId !== undefined) product.categoryId = data.categoryId
    if (data.description !== undefined) product.description = data.description ?? null
    if (data.price !== undefined) product.price = String(data.price)
    if (data.unit !== undefined) product.unit = data.unit
    if (data.quantity !== undefined) product.quantity = String(data.quantity)
    if (data.status !== undefined) product.status = data.status
    if (data.deliveryMethods !== undefined) product.deliveryMethods = data.deliveryMethods
    await product.save()

    return serialize.withoutWrapping(ProductTransformer.transform(product))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const seller = auth.getUserOrFail()
    const product = await Product.query()
      .where('id', params.id)
      .where('seller_id', seller.id)
      .first()

    if (!product) return response.notFound({ message: 'Product not found' })

    await product.delete()
    return response.noContent()
  }

  async uploadImage({ auth, params, request, response, serialize }: HttpContext) {
    const seller = auth.getUserOrFail()
    const product = await Product.query()
      .where('id', params.id)
      .where('seller_id', seller.id)
      .preload('category')
      .preload('seller')
      .first()

    if (!product) return response.notFound({ message: 'Product not found' })

    const image = request.file('image', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!image) return response.unprocessableEntity({ message: 'No image provided' })
    if (!image.isValid) return response.unprocessableEntity({ message: image.errors })

    const key = `products/${randomUUID()}.${image.extname}`
    const buffer = await readFile(image.tmpPath!)
    const contentType = image.headers['content-type'] ?? 'image/jpeg'

    product.imagePath = await getStorageService().upload(buffer, key, contentType)
    await product.save()

    return serialize.withoutWrapping(ProductTransformer.transform(product))
  }
}
