import { FarmPhotoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Farm from '#models/farm'

export default class FarmPhoto extends FarmPhotoSchema {
  static updatedAtColumn: string | null = null

  @belongsTo(() => Farm)
  declare farm: BelongsTo<typeof Farm>
}
