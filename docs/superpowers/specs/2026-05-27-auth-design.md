# Auth Design

**Date:** 2026-05-27
**Scope:** API auth verification (Postman) + Web auth implementation (React)

---

## Overview

The API auth layer is already implemented in AdonisJS. This spec covers:
1. Verifying the existing API auth endpoints work correctly via Postman
2. Implementing auth UI and state management on the React frontend

Token-based auth (Bearer token). Token stored in `localStorage`.

---

## API Endpoints (already implemented)

| Method | Path | Auth required | Description |
|--------|------|--------------|-------------|
| POST | `/api/v1/auth/signup` | No | Create account, returns `{ user, token }` |
| POST | `/api/v1/auth/login` | No | Verify credentials, returns `{ user, token }` |
| GET | `/api/v1/account/profile` | Yes | Returns current user |
| POST | `/api/v1/account/logout` | Yes | Deletes current access token |

**Signup body:**
```json
{
  "fullName": "Іван Петренко",
  "email": "ivan@example.com",
  "password": "secret123",
  "passwordConfirmation": "secret123"
}
```

**Login body:**
```json
{
  "email": "ivan@example.com",
  "password": "secret123"
}
```

**Auth header:** `Authorization: Bearer <token>`

---

## Architecture

```
localStorage (key: "auth_token")
    ↓ read/write
AuthContext  ←→  useAuth() hook
    ↓
fetchClient (attaches Bearer token from localStorage)
    ↓
TanStack Query
├── useQuery(['user'])      → GET /api/v1/account/profile
├── useMutation(login)      → POST /api/v1/auth/login
├── useMutation(signup)     → POST /api/v1/auth/signup
└── useMutation(logout)     → POST /api/v1/account/logout

TanStack Router
├── /login                  (public — redirect to /dashboard if authenticated)
├── /signup                 (public — redirect to /dashboard if authenticated)
└── /_authenticated         (layout route — beforeLoad guards)
    └── /dashboard          (protected)
```

---

## Web File Structure

```
apps/web/src/
├── lib/
│   ├── auth/
│   │   ├── auth-context.tsx       # AuthContext + AuthProvider
│   │   ├── use-auth.ts            # useAuth() hook
│   │   ├── use-current-user.ts    # useQuery(['user'])
│   │   ├── use-login.ts           # useMutation for login
│   │   ├── use-signup.ts          # useMutation for signup
│   │   └── use-logout.ts          # useMutation for logout
│   └── api/
│       └── fetch-client.ts        # fetch wrapper with Bearer token
├── routes/
│   ├── __root.tsx                 # QueryClientProvider + AuthProvider
│   ├── login.tsx                  # Login page
│   ├── signup.tsx                 # Signup page
│   └── _authenticated.tsx         # Protected layout route
│       └── dashboard.tsx          # Dashboard page
└── .env                           # VITE_API_URL=http://localhost:3333
```

---

## AuthContext

```ts
// src/lib/auth/auth-context.tsx
interface AuthContextValue {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
  isAuthenticated: boolean
}
```

- Initializes from `localStorage.getItem('auth_token')`
- `setToken`: saves to `localStorage` + updates React state
- `clearToken`: removes from `localStorage` + sets state to `null`
- `isAuthenticated`: `token !== null`

---

## fetchClient

```ts
// src/lib/api/fetch-client.ts
// Reads token directly from localStorage (avoids circular dependency with context)
async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
```

---

## TanStack Query Hooks

**useCurrentUser** — enabled only when token exists, no retry on failure:
```ts
useQuery({
  queryKey: ['user'],
  queryFn: () => apiFetch('/api/v1/account/profile'),
  enabled: !!token,
  retry: false,
})
```

**useLogin** — on success: `setToken` + invalidate `['user']`:
```ts
useMutation({
  mutationFn: (data) => apiFetch('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  onSuccess: ({ token }) => { setToken(token); queryClient.invalidateQueries({ queryKey: ['user'] }) },
})
```

**useSignup** — same as login on success.

**useLogout** — on success: `clearToken` + `queryClient.clear()`:
```ts
useMutation({
  mutationFn: () => apiFetch('/api/v1/account/logout', { method: 'POST' }),
  onSuccess: () => { clearToken(); queryClient.clear() },
})
```

---

## Route Protection

`_authenticated.tsx` layout route uses `beforeLoad`:
```ts
beforeLoad: ({ context }) => {
  if (!context.auth.isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}
```

Auth context is passed via TanStack Router's router context (set in `__root.tsx`).

Public routes (`/login`, `/signup`) redirect to `/dashboard` if already authenticated.

---

## Dependencies to add (web)

```
@tanstack/react-query
@tanstack/react-query-devtools
```

---

## Environment

```
# apps/web/.env
VITE_API_URL=http://localhost:3333
```

CORS: uncomment and set in `apps/api/.env`:
```
CORS_ORIGIN=http://localhost:5173
```

---

## Success Criteria

1. `POST /signup` creates a user and returns a token — verified in Postman
2. `POST /login` returns a token — verified in Postman
3. `GET /profile` with Bearer token returns user — verified in Postman
4. `POST /logout` deletes token — verified in Postman
5. Web: signup form creates account and redirects to dashboard
6. Web: login form authenticates and redirects to dashboard
7. Web: dashboard shows user profile data from `useCurrentUser`
8. Web: logout clears token and redirects to login
9. Web: accessing `/dashboard` without token redirects to `/login`
10. Web: accessing `/login` while authenticated redirects to `/dashboard`
