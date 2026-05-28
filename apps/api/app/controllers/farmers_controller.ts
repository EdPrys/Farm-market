import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Product from '#models/product'

export default class FarmersController {
  async show({ params, auth, response }: HttpContext) {
    const farmer = await User.query().where('id', params.id).where('is_seller', true).first()

    if (!farmer) {
      return response.notFound({ message: 'Farmer not found' })
    }

    const isAuthenticated = await auth.check()

    const products = await Product.query()
      .where('seller_id', farmer.id)
      .where('status', 'active')
      .preload('category')
      .orderBy('created_at', 'desc')

    const sellerData = { id: farmer.id, fullName: farmer.fullName, farmName: farmer.farmName }

    return response.ok({
      id: farmer.id,
      fullName: farmer.fullName,
      farmName: farmer.farmName,
      memberSince: farmer.createdAt,
      contacts: isAuthenticated
        ? { phones: farmer.phones ?? [], telegram: farmer.telegram, viber: farmer.viber }
        : null,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        quantity: p.quantity,
        imagePath: p.imagePath,
        status: p.status,
        category: p.category
          ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
          : null,
        seller: sellerData,
      })),
    })
  }
}
