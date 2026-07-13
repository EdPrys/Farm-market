import Product from '#models/product'
import ProductTransformer from '#transformers/product_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductsController {
  async index({ request, serialize }: HttpContext) {
    const { category, search, limit, random, deliveryMethod } = request.qs() as {
      category?: string
      search?: string
      limit?: string
      random?: string
      deliveryMethod?: string
    }

    const query = Product.query().where('status', 'active').preload('category').preload('seller')

    if (random === 'true') {
      query.orderByRaw('RANDOM()')
    } else {
      query.orderBy('created_at', 'desc')
    }

    if (category) {
      query.whereHas('category', (q) => q.where('slug', category))
    }

    if (search) {
      query.whereILike('name', `%${search}%`)
    }

    if (deliveryMethod) {
      query.whereRaw('delivery_methods @> ?', [JSON.stringify([deliveryMethod])])
    }

    if (limit) {
      query.limit(Number(limit))
    }

    const products = await query
    return serialize(ProductTransformer.transform(products))
  }

  async show({ params, auth, response }: HttpContext) {
    const product = await Product.query()
      .where('id', params.id)
      .preload('category')
      .preload('seller')
      .first()

    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    const isAuthenticated = await auth.check()

    return response.ok({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      quantity: product.quantity,
      imagePath: product.imagePath,
      status: product.status,
      deliveryMethods: product.deliveryMethods,
      category: product.category
        ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
        : null,
      seller: product.seller
        ? {
            id: product.seller.id,
            fullName: product.seller.fullName,
            farmName: product.seller.farmName,
            contacts: isAuthenticated
              ? {
                  phone: product.seller.phone ?? null,
                  telegram: product.seller.telegram ?? null,
                  viber: product.seller.viber ?? null,
                }
              : null,
          }
        : null,
    })
  }
}
