import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from '../use-cart'

const item1 = {
  productId: 1,
  name: 'Картопля',
  price: '18.00',
  unit: 'кг',
  imagePath: null,
  sellerName: 'Ферма Коваль',
  sellerId: 10,
}

const item2 = {
  productId: 2,
  name: 'Морква',
  price: '15.00',
  unit: 'кг',
  imagePath: null,
  sellerName: 'Ферма Коваль',
  sellerId: 10,
}

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('starts empty', () => {
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('addItem adds a new item with quantity 1', () => {
    useCartStore.getState().addItem(item1)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(1)
    expect(items[0].name).toBe('Картопля')
  })

  it('addItem increments quantity when same product added again', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item1)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('addItem keeps separate entries for different products', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item2)
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('removeItem removes item by productId', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().removeItem(1)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('removeItem does nothing for unknown productId', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().removeItem(999)
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('updateQuantity changes item quantity', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().updateQuantity(1, 5)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('updateQuantity removes item when quantity is 0', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().updateQuantity(1, 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('updateQuantity removes item when quantity is negative', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().updateQuantity(1, -1)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clearCart removes all items', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item2)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
