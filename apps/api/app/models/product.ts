import { ProductSchema } from '#database/schema'
import { column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Category from '#models/category'

export default class Product extends ProductSchema {
  declare status: 'active' | 'inactive' | 'archived'

  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: string | string[]) =>
      typeof value === 'string' ? JSON.parse(value) : (value ?? []),
  })
  declare deliveryMethods: string[]

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => User, { foreignKey: 'sellerId' })
  declare seller: BelongsTo<typeof User>
}
