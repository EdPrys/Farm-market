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

router.get('/health', [controllers.health.Health, 'show'])

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
    router.get('categories', [controllers.catalog.Categories, 'index'])

    router
      .group(() => {
        router.get('/', [controllers.catalog.Products, 'index'])
        router.get('/:id', [controllers.catalog.Products, 'show'])
      })
      .prefix('products')

    router
      .group(() => {
        router.post('signup', [controllers.auth.NewAccount, 'store'])
        router.post('login', [controllers.auth.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.account.Profile, 'show'])
        router.patch('profile', [controllers.account.Profile, 'update'])
        router.post('logout', [controllers.auth.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('profile', [controllers.seller.SellerProfile, 'show'])
        router.put('profile', [controllers.seller.SellerProfile, 'update'])
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
        router.get('/:id', [controllers.farmers.Farmers, 'show'])
      })
      .prefix('farmers')

    router
      .group(() => {
        router.get('/', [controllers.chat.Conversations, 'index'])
        router.post('/', [controllers.chat.Conversations, 'store'])
        router.get('unread-count', [controllers.chat.Conversations, 'unreadCount'])

        router
          .group(() => {
            router.get('messages', [controllers.chat.Messages, 'index'])
            router.patch('read', [controllers.chat.Messages, 'markRead'])
          })
          .prefix(':id')
      })
      .prefix('conversations')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
