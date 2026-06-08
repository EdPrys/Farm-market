import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.db.table('categories').insert({
      name: 'Риба і морепродукти',
      slug: 'fish',
      created_at: new Date(),
      updated_at: new Date(),
    })
  }

  async down() {
    await this.db.from('categories').where('slug', 'fish').delete()
  }
}
