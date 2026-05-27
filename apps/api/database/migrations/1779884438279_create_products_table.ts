import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('seller_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('RESTRICT')
      table.string('name', 255).notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('unit', 50).notNullable()
      table.decimal('quantity', 10, 3).notNullable().defaultTo(0)
      table.string('image_path', 255).nullable()
      table.enu('status', ['active', 'inactive', 'archived']).notNullable().defaultTo('active')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
