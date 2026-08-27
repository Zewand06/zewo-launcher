import { useEffect, useMemo, useRef, useState } from 'react'
import AuroraBackground from '../components/AuroraBackground'
import SkinViewer from '../components/SkinViewer'
import Logo from '../components/Logo'
import { createPlaceholderCape } from '../utils/placeholderTextures'
import { useResolvedSkin } from '../hooks/useResolvedSkin'
import { WHATS_NEW } from '../data/whatsNew'
import zewoLogoFull from '../assets/zewo-logo-full.png'
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
  const { skinUrl, skinModel } = useResolvedSkin(session)
  const [versionMenuOpen, setVersionMenuOpen] = useState(false)
  const versionPickerRef = useRef<HTMLDivElement | null>(null)

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
    if (!versionMenuOpen) return
    function onOutsideClick(event: MouseEvent): void {
      if (!versionPickerRef.current?.contains(event.target as Node)) {
        setVersionMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [versionMenuOpen])

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
          <div className="whats-new-card">
            <div className="whats-new-header">
              <img src={zewoLogoFull} alt="Zewo" className="whats-new-logo" />
              <div className="whats-new-title">
                <span className="eyebrow">Yenilikler</span>
                <h2>Bu sürümde neler değişti</h2>
              </div>
              <span className="whats-new-version">v{WHATS_NEW.version}</span>
            </div>
            <ul className="whats-new-list">
              {WHATS_NEW.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="hero-card">
            <div className="hero-text">
              <span className="eyebrow">Fabric</span>
              <h1>{session.username}, oynamaya hazır mısın?</h1>
              <div className="version-picker" ref={versionPickerRef}>
                <span className="version-picker-label">
                  <Logo size={16} glow={false} className="version-picker-mark" />
                  SÜRÜM
                </span>
                <button
                  type="button"
                  className="version-trigger"
                  disabled={loadingVersions || launching}
                  onClick={() => setVersionMenuOpen((open) => !open)}
                >
                  <span>{loadingVersions ? 'Yükleniyor…' : selected || 'Sürüm seç'}</span>
                  <svg
                    className={versionMenuOpen ? 'chevron open' : 'chevron'}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" />
                  </svg>
                </button>

                {versionMenuOpen && (
                  <div className="version-menu">
                    {versions.map((version) => (
                      <button
                        key={version}
                        type="button"
                        className={version === selected ? 'version-option active' : 'version-option'}
                        onClick={() => {
                          setSelected(version)
                          setVersionMenuOpen(false)
                        }}
                      >
                        {version}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
            <SkinViewer
              skinUrl={skinUrl}
              skinModel={skinModel}
              capeUrl={capeUrl}
              backEquipment={backEquipment}
            />
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
