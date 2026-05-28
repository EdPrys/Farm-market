import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('phones').notNullable().defaultTo('[]')
      table.string('telegram', 100).nullable()
      table.string('viber', 30).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('phones')
      table.dropColumn('telegram')
      table.dropColumn('viber')
    })
  }
}
