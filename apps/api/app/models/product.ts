import { ProductSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Category from '#models/category'

export default class Product extends ProductSchema {
  declare status: 'active' | 'inactive' | 'archived'

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => User, { foreignKey: 'sellerId' })
  declare seller: BelongsTo<typeof User>
}
