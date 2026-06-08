import { FarmSchema } from '#database/schema'
import { column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import FarmPhoto from '#models/farm_photo'

export default class Farm extends FarmSchema {
  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: string | string[]) =>
      typeof value === 'string' ? JSON.parse(value) : (value ?? []),
  })
  declare activities: string[]

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @hasMany(() => FarmPhoto)
  declare photos: HasMany<typeof FarmPhoto>
}
