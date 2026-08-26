import { useEffect, useState } from 'react'
import AuroraBackground from '../components/AuroraBackground'
import Logo from '../components/Logo'
import type { UpdateStatus } from '../../../shared/types'

interface UpdateScreenProps {
  status: UpdateStatus
}

// Zorunlu güncelleme ekranı — güncelleme mevcutken atlanamaz, kullanıcı
// "Güncelle"ye basmadan uygulamanın geri kalanına geçemez.
export default function UpdateScreen({ status }: UpdateScreenProps): JSX.Element {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (status.stage === 'downloaded') {
      const timer = setTimeout(() => window.zewo.updater.install(), 1200)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [status.stage])

  async function handleUpdateClick(): Promise<void> {
    setBusy(true)
    await window.zewo.updater.download()
  }

  return (
    <div className="login-screen">
      <AuroraBackground />
      <div className="login-stage" style={{ justifyContent: 'center' }}>
        <div className="login-card">
          <div className="brand">
            <Logo size={30} />
            <div>
              <span>ZEWO</span>
              <small>YENİ SÜRÜM MEVCUT</small>
            </div>
          </div>

          {status.stage === 'available' && (
            <div className="mode-panel">
              <p className="hint">
                Zewo Launcher {status.version} sürümü çıktı. Devam etmeden önce güncellemen
                gerekiyor.
              </p>
              <button type="button" className="cta green" disabled={busy} onClick={handleUpdateClick}>
                {busy ? 'Başlatılıyor…' : 'Güncelle'}
              </button>
            </div>
          )}

          {status.stage === 'downloading' && (
            <div className="mode-panel">
              <p className="hint">İndiriliyor… %{status.percent ?? 0}</p>
              <div className="ram-slider" style={{ backgroundSize: `${status.percent ?? 0}% 100%` }} />
            </div>
          )}

          {status.stage === 'downloaded' && (
            <div className="mode-panel">
              <p className="hint">İndirildi. Launcher yeniden başlatılıp kuruluyor…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
