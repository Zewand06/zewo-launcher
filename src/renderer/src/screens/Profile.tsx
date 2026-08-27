import { useEffect, useState } from 'react'
import FaceAvatar from '../components/FaceAvatar'
import { useResolvedSkin } from '../hooks/useResolvedSkin'
import type { AccountProfile, AccountSession, ZewoSession } from '../../../shared/types'
import { ROLE_LABELS, formatDate, formatDuration } from '../utils/formatters'

interface ProfileProps {
  session: ZewoSession
  accountSession: AccountSession
}

function StatTile({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="stat-tile">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  )
}

export default function Profile({ session, accountSession }: ProfileProps): JSX.Element {
  const { profile } = accountSession
  const { skinUrl } = useResolvedSkin(session)
  const [others, setOthers] = useState<AccountProfile[] | null>(null)

  useEffect(() => {
    // view_others yetkisi yoksa backend 403 döner — o zaman sessizce
    // sadece kendi profilini gösteririz, hata göstermeye gerek yok.
    window.zewo.admin
      .listUsers()
      .then((list) => setOthers(list.filter((u) => u.id !== profile.id)))
      .catch(() => setOthers(null))
  }, [profile.id])

  return (
    <div className="profile-screen">
      <div className="screen-header">
        <div>
          <h1>Profil</h1>
          <p className="hint">Hesabın ve oynama istatistiklerin.</p>
        </div>
      </div>

      <div className="profile-self-card">
        <div className="profile-self-top">
          <FaceAvatar skinUrl={skinUrl} size={132} />
          <div className="profile-self-identity">
            <span className="profile-username">{profile.username}</span>
            <span className={`role-badge role-${profile.role}`}>{ROLE_LABELS[profile.role]}</span>
          </div>
        </div>
        <div className="profile-stats-grid">
          <StatTile label="KAYIT TARİHİ" value={formatDate(profile.createdAt)} />
          <StatTile label="SON GİRİŞ" value={formatDate(profile.lastLoginAt)} />
          <StatTile label="TOPLAM OYNAMA SÜRESİ" value={formatDuration(profile.totalPlaytimeMs)} />
          <StatTile label="EN ÇOK OYNANAN SÜRÜM" value={profile.mostPlayedVersion ?? 'Henüz yok'} />
        </div>
      </div>

      {others && others.length > 0 && (
        <div className="profile-roster">
          <h4>Tüm Kullanıcılar</h4>
          <div className="admin-user-list">
            {others.map((user) => (
              <div className="admin-user-card" key={user.id}>
                <div className="admin-user-head">
                  <span className="admin-username">{user.username}</span>
                  <span className={`role-badge role-${user.role}`}>{ROLE_LABELS[user.role]}</span>
                </div>
                <div className="admin-stats-row">
                  <span>Kayıt: {formatDate(user.createdAt)}</span>
                  <span>Son giriş: {formatDate(user.lastLoginAt)}</span>
                  <span>Süre: {formatDuration(user.totalPlaytimeMs)}</span>
                  <span>En çok: {user.mostPlayedVersion ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
