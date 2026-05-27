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

router.get('/', () => {
  return { hello: 'world' }
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
        router.get('products', [controllers.seller.SellerProducts, 'index'])
        router.post('products', [controllers.seller.SellerProducts, 'store'])
        router.put('products/:id', [controllers.seller.SellerProducts, 'update'])
        router.delete('products/:id', [controllers.seller.SellerProducts, 'destroy'])
      })
      .prefix('seller')
      .use([middleware.auth(), middleware.seller()])
  })
  .prefix('/api/v1')
