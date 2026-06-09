import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestsApi } from '../api'

const mockFetch = vi.fn()

describe('requestsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('getRequests', () => {
    it('calls GET /api/v1/requests with no params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: {} }),
      })
      await requestsApi.getRequests({})
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/requests')
    })

    it('appends category param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: {} }),
      })
      await requestsApi.getRequests({ category: 'fish' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('category=fish')
    })

    it('appends location param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: {} }),
      })
      await requestsApi.getRequests({ location: 'Київ' })
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(decodeURIComponent(url)).toContain('location=Київ')
    })
  })

  describe('createRequest', () => {
    it('calls POST /api/v1/requests with payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, title: 'Test' }),
      })
      await requestsApi.createRequest({
        title: 'Test',
        categoryId: 1,
        quantity: 5,
        unit: 'кг',
        location: 'Київ',
      })
      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/requests')
      expect(opts.method).toBe('POST')
      expect(JSON.parse(opts.body as string)).toMatchObject({ title: 'Test', quantity: 5 })
    })
  })

  describe('closeRequest', () => {
    it('calls PATCH /api/v1/requests/:id with status closed', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      await requestsApi.closeRequest(42)
      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/requests/42')
      expect(opts.method).toBe('PATCH')
      expect(JSON.parse(opts.body as string)).toEqual({ status: 'closed' })
    })
  })

  describe('deleteRequest', () => {
    it('calls DELETE /api/v1/requests/:id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve(null) })
      await requestsApi.deleteRequest(7)
      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/requests/7')
      expect(opts.method).toBe('DELETE')
    })
  })
})
