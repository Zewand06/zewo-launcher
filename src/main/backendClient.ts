import type { AccountProfile, CosmeticItem, Permission, PermissionMatrix, UserRole } from '../shared/types'

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

export function adminGetUser(token: string, userId: number): Promise<{ profile: AccountProfile }> {
  return request(`/api/admin/users/${userId}`, {}, token)
}

export function adminSetRole(
  token: string,
  userId: number,
  role: UserRole
): Promise<{ profile: AccountProfile }> {
  return request(
    `/api/admin/users/${userId}/role`,
    { method: 'PUT', body: JSON.stringify({ role }) },
    token
  )
}

export function fetchPermissionMatrix(
  token: string
): Promise<{ roles: UserRole[]; permissions: Permission[]; matrix: PermissionMatrix }> {
  return request('/api/admin/permissions', {}, token)
}

export function togglePermission(
  token: string,
  role: UserRole,
  permission: Permission,
  enabled: boolean
): Promise<{ ok: true }> {
  return request(
    '/api/admin/permissions/toggle',
    { method: 'POST', body: JSON.stringify({ role, permission, enabled }) },
    token
  )
}

// Launcher, OYNA'ya basılınca ve Minecraft süreci kapanınca bunları çağırır
// — profil ekranındaki "toplam oynama süresi" ve "en çok oynanan sürüm"
// buradan besleniyor. Hesap girişi yoksa (çok nadir ama) sessizce atlanır.
export function startPlaySession(
  token: string,
  mcVersion: string
): Promise<{ sessionId: number }> {
  return request(
    '/api/play-sessions/start',
    { method: 'POST', body: JSON.stringify({ mcVersion }) },
    token
  )
}

export function endPlaySession(token: string, sessionId: number): Promise<{ ok: true }> {
  return request(`/api/play-sessions/${sessionId}/end`, { method: 'POST' }, token)
}

export function reportMcSession(
  token: string,
  mcUsername: string,
  mcUuid: string
): Promise<{ ok: true }> {
  return request(
    '/api/me/session',
    { method: 'POST', body: JSON.stringify({ mcUsername, mcUuid }) },
    token
  )
}
