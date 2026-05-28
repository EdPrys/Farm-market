/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import app from '@adonisjs/core/services/app'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/health', [controllers.Health, 'show'])

router.get('/uploads/*', async ({ request, response }) => {
  const parts = request.param('*') as string[]
  const absolutePath = app.makePath('storage', 'uploads', ...parts)
  try {
    const stats = await stat(absolutePath)
    response.header('Content-Length', String(stats.size))
    return response.stream(createReadStream(absolutePath))
  } catch {
    return response.notFound({ message: 'File not found' })
  }
})

router
  .group(() => {
    router.get('categories', [controllers.Categories, 'index'])

    router
      .group(() => {
        router.get('/', [controllers.Products, 'index'])
        router.get('/:id', [controllers.Products, 'show'])
      })
      .prefix('products')

    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('profile', [
          () => import('#controllers/seller/seller_profile_controller'),
          'show',
        ])
        router.put('profile', [
          () => import('#controllers/seller/seller_profile_controller'),
          'update',
        ])
        router.get('products', [controllers.seller.SellerProducts, 'index'])
        router.post('products', [controllers.seller.SellerProducts, 'store'])
        router.put('products/:id', [controllers.seller.SellerProducts, 'update'])
        router.delete('products/:id', [controllers.seller.SellerProducts, 'destroy'])
        router.post('products/:id/image', [controllers.seller.SellerProducts, 'uploadImage'])
      })
      .prefix('seller')
      .use([middleware.auth(), middleware.seller()])

    router
      .group(() => {
        router.get('/:id', [() => import('#controllers/farmers_controller'), 'show'])
      })
      .prefix('farmers')
  })
  .prefix('/api/v1')
