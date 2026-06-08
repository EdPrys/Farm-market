import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('farm_reviews', (table) => {
      table.increments('id')
      table.integer('farm_id').unsigned().notNullable().references('farms.id').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.integer('rating').unsigned().notNullable()
      table.text('text').notNullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('farm_reviews')
  }
}
