import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    await db.table('categories').multiInsert([
      { name: 'Овочі', slug: 'vegetables', created_at: new Date(), updated_at: new Date() },
      { name: 'Фрукти', slug: 'fruits', created_at: new Date(), updated_at: new Date() },
      { name: "М'ясо", slug: 'meat', created_at: new Date(), updated_at: new Date() },
      { name: 'Молочні та яйця', slug: 'dairy', created_at: new Date(), updated_at: new Date() },
      { name: 'Зернові', slug: 'grains', created_at: new Date(), updated_at: new Date() },
      { name: 'Мед та варення', slug: 'honey', created_at: new Date(), updated_at: new Date() },
      { name: 'Зелень та трави', slug: 'herbs', created_at: new Date(), updated_at: new Date() },
      { name: 'Екзотика', slug: 'exotic', created_at: new Date(), updated_at: new Date() },
      { name: 'Риба і морепродукти', slug: 'fish', created_at: new Date(), updated_at: new Date() },
    ])
  }
}
