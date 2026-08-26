import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'
import type { UpdateStatus } from '../shared/types'

// Sürüm indirmeyi otomatik başlatmıyoruz — kullanıcı "Güncelle" butonuna
// basmadan indirme başlamaz. Ama bir kere basınca zorunlu: atlanamaz.
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

let attachedWindow: BrowserWindow | null = null

export function initUpdater(window: BrowserWindow): void {
  attachedWindow = window

  const send = (status: UpdateStatus): void => {
    attachedWindow?.webContents.send('updater:status', status)
  }

  autoUpdater.on('checking-for-update', () => send({ stage: 'checking' }))
  autoUpdater.on('update-available', (info) => send({ stage: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => send({ stage: 'up-to-date' }))
  autoUpdater.on('download-progress', (progress) =>
    send({ stage: 'downloading', percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', () => send({ stage: 'downloaded' }))
  autoUpdater.on('error', (err) => send({ stage: 'error', message: err.message }))
}

export function checkForUpdates(): void {
  autoUpdater.checkForUpdates().catch(() => {
    // İnternet yoksa veya henüz hiç sürüm yayınlanmadıysa sessizce yut —
    // kullanıcı normal şekilde girişe devam edebilsin.
  })
}

export function downloadUpdate(): void {
  autoUpdater.downloadUpdate().catch((err) => {
    attachedWindow?.webContents.send('updater:status', {
      stage: 'error',
      message: err instanceof Error ? err.message : 'İndirme başarısız oldu.'
    } satisfies UpdateStatus)
  })
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
