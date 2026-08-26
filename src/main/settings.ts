import Store from 'electron-store'
import type { LauncherSettings } from '../shared/types'

interface StoreSchema {
  settings: LauncherSettings
}

const DEFAULTS: LauncherSettings = {
  javaPath: 'java',
  maxMemoryMb: 4096
}

const store = new Store<StoreSchema>({
  name: 'zewo-settings',
  defaults: { settings: DEFAULTS }
})

export function getSettings(): LauncherSettings {
  return { ...DEFAULTS, ...store.get('settings') }
}

export function saveSettings(settings: LauncherSettings): LauncherSettings {
  store.set('settings', settings)
  return settings
}
