import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { farmersApi } from '../api'

const mockFetch = vi.fn()

describe('farmersApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('getFarmer', () => {
    it('calls GET /api/v1/farmers/:id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      await farmersApi.getFarmer(7)
      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toBe('/api/v1/farmers/7')
    })
  })
})
