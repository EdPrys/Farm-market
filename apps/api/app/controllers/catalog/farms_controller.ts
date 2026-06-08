import type { HttpContext } from '@adonisjs/core/http'
import Farm from '#models/farm'
import Product from '#models/product'
import FarmTransformer from '#transformers/farm_transformer'
import db from '@adonisjs/lucid/services/db'

export default class FarmsController {
  async index({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const farmsPage = await Farm.query().orderBy('created_at', 'desc').paginate(page, 20)

    const farmIds = farmsPage.all().map((f) => f.id)
    const stats =
      farmIds.length > 0
        ? await db
            .from('farm_reviews')
            .whereIn('farm_id', farmIds)
            .groupBy('farm_id')
            .select('farm_id')
            .count('* as review_count')
            .avg('rating as avg_rating')
        : []

    const statsMap = new Map(stats.map((s: any) => [Number(s.farm_id), s]))

    const data = farmsPage.all().map((farm) => {
      const stat = statsMap.get(farm.id)
      return {
        id: farm.id,
        name: farm.name,
        location: farm.location ?? null,
        coverImagePath: farm.coverImagePath ?? null,
        activities: farm.activities ?? [],
        reviewCount: Number(stat?.review_count ?? 0),
        avgRating: stat?.avg_rating ? Number(Number(stat.avg_rating).toFixed(1)) : null,
      }
    })

    return response.json({ data, meta: farmsPage.getMeta() })
  }

  async show({ params, response, serialize }: HttpContext) {
    const farmId = Number(params.id)
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return response.notFound({ message: 'Farm not found' })
    }

    const farm = await Farm.query()
      .where('id', farmId)
      .preload('user')
      .preload('photos', (q) => q.orderBy('position', 'asc').orderBy('created_at', 'asc'))
      .first()

    if (!farm) return response.notFound({ message: 'Farm not found' })

    const products = await Product.query()
      .where('seller_id', farm.userId)
      .where('status', 'active')
      .preload('category')
      .orderBy('created_at', 'desc')
      .limit(50)

    farm.$extras.products = products.map((p) => ({
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
    }))

    return serialize.withoutWrapping(FarmTransformer.transform(farm))
  }
}
