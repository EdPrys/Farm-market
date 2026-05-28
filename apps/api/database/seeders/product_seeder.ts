import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'

export default class extends BaseSeeder {
  async run() {
    const password = await hash.make('password123')
    const now = new Date()

    const [maria] = await db
      .table('users')
      .insert({
        email: 'maria@test.com',
        password,
        full_name: 'Марія Коваль',
        farm_name: 'Ферма Коваль',
        is_seller: true,
        created_at: now,
        updated_at: now,
      })
      .returning('id')

    const [ivan] = await db
      .table('users')
      .insert({
        email: 'ivan@test.com',
        password,
        full_name: 'Іван Мельник',
        farm_name: 'Садиба Мельників',
        is_seller: true,
        created_at: now,
        updated_at: now,
      })
      .returning('id')

    const mariaId = maria.id as number
    const ivanId = ivan.id as number

    const cats = await db.from('categories').select('id', 'slug')
    const cat = (slug: string) => cats.find((c) => c.slug === slug)!.id

    await db.table('products').multiInsert([
      // Марія — Ферма Коваль
      {
        seller_id: mariaId,
        category_id: cat('vegetables'),
        name: 'Картопля молода',
        description: 'Свіжа молода картопля з власного городу, вирощена без хімії',
        price: 18.0,
        unit: 'кг',
        quantity: 200,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: mariaId,
        category_id: cat('vegetables'),
        name: 'Буряк столовий',
        description: 'Солодкий буряк, ідеальний для борщу та салатів',
        price: 12.0,
        unit: 'кг',
        quantity: 150,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: mariaId,
        category_id: cat('vegetables'),
        name: 'Морква',
        description: 'Соковита морква домашнього вирощування',
        price: 15.0,
        unit: 'кг',
        quantity: 100,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: mariaId,
        category_id: cat('herbs'),
        name: 'Кріп свіжий',
        description: 'Пучок свіжого кропу, зібраного вранці',
        price: 8.0,
        unit: 'пучок',
        quantity: 50,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: mariaId,
        category_id: cat('herbs'),
        name: 'Петрушка',
        description: 'Ароматна петрушка з городу',
        price: 8.0,
        unit: 'пучок',
        quantity: 40,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: mariaId,
        category_id: cat('dairy'),
        name: 'Молоко домашнє',
        description: 'Свіже молоко від власної корови, жирність 3.8%',
        price: 35.0,
        unit: 'л',
        quantity: 20,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: mariaId,
        category_id: cat('dairy'),
        name: 'Сметана домашня',
        description: 'Густа натуральна сметана, жирність 25%',
        price: 80.0,
        unit: 'л',
        quantity: 10,
        status: 'active',
        created_at: now,
        updated_at: now,
      },

      // Іван — Садиба Мельників
      {
        seller_id: ivanId,
        category_id: cat('fruits'),
        name: 'Яблука Антонівка',
        description: 'Соковиті яблука сорту Антонівка з власного саду',
        price: 22.0,
        unit: 'кг',
        quantity: 300,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: ivanId,
        category_id: cat('fruits'),
        name: 'Груші Вільямс',
        description: 'Стиглі солодкі груші, зібрані вручну',
        price: 35.0,
        unit: 'кг',
        quantity: 120,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: ivanId,
        category_id: cat('fruits'),
        name: 'Сливи угорка',
        description: 'Темно-сині сливи, солодкі та соковиті',
        price: 28.0,
        unit: 'кг',
        quantity: 80,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: ivanId,
        category_id: cat('honey'),
        name: 'Мед акацієвий',
        description: 'Світлий рідкий мед з квітів акації, зібраний у травні',
        price: 180.0,
        unit: 'банка',
        quantity: 30,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: ivanId,
        category_id: cat('honey'),
        name: 'Мед гречаний',
        description: 'Темний ароматний мед з гречки, багатий на залізо',
        price: 200.0,
        unit: 'банка',
        quantity: 25,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: ivanId,
        category_id: cat('grains'),
        name: 'Борошно пшеничне',
        description: 'Борошно вищого ґатунку власного помелу',
        price: 45.0,
        unit: 'кг',
        quantity: 500,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        seller_id: ivanId,
        category_id: cat('grains'),
        name: 'Гречка',
        description: 'Зелена гречка власного вирощування, без обробки',
        price: 55.0,
        unit: 'кг',
        quantity: 200,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ])
  }
}
