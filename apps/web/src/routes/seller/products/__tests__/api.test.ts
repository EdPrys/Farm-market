import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sellerApi } from '../api'

const mockFetch = vi.fn()

describe('sellerApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.setItem('auth_token', 'test_token')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
    localStorage.clear()
  })

  it('getProducts calls GET /api/v1/seller/products', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    await sellerApi.getProducts()
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toBe('/api/v1/seller/products')
  })

  it('createProduct calls POST /api/v1/seller/products', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    await sellerApi.createProduct({ name: 'X', categoryId: 1, price: 10, unit: 'кг', quantity: 1 })
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/seller/products')
    expect(init.method).toBe('POST')
  })

  it('updateProduct calls PUT /api/v1/seller/products/:id', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    await sellerApi.updateProduct(5, { name: 'Y' })
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/seller/products/5')
    expect(init.method).toBe('PUT')
  })

  it('deleteProduct calls DELETE /api/v1/seller/products/:id', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve(null) })
    await sellerApi.deleteProduct(3)
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/seller/products/3')
    expect(init.method).toBe('DELETE')
  })

  it('uploadImage calls POST /api/v1/seller/products/:id/image with FormData', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' })
    await sellerApi.uploadImage(7, file)
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/seller/products/7/image')
    expect(init.body).toBeInstanceOf(FormData)
  })
})
