import { useEffect, useMemo, useState } from 'react'
import AuroraBackground from '../components/AuroraBackground'
import SkinViewer from '../components/SkinViewer'
import { createPlaceholderCape, createPlaceholderSkin } from '../utils/placeholderTextures'
import type { AccountSession, LaunchProgress, ZewoSession } from '../../../shared/types'

interface HomeProps {
  session: ZewoSession
  accountSession: AccountSession
  onAccountUpdate: (session: AccountSession) => void
}

export default function Home({ session, accountSession, onAccountUpdate }: HomeProps): JSX.Element {
  const [versions, setVersions] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [loadingVersions, setLoadingVersions] = useState(true)
  const [progress, setProgress] = useState<LaunchProgress | null>(null)
  const [launching, setLaunching] = useState(false)
  const [skinUrl, setSkinUrl] = useState<string>(() => createPlaceholderSkin())

  useEffect(() => {
    window.zewo.launcher
      .getVersions()
      .then((list) => {
        const values = list.map((v) => v.version)
        setVersions(values)
        if (values.length > 0) setSelected(values[0])
      })
      .finally(() => setLoadingVersions(false))
  }, [])

  useEffect(() => {
    const unsubscribe = window.zewo.launcher.onProgress((next) => {
      setProgress(next)
      if (next.done) setLaunching(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (session.authType !== 'microsoft') return
    window.zewo.skin.fetch(session.uuid).then((url) => {
      if (url) setSkinUrl(url)
    })
  }, [session])

  const cosmetics = accountSession.profile.cosmetics
  const capes = useMemo(() => cosmetics.filter((c) => c.type === 'cape'), [cosmetics])
  const wings = useMemo(() => cosmetics.filter((c) => c.type === 'wings'), [cosmetics])

  const equippedCape = capes.find((c) => c.id === accountSession.equippedCapeId)
  const equippedWings = wings.find((c) => c.id === accountSession.equippedWingsId)
  const activeBack = equippedWings ?? equippedCape
  const capeUrl = activeBack ? createPlaceholderCape(activeBack.name, activeBack.type) : null
  const backEquipment = equippedWings ? 'elytra' : 'cape'

  async function toggleCape(id: number): Promise<void> {
    const nextId = accountSession.equippedCapeId === id ? null : id
    const updated = await window.zewo.account.setEquipped(nextId, accountSession.equippedWingsId)
    if (updated) onAccountUpdate(updated)
  }

  async function toggleWings(id: number): Promise<void> {
    const nextId = accountSession.equippedWingsId === id ? null : id
    const updated = await window.zewo.account.setEquipped(accountSession.equippedCapeId, nextId)
    if (updated) onAccountUpdate(updated)
  }

  async function handlePlay(): Promise<void> {
    if (!selected || launching) return
    setLaunching(true)
    setProgress({ stage: 'start', message: 'Başlatılıyor…' })
    await window.zewo.launcher.play(selected, session)
  }

  return (
    <div className="home-screen">
      <AuroraBackground />
      <div className="home-content">
        <div className="home-main">
          <div className="hero-card">
            <div className="hero-text">
              <span className="eyebrow">Fabric</span>
              <h1>{session.username}, oynamaya hazır mısın?</h1>
              <label className="version-picker">
                <span>SÜRÜM</span>
                <select
                  value={selected}
                  onChange={(event) => setSelected(event.target.value)}
                  disabled={loadingVersions || launching}
                >
                  {loadingVersions && <option>Yükleniyor…</option>}
                  {versions.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className="cta green play-btn"
              onClick={handlePlay}
              disabled={launching || loadingVersions || !selected}
            >
              {launching ? 'BAŞLATILIYOR…' : 'OYNA'}
            </button>
          </div>

          {progress && (
            <div className={progress.stage === 'error' ? 'launch-log error' : 'launch-log'}>
              <span className="dot" />
              <span>{progress.message}</span>
              {progress.error && <span className="detail">{progress.error}</span>}
            </div>
          )}
        </div>

        <div className="home-side">
          <div className="skin-viewer-card">
            <SkinViewer skinUrl={skinUrl} capeUrl={capeUrl} backEquipment={backEquipment} />
          </div>

          <div className="cosmetic-panel">
            <h4>Kozmetik ve Skin</h4>

            <div className="cosmetic-group">
              <span className="cosmetic-group-label">CAPE</span>
              {capes.length === 0 ? (
                <p className="hint">Henüz cape sahibi değilsin.</p>
              ) : (
                <div className="cosmetic-chips">
                  {capes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={c.id === accountSession.equippedCapeId ? 'chip active' : 'chip'}
                      onClick={() => toggleCape(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="cosmetic-group">
              <span className="cosmetic-group-label">KANAT</span>
              {wings.length === 0 ? (
                <p className="hint">Henüz kanat sahibi değilsin.</p>
              ) : (
                <div className="cosmetic-chips">
                  {wings.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={c.id === accountSession.equippedWingsId ? 'chip active' : 'chip'}
                      onClick={() => toggleWings(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {equippedCape && equippedWings && (
              <p className="hint">Kanat ve cape aynı anda görünmez — kanat önceliklidir.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
