import type { HttpContext } from '@adonisjs/core/http'
import FarmReview from '#models/farm_review'
import Farm from '#models/farm'
import { zodValidate } from '#lib/zod_validate'
import { createReviewSchema } from '#validators/farm_review'

export default class FarmReviewsController {
  async index({ params, request, response }: HttpContext) {
    const farmId = Number(params.id)
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return response.notFound({ message: 'Farm not found' })
    }

    const farm = await Farm.query().where('id', farmId).first()
    if (!farm) return response.notFound({ message: 'Farm not found' })

    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const reviews = await FarmReview.query()
      .where('farm_id', farmId)
      .preload('user')
      .orderBy('created_at', 'desc')
      .paginate(page, 20)

    const data = reviews.all().map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
      user: { id: r.user.id, fullName: r.user.fullName },
    }))

    return response.json({ data, meta: reviews.getMeta() })
  }

  async store({ params, request, auth, response }: HttpContext) {
    const farmId = Number(params.id)
    if (!Number.isInteger(farmId) || farmId <= 0) {
      return response.notFound({ message: 'Farm not found' })
    }

    const farm = await Farm.query().where('id', farmId).first()
    if (!farm) return response.notFound({ message: 'Farm not found' })

    const user = auth.getUserOrFail()
    const body = zodValidate(createReviewSchema, request.body())

    const review = await FarmReview.create({
      farmId,
      userId: user.id,
      rating: body.rating,
      text: body.text,
    })
    await review.load('user')

    response.status(201)
    return response.json({
      id: review.id,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      user: { id: review.user.id, fullName: review.user.fullName },
    })
  }
}
