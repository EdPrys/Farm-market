import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('farm_photos', (table) => {
      table.increments('id')
      table.integer('farm_id').unsigned().notNullable().references('farms.id').onDelete('CASCADE')
      table.string('image_path').notNullable()
      table.integer('position').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('farm_photos')
  }
}
