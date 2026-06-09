import type Farm from '#models/farm'
import { BaseTransformer } from '@adonisjs/core/transformers'

interface ProductSummary {
  id: number
  name: string
  price: string
  unit: string
  quantity: string
  imagePath: string | null
  status: string
  category: { id: number; name: string; slug: string } | null
  seller: { id: number; farmName: string | null; fullName: string | null }
}

export default class FarmTransformer extends BaseTransformer<Farm> {
  toObject() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      description: this.resource.description ?? null,
      coverImagePath: this.resource.coverImagePath ?? null,
      location: this.resource.location ?? null,
      activities: this.resource.activities ?? [],
      instagram: this.resource.instagram ?? null,
      photos: (this.resource.photos ?? []).map((p) => ({
        id: p.id,
        imagePath: p.imagePath,
        position: p.position,
      })),
      products: (this.resource.$extras?.products ?? []) as ProductSummary[],
      farmer: this.resource.user
        ? { id: this.resource.user.id, fullName: this.resource.user.fullName }
        : null,
      reviewCount: (this.resource.$extras?.reviewCount ?? 0) as number,
      avgRating: (this.resource.$extras?.avgRating ?? null) as number | null,
    }
  }
}
