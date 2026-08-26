import { useEffect, useMemo, useState } from 'react'
import type { LauncherSettings } from '../../../shared/types'

const MIN_MB = 1024
const STEP_MB = 512

function toGb(mb: number): string {
  return (mb / 1024).toFixed(1).replace(/\.0$/, '')
}

export default function Settings(): JSX.Element {
  const [settings, setSettings] = useState<LauncherSettings | null>(null)
  const [systemMemoryMb, setSystemMemoryMb] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.zewo.settings.get().then(setSettings)
    window.zewo.settings.getSystemMemoryMb().then(setSystemMemoryMb)
  }, [])

  const maxMb = systemMemoryMb ?? 16384
  const presets = useMemo(() => {
    const options = [2048, 4096, 6144, 8192, 12288]
    return options.filter((mb) => mb <= maxMb)
  }, [maxMb])

  async function handleSave(): Promise<void> {
    if (!settings) return
    await window.zewo.settings.save(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  if (!settings) {
    return <div className="settings-screen" />
  }

  const percent = ((settings.maxMemoryMb - MIN_MB) / (maxMb - MIN_MB)) * 100

  return (
    <div className="settings-screen">
      <h1>Ayarlar</h1>

      <div className="field">
        <span>JAVA YOLU</span>
        <input
          className="input"
          value={settings.javaPath}
          onChange={(event) => setSettings({ ...settings, javaPath: event.target.value })}
        />
        <p className="hint">
          Java kurulu değilse "java" komutu çalışmaz — Java'nın kurulu olduğu klasördeki
          java.exe yolunu buraya yazabilirsin.
        </p>
      </div>

      <div className="field">
        <div className="ram-label-row">
          <span>OYUNA AYRILAN RAM</span>
          <span className="ram-value">
            {toGb(settings.maxMemoryMb)} GB
            {systemMemoryMb && <span className="ram-total"> / {toGb(systemMemoryMb)} GB</span>}
          </span>
        </div>
        <input
          type="range"
          className="ram-slider"
          min={MIN_MB}
          max={maxMb}
          step={STEP_MB}
          value={settings.maxMemoryMb}
          style={{ backgroundSize: `${percent}% 100%` }}
          onChange={(event) =>
            setSettings({ ...settings, maxMemoryMb: Number(event.target.value) })
          }
        />
        <div className="ram-presets">
          {presets.map((mb) => (
            <button
              key={mb}
              type="button"
              className={settings.maxMemoryMb === mb ? 'chip active' : 'chip'}
              onClick={() => setSettings({ ...settings, maxMemoryMb: mb })}
            >
              {toGb(mb)} GB
            </button>
          ))}
        </div>
        <p className="hint">
          Emin değilsen 4 GB ile başla. Çok yüksek seçmek, bilgisayarının diğer
          uygulamalarını yavaşlatabilir.
        </p>
      </div>

      <button type="button" className="cta green" onClick={handleSave}>
        {saved ? 'Kaydedildi ✓' : 'Kaydet'}
      </button>
    </div>
  )
}
