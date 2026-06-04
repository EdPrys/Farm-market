import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('buyer_id').unsigned().notNullable().references('id').inTable('users')
      table.integer('seller_id').unsigned().notNullable().references('id').inTable('users')
      table.timestamps(true, true)
      table.unique(['buyer_id', 'seller_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
