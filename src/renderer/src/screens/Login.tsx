import { useState, type FormEvent } from 'react'
import AuroraBackground from '../components/AuroraBackground'
import Logo from '../components/Logo'
import type { ZewoSession } from '../../../shared/types'

type Mode = 'microsoft' | 'offline'

interface LoginProps {
  onLoggedIn: (session: ZewoSession) => void
}

export default function Login({ onLoggedIn }: LoginProps): JSX.Element {
  const [mode, setMode] = useState<Mode>('microsoft')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function switchMode(next: Mode): void {
    setMode(next)
    setError(null)
  }

  async function handleMicrosoft(): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      const session = await window.zewo.auth.loginMicrosoft()
      onLoggedIn(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız oldu.')
    } finally {
      setBusy(false)
    }
  }

  async function handleOffline(event: FormEvent): Promise<void> {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const session = await window.zewo.auth.loginOffline(username.trim())
      onLoggedIn(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız oldu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <AuroraBackground />
      <div className="login-stage">
        <div className="login-card">
          <div className="brand">
            <Logo size={30} />
            <div>
              <span>ZEWO</span>
              <small>SKYBLOCK LAUNCHER</small>
            </div>
          </div>

          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'microsoft'}
              className={mode === 'microsoft' ? 'active' : ''}
              onClick={() => switchMode('microsoft')}
            >
              Microsoft ile Giriş
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'offline'}
              className={mode === 'offline' ? 'active' : ''}
              onClick={() => switchMode('offline')}
            >
              Kullanıcı Adı
            </button>
          </div>

          {mode === 'microsoft' ? (
            <div className="mode-panel">
              <p className="hint">Resmi, satın alınmış Minecraft hesabınızla giriş yapın.</p>
              <button type="button" className="cta" disabled={busy} onClick={handleMicrosoft}>
                {busy ? 'Bağlanıyor…' : 'Microsoft ile Devam Et'}
              </button>
            </div>
          ) : (
            <form className="mode-panel" onSubmit={handleOffline}>
              <label className="field">
                <span>KULLANICI ADI</span>
                <input
                  className="input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Poyraz_"
                  maxLength={16}
                  autoFocus
                />
              </label>
              <button
                className="cta"
                type="submit"
                disabled={busy || username.trim().length < 3}
              >
                {busy ? 'Giriş yapılıyor…' : 'Devam Et'}
              </button>
              <p className="hint">
                Premium hesap doğrulaması olmadan başlatılır.
                <br />
                Hedef sunucu cracked girişe izin vermiyorsa bağlantı reddedilir.
              </p>
            </form>
          )}

          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  )
}
