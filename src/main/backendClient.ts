import type { AccountProfile, CosmeticItem } from '../shared/types'

// Backend artık Railway'de canlı — arkadaşların ayrıca bir şey kurmadan
// bu adrese bağlanır. Yerel geliştirmede farklı bir backend'e (örn.
// localhost:4000) bağlanmak istersen ZEWO_BACKEND_URL ile geçersiz kılabilirsin.
const BASE_URL = process.env.ZEWO_BACKEND_URL || 'https://zewo-backend-production.up.railway.app'

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    })
  } catch {
    throw new Error('Zewo sunucusuna ulaşılamadı. Backend çalışıyor mu?')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Sunucu hatası (${res.status})`)
  }
  return data as T
}

export function registerAccount(
  username: string,
  password: string
): Promise<{ token: string; profile: AccountProfile }> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

export function loginAccount(
  username: string,
  password: string
): Promise<{ token: string; profile: AccountProfile }> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

export function fetchMe(token: string): Promise<{ profile: AccountProfile }> {
  return request('/api/me', {}, token)
}

export function fetchCosmeticsCatalog(token: string): Promise<{ cosmetics: CosmeticItem[] }> {
  return request('/api/cosmetics', {}, token)
}

export function adminListUsers(token: string): Promise<{ users: AccountProfile[] }> {
  return request('/api/admin/users', {}, token)
}

export function adminGrantCosmetic(
  token: string,
  userId: number,
  cosmeticId: number
): Promise<{ profile: AccountProfile }> {
  return request(
    `/api/admin/users/${userId}/cosmetics`,
    { method: 'POST', body: JSON.stringify({ cosmeticId }) },
    token
  )
}

export function adminRevokeCosmetic(
  token: string,
  userId: number,
  cosmeticId: number
): Promise<{ profile: AccountProfile }> {
  return request(`/api/admin/users/${userId}/cosmetics/${cosmeticId}`, { method: 'DELETE' }, token)
}

export function adminResetPassword(
  token: string,
  userId: number,
  newPassword: string
): Promise<{ profile: AccountProfile }> {
  return request(
    `/api/admin/users/${userId}/reset-password`,
    { method: 'POST', body: JSON.stringify({ newPassword }) },
    token
  )
}

export function adminDeleteUser(token: string, userId: number): Promise<{ ok: true }> {
  return request(`/api/admin/users/${userId}`, { method: 'DELETE' }, token)
}
