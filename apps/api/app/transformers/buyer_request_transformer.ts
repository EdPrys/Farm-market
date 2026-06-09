import type BuyerRequest from '#models/buyer_request'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class BuyerRequestTransformer extends BaseTransformer<BuyerRequest> {
  toObject() {
    return {
      id: this.resource.id,
      title: this.resource.title,
      description: this.resource.description ?? null,
      quantity: Number(this.resource.quantity),
      unit: this.resource.unit,
      location: this.resource.location,
      budget: this.resource.budget !== null ? Number(this.resource.budget) : null,
      expiresAt: this.resource.expiresAt?.toISO() ?? null,
      status: this.resource.status,
      createdAt: this.resource.createdAt.toISO(),
      category: this.resource.category
        ? {
            id: this.resource.category.id,
            name: this.resource.category.name,
            slug: this.resource.category.slug,
          }
        : null,
      user: this.resource.user
        ? {
            id: this.resource.user.id,
            fullName: this.resource.user.fullName ?? null,
            phone: this.resource.user.phone ?? null,
            telegram: this.resource.user.telegram ?? null,
            viber: this.resource.user.viber ?? null,
          }
        : null,
    }
  }
}
