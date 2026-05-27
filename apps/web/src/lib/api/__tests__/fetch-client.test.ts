import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '../fetch-client'

const mockFetch = vi.fn()

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  it('sends Content-Type header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await apiFetch('/api/v1/test')

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('sends no Authorization header when localStorage has no token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await apiFetch('/api/v1/test')

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined()
  })

  it('sends Bearer token from localStorage', async () => {
    localStorage.setItem('auth_token', 'oat_abc123')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await apiFetch('/api/v1/test')

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer oat_abc123')
  })

  it('throws Error with message from response body on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    })

    await expect(apiFetch('/api/v1/auth/login')).rejects.toThrow('Invalid credentials')
  })

  it('throws generic error when response body has no message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    })

    await expect(apiFetch('/api/v1/test')).rejects.toThrow('Request failed')
  })
})
