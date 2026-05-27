import Product from '#models/product'
import ProductTransformer from '#transformers/product_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductsController {
  async index({ request, serialize }: HttpContext) {
    const { category, search } = request.qs() as { category?: string; search?: string }

    const query = Product.query()
      .where('status', 'active')
      .preload('category')
      .preload('seller')
      .orderBy('created_at', 'desc')

    if (category) {
      query.whereHas('category', (q) => q.where('slug', category))
    }

    if (search) {
      query.whereILike('name', `%${search}%`)
    }

    const products = await query
    return serialize(ProductTransformer.transform(products))
  }

  async show({ params, serialize, response }: HttpContext) {
    const product = await Product.query()
      .where('id', params.id)
      .preload('category')
      .preload('seller')
      .first()

    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    return serialize.withoutWrapping(ProductTransformer.transform(product))
  }
}
