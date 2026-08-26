import { useState, type FormEvent } from 'react'
import AuroraBackground from '../components/AuroraBackground'
import Logo from '../components/Logo'
import type { AccountSession } from '../../../shared/types'

type Mode = 'login' | 'register'

interface AccountAuthProps {
  onAuthed: (session: AccountSession) => void
}

export default function AccountAuth({ onAuthed }: AccountAuthProps): JSX.Element {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function switchMode(next: Mode): void {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const session =
        mode === 'login'
          ? await window.zewo.account.login(username.trim(), password)
          : await window.zewo.account.register(username.trim(), password)
      onAuthed(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir şeyler ters gitti.')
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
              <small>HESABINA GİRİŞ</small>
            </div>
          </div>

          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              Hesap Oluştur
            </button>
          </div>

          <form className="mode-panel" onSubmit={handleSubmit}>
            <label className="field">
              <span>KULLANICI ADI</span>
              <input
                className="input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Poyraz_"
                maxLength={20}
                autoFocus
              />
            </label>
            <label className="field">
              <span>ŞİFRE</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </label>
            <button
              className="cta"
              type="submit"
              disabled={busy || username.trim().length < 3 || password.length < 6}
            >
              {busy
                ? 'Bağlanıyor…'
                : mode === 'login'
                  ? 'Giriş Yap'
                  : 'Hesap Oluştur'}
            </button>
            <p className="hint">
              Bu, Zewo Launcher&apos;ın kendi hesabı — Minecraft hesabınla karıştırma.
              <br />
              İlk oluşturulan hesap otomatik olarak admin olur.
            </p>
          </form>

          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  )
}
