import { useEffect, useState } from 'react'
import type { AccountProfile, AccountSession, CosmeticItem } from '../../../shared/types'

interface AdminProps {
  // Admin, kendi hesabına da kozmetik verebildiği için sonucu App seviyesindeki
  // accountSession'a da yansıtmamız gerekiyor — yoksa Ana Sayfa'daki panel eski kalır.
  onSelfUpdate: (session: AccountSession) => void
}

export default function Admin({ onSelfUpdate }: AdminProps): JSX.Element {
  const [users, setUsers] = useState<AccountProfile[]>([])
  const [catalog, setCatalog] = useState<CosmeticItem[]>([])
  const [picked, setPicked] = useState<Record<number, number>>({})
  const [newPasswords, setNewPasswords] = useState<Record<number, string>>({})
  const [resetDone, setResetDone] = useState<number | null>(null)
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

  useEffect(() => {
    refresh()
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

  return (
    <div className="admin-screen">
      <div className="screen-header">
        <div>
          <h1>Admin</h1>
          <p className="hint">
            Launcher hesabı olan herkesi gör, cape/kanat kozmetiği ver, şifre sıfırla.
            <br />
            Gerçek şifreleri göremeyiz (geri döndürülemez şekilde şifreleniyorlar) — sadece
            yenisini belirleyebiliriz.
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
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
                  {user.isAdmin && <span className="admin-badge">ADMIN</span>}
                  {!user.isAdmin && (
                    <button
                      type="button"
                      className="admin-delete-btn"
                      onClick={() => deleteUser(user.id, user.username)}
                    >
                      Hesabı Sil
                    </button>
                  )}
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
