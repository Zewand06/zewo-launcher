import { useEffect, useState } from 'react'
import type { ModEntry } from '../../../shared/types'

export default function Mods(): JSX.Element {
  const [mods, setMods] = useState<ModEntry[]>([])
  const [busy, setBusy] = useState(false)

  async function refresh(): Promise<void> {
    setMods(await window.zewo.mods.list())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleAdd(): Promise<void> {
    setBusy(true)
    try {
      setMods(await window.zewo.mods.add())
    } finally {
      setBusy(false)
    }
  }

  async function toggle(mod: ModEntry): Promise<void> {
    setMods(await window.zewo.mods.setEnabled(mod.fileName, !mod.enabled))
  }

  async function handleRemove(mod: ModEntry): Promise<void> {
    setMods(await window.zewo.mods.remove(mod.fileName))
  }

  return (
    <div className="mods-screen">
      <div className="screen-header">
        <div>
          <h1>Modlar</h1>
          <p className="hint">Kendi .jar dosyalarını ekle, mevcut modları aç/kapat.</p>
        </div>
        <button type="button" className="cta ghost" onClick={handleAdd} disabled={busy}>
          + Mod Ekle
        </button>
      </div>

      {mods.length === 0 ? (
        <p className="hint">Henüz mod yüklenmedi.</p>
      ) : (
        <div className="mod-list">
          {mods.map((mod) => (
            <div className="mod-row" key={mod.fileName}>
              <div>
                <div className="m-name">{mod.fileName.replace(/\.disabled$/, '')}</div>
                <div className="m-size">{(mod.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <div className="mod-actions">
                <button
                  type="button"
                  className={mod.enabled ? 'toggle on' : 'toggle'}
                  onClick={() => toggle(mod)}
                >
                  {mod.enabled ? 'Açık' : 'Kapalı'}
                </button>
                <button
                  type="button"
                  className="remove"
                  onClick={() => handleRemove(mod)}
                  aria-label="Kaldır"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
