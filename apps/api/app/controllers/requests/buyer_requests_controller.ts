import BuyerRequest from '#models/buyer_request'
import BuyerRequestTransformer from '#transformers/buyer_request_transformer'
import { zodValidate } from '#lib/zod_validate'
import { createBuyerRequestSchema, updateBuyerRequestSchema } from '#validators/buyer_request'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class BuyerRequestsController {
  async index({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const category = request.input('category') as string | undefined
    const location = request.input('location') as string | undefined

    const query = BuyerRequest.query()
      .where('status', 'active')
      .preload('user')
      .preload('category')
      .orderBy('created_at', 'desc')

    if (category) {
      query.whereHas('category', (q) => q.where('slug', category))
    }

    if (location) {
      query.whereILike('location', `%${location}%`)
    }

    const requests = await query.paginate(page, 20)
    return response.ok({
      data: BuyerRequestTransformer.transform(requests.all()),
      meta: requests.getMeta(),
    })
  }

  async show({ params, response, serialize }: HttpContext) {
    const buyerRequest = await BuyerRequest.query()
      .where('id', params.id)
      .preload('user')
      .preload('category')
      .first()

    if (!buyerRequest) return response.notFound({ message: 'Request not found' })
    return serialize.withoutWrapping(BuyerRequestTransformer.transform(buyerRequest))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = zodValidate(createBuyerRequestSchema, request.body())

    const buyerRequest = await BuyerRequest.create({
      userId: user.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description ?? null,
      quantity: String(data.quantity),
      unit: data.unit,
      location: data.location,
      budget: data.budget !== null ? String(data.budget) : null,
      expiresAt: data.expiresAt ? DateTime.fromISO(data.expiresAt) : null,
      status: 'active',
    })

    await buyerRequest.load('user')
    await buyerRequest.load('category')
    return serialize.withoutWrapping(BuyerRequestTransformer.transform(buyerRequest))
  }

  async update({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const buyerRequest = await BuyerRequest.find(params.id)

    if (!buyerRequest) return response.notFound({ message: 'Request not found' })
    if (buyerRequest.userId !== user.id) return response.forbidden({ message: 'Forbidden' })

    const data = zodValidate(updateBuyerRequestSchema, request.body())

    buyerRequest.merge({
      ...(data.status !== undefined && { status: data.status }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.quantity !== undefined && { quantity: String(data.quantity) }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.budget !== undefined && {
        budget: data.budget !== null ? String(data.budget) : null,
      }),
      ...(data.expiresAt !== undefined && { expiresAt: DateTime.fromISO(data.expiresAt) }),
    })
    await buyerRequest.save()
    await buyerRequest.load('user')
    await buyerRequest.load('category')
    return serialize.withoutWrapping(BuyerRequestTransformer.transform(buyerRequest))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const buyerRequest = await BuyerRequest.find(params.id)

    if (!buyerRequest) return response.notFound({ message: 'Request not found' })
    if (buyerRequest.userId !== user.id) return response.forbidden({ message: 'Forbidden' })

    await buyerRequest.delete()
    return response.noContent()
  }
}
