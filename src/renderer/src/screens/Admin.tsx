import { useEffect, useState } from 'react'
import type {
  AccountProfile,
  AccountSession,
  CosmeticItem,
  Permission,
  PermissionMatrix,
  UserRole
} from '../../../shared/types'
import { ROLE_LABELS, formatDate, formatDuration } from '../utils/formatters'

interface AdminProps {
  // Admin, kendi hesabına da kozmetik verebildiği için sonucu App seviyesindeki
  // accountSession'a da yansıtmamız gerekiyor — yoksa Ana Sayfa'daki panel eski kalır.
  onSelfUpdate: (session: AccountSession) => void
}

const ASSIGNABLE_ROLES: UserRole[] = ['member', 'vip', 'moderator', 'admin']
const EDITABLE_ROLES: UserRole[] = ['member', 'vip', 'moderator']

const PERMISSION_LABELS: Record<Permission, string> = {
  view_others: 'Başkalarının profilini/istatistiklerini görme',
  manage_cosmetics: 'Kozmetik verme / alma',
  reset_password: 'Şifre sıfırlama',
  delete_user: 'Kullanıcı silme',
  manage_roles: 'Rol atama ve yetki matrisini düzenleme'
}

export default function Admin({ onSelfUpdate }: AdminProps): JSX.Element {
  const [users, setUsers] = useState<AccountProfile[]>([])
  const [catalog, setCatalog] = useState<CosmeticItem[]>([])
  const [picked, setPicked] = useState<Record<number, number>>({})
  const [newPasswords, setNewPasswords] = useState<Record<number, string>>({})
  const [resetDone, setResetDone] = useState<number | null>(null)
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh(): Promise<void> {
    try {
      const [userList, cosmeticList] = await Promise.all([
        window.zewo.admin.listUsers(),
        window.zewo.cosmetics.catalog()
      ])
      setUsers(userList)
      setCatalog(cosmeticList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  async function refreshPermissions(): Promise<void> {
    try {
      const result = await window.zewo.admin.getPermissions()
      setMatrix(result.matrix)
      setPermissions(result.permissions)
    } catch {
      // Bu hesap manage_roles yetkisine sahip değilse matris sekmesi hiç görünmez.
      setMatrix(null)
    }
  }

  useEffect(() => {
    refresh()
    refreshPermissions()
  }, [])

  async function syncSelfIfNeeded(): Promise<void> {
    const refreshed = await window.zewo.account.getSession()
    if (refreshed) onSelfUpdate(refreshed)
  }

  async function grant(userId: number): Promise<void> {
    const cosmeticId = picked[userId]
    if (!cosmeticId) return
    try {
      await window.zewo.admin.grantCosmetic(userId, cosmeticId)
      await Promise.all([refresh(), syncSelfIfNeeded()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kozmetik verilemedi.')
    }
  }

  async function revoke(userId: number, cosmeticId: number): Promise<void> {
    try {
      await window.zewo.admin.revokeCosmetic(userId, cosmeticId)
      await Promise.all([refresh(), syncSelfIfNeeded()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kozmetik kaldırılamadı.')
    }
  }

  async function resetPassword(userId: number): Promise<void> {
    const newPassword = newPasswords[userId]?.trim()
    if (!newPassword || newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalı.')
      return
    }
    try {
      setError(null)
      await window.zewo.admin.resetPassword(userId, newPassword)
      setNewPasswords({ ...newPasswords, [userId]: '' })
      setResetDone(userId)
      setTimeout(() => setResetDone((current) => (current === userId ? null : current)), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre sıfırlanamadı.')
    }
  }

  async function deleteUser(userId: number, username: string): Promise<void> {
    if (!window.confirm(`${username} hesabını kalıcı olarak silmek istediğine emin misin?`)) return
    try {
      await window.zewo.admin.deleteUser(userId)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesap silinemedi.')
    }
  }

  async function changeRole(userId: number, role: UserRole): Promise<void> {
    try {
      setError(null)
      await window.zewo.admin.setRole(userId, role)
      await Promise.all([refresh(), syncSelfIfNeeded()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rol değiştirilemedi.')
    }
  }

  async function togglePermission(role: UserRole, permission: Permission, enabled: boolean): Promise<void> {
    if (!matrix) return
    // İyimser güncelleme — tıklar tıklamaz kutuyu değiştir, hata olursa geri al.
    const current = matrix[role] ?? []
    const next = enabled ? [...current, permission] : current.filter((p) => p !== permission)
    setMatrix({ ...matrix, [role]: next })
    try {
      await window.zewo.admin.togglePermission(role, permission, enabled)
    } catch (err) {
      setMatrix({ ...matrix, [role]: current })
      setError(err instanceof Error ? err.message : 'Yetki güncellenemedi.')
    }
  }

  return (
    <div className="admin-screen">
      <div className="screen-header">
        <div>
          <h1>Admin</h1>
          <p className="hint">
            Launcher hesabı olan herkesi gör, rol/kozmetik ver, şifre sıfırla.
            <br />
            Gerçek şifreleri göremeyiz (geri döndürülemez şekilde şifreleniyorlar) — sadece
            yenisini belirleyebiliriz.
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {matrix && (
        <div className="permission-matrix">
          <h4>Yetki Matrisi</h4>
          <p className="hint">Hangi rolün ne yapabileceğini burada belirlersin. Admin her zaman her şeyi yapabilir.</p>
          <div className="matrix-table">
            <div className="matrix-row matrix-head">
              <span />
              {EDITABLE_ROLES.map((role) => (
                <span key={role}>{ROLE_LABELS[role]}</span>
              ))}
            </div>
            {permissions.map((permission) => (
              <div className="matrix-row" key={permission}>
                <span className="matrix-label">{PERMISSION_LABELS[permission]}</span>
                {EDITABLE_ROLES.map((role) => (
                  <label className="matrix-cell" key={role}>
                    <input
                      type="checkbox"
                      checked={matrix[role]?.includes(permission) ?? false}
                      onChange={(event) => togglePermission(role, permission, event.target.checked)}
                    />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="hint">Yükleniyor…</p>
      ) : users.length === 0 ? (
        <p className="hint">Henüz hesap yok.</p>
      ) : (
        <div className="admin-user-list">
          {users.map((user) => {
            const availableForUser = catalog.filter(
              (c) => !user.cosmetics.some((granted) => granted.id === c.id)
            )
            return (
              <div className="admin-user-card" key={user.id}>
                <div className="admin-user-head">
                  <span className="admin-username">{user.username}</span>
                  <select
                    className="role-select"
                    value={user.role}
                    onChange={(event) => changeRole(user.id, event.target.value as UserRole)}
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  {user.role !== 'admin' && (
                    <button
                      type="button"
                      className="admin-delete-btn"
                      onClick={() => deleteUser(user.id, user.username)}
                    >
                      Hesabı Sil
                    </button>
                  )}
                </div>

                <div className="admin-stats-row">
                  <span>Kayıt: {formatDate(user.createdAt)}</span>
                  <span>Son giriş: {formatDate(user.lastLoginAt)}</span>
                  <span>Süre: {formatDuration(user.totalPlaytimeMs)}</span>
                  <span>En çok: {user.mostPlayedVersion ?? '—'}</span>
                </div>

                <div className="admin-cosmetic-tags">
                  {user.cosmetics.length === 0 && (
                    <span className="hint">Henüz kozmetik verilmedi.</span>
                  )}
                  {user.cosmetics.map((cosmetic) => (
                    <span className="cos-tag" key={cosmetic.id}>
                      {cosmetic.type === 'cape' ? 'CAPE' : 'KANAT'}: {cosmetic.name.toUpperCase()}
                      <button
                        type="button"
                        onClick={() => revoke(user.id, cosmetic.id)}
                        aria-label="Kaldır"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {availableForUser.length > 0 && (
                  <div className="admin-grant-row">
                    <select
                      value={picked[user.id] ?? ''}
                      onChange={(event) =>
                        setPicked({ ...picked, [user.id]: Number(event.target.value) })
                      }
                    >
                      <option value="">Kozmetik seç…</option>
                      {availableForUser.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.type === 'cape' ? 'Cape' : 'Kanat'} — {c.name}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="chip active" onClick={() => grant(user.id)}>
                      Ver
                    </button>
                  </div>
                )}

                <div className="admin-grant-row">
                  <input
                    className="input"
                    type="password"
                    placeholder="Yeni şifre (en az 6 karakter)"
                    value={newPasswords[user.id] ?? ''}
                    onChange={(event) =>
                      setNewPasswords({ ...newPasswords, [user.id]: event.target.value })
                    }
                  />
                  <button type="button" className="chip" onClick={() => resetPassword(user.id)}>
                    {resetDone === user.id ? 'Sıfırlandı ✓' : 'Şifreyi Sıfırla'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
