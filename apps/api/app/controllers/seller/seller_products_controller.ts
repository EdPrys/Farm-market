import Product from '#models/product'
import ProductTransformer from '#transformers/product_transformer'
import { createProductSchema, updateProductSchema } from '#validators/product'
import { zodValidate } from '#lib/zod_validate'
import type { HttpContext } from '@adonisjs/core/http'

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
}
