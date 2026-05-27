export const TOKEN_KEY = 'auth_token'

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const isFormData = init?.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((init?.headers as Record<string, string>) ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...init, headers })
  if (!res.ok) {
    const body = (await res.json()) as { message?: string; errors?: Array<{ message: string }> }
    const message = body.message ?? body.errors?.[0]?.message ?? 'Request failed'
    throw new Error(message)
  }
  if (res.status === 204) return null as T
  return (await res.json()) as T
}
