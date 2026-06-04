import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { profileApi } from '../api'

const mockFetch = vi.fn()

describe('profileApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  describe('updateProfile', () => {
    it('sends PATCH to /api/v1/account/profile with fullName', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, fullName: 'Іван', isSeller: false }),
      })
      await profileApi.updateProfile({ fullName: 'Іван' })
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/account/profile')
      expect(init.method).toBe('PATCH')
      expect(JSON.parse(init.body as string)).toEqual({ fullName: 'Іван' })
    })

    it('sends fullName: null to clear name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, fullName: null, isSeller: false }),
      })
      await profileApi.updateProfile({ fullName: null })
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(JSON.parse(init.body as string)).toEqual({ fullName: null })
    })
  })

  describe('becomeSeller', () => {
    it('sends PATCH to /api/v1/account/profile with isSeller and farmName', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, isSeller: true, farmName: 'Ферма Тест' }),
      })
      await profileApi.becomeSeller({ isSeller: true, farmName: 'Ферма Тест' })
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/v1/account/profile')
      expect(init.method).toBe('PATCH')
      expect(JSON.parse(init.body as string)).toEqual({ isSeller: true, farmName: 'Ферма Тест' })
    })
  })
})
