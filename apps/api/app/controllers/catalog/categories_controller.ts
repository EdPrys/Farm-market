import Category from '#models/category'
import CategoryTransformer from '#transformers/category_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class CategoriesController {
  async index({ serialize }: HttpContext) {
    const categories = await Category.all()
    return serialize(CategoryTransformer.transform(categories))
  }
}
