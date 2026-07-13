import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogApi } from '../api'

const mockFetch = vi.fn()

describe('catalogApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('getProducts', () => {
    it('calls GET /api/v1/products', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({})
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/products')
    })

    it('appends category param when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({ category: 'vegetables' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('category=vegetables')
    })

    it('appends search param when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({ search: 'томати' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(decodeURIComponent(url)).toContain('search=томати')
    })

    it('appends limit param when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({ limit: 8 })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('limit=8')
    })

    it('appends random=true when random is true', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({ random: true })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('random=true')
    })

    it('appends deliveryMethod param when provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getProducts({ deliveryMethod: 'nova_poshta' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('deliveryMethod=nova_poshta')
    })
  })

  describe('getProduct', () => {
    it('calls GET /api/v1/products/:id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      await catalogApi.getProduct(42)
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/products/42')
    })
  })

  describe('getCategories', () => {
    it('calls GET /api/v1/categories', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
      await catalogApi.getCategories()
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/categories')
    })
  })
})
