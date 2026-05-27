import type Product from '#models/product'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ProductTransformer extends BaseTransformer<Product> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'price',
        'unit',
        'quantity',
        'imagePath',
        'status',
      ]),
      category: this.resource.category
        ? {
            id: this.resource.category.id,
            name: this.resource.category.name,
            slug: this.resource.category.slug,
          }
        : null,
      seller: this.resource.seller
        ? {
            id: this.resource.seller.id,
            fullName: this.resource.seller.fullName,
            farmName: this.resource.seller.farmName,
          }
        : null,
    }
  }
}
