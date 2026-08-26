import { contextBridge, ipcRenderer } from 'electron'
import type {
  AccountProfile,
  AccountSession,
  CosmeticItem,
  LaunchProgress,
  LauncherSettings,
  ModEntry,
  UpdateStatus,
  ZewoSession
} from '../shared/types'

const api = {
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: (): Promise<void> => ipcRenderer.invoke('window:toggleMaximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close')
  },
  auth: {
    loginOffline: (username: string): Promise<ZewoSession> =>
      ipcRenderer.invoke('auth:loginOffline', username),
    loginMicrosoft: (): Promise<ZewoSession> => ipcRenderer.invoke('auth:loginMicrosoft'),
    getSession: (): Promise<ZewoSession | null> => ipcRenderer.invoke('auth:getSession'),
    logout: (): Promise<void> => ipcRenderer.invoke('auth:logout')
  },
  launcher: {
    getVersions: (): Promise<{ version: string; stable: boolean }[]> =>
      ipcRenderer.invoke('launcher:getVersions'),
    play: (mcVersion: string, session: ZewoSession): Promise<void> =>
      ipcRenderer.invoke('launcher:play', mcVersion, session),
    onProgress: (callback: (progress: LaunchProgress) => void): (() => void) => {
      const listener = (_event: unknown, progress: LaunchProgress): void => callback(progress)
      ipcRenderer.on('launcher:progress', listener)
      return () => ipcRenderer.removeListener('launcher:progress', listener)
    }
  },
  mods: {
    list: (): Promise<ModEntry[]> => ipcRenderer.invoke('mods:list'),
    add: (): Promise<ModEntry[]> => ipcRenderer.invoke('mods:add'),
    setEnabled: (fileName: string, enabled: boolean): Promise<ModEntry[]> =>
      ipcRenderer.invoke('mods:setEnabled', fileName, enabled),
    remove: (fileName: string): Promise<ModEntry[]> => ipcRenderer.invoke('mods:remove', fileName)
  },
  settings: {
    get: (): Promise<LauncherSettings> => ipcRenderer.invoke('settings:get'),
    save: (settings: LauncherSettings): Promise<LauncherSettings> =>
      ipcRenderer.invoke('settings:save', settings),
    getSystemMemoryMb: (): Promise<number> => ipcRenderer.invoke('settings:getSystemMemoryMb')
  },
  account: {
    register: (username: string, password: string): Promise<AccountSession> =>
      ipcRenderer.invoke('account:register', username, password),
    login: (username: string, password: string): Promise<AccountSession> =>
      ipcRenderer.invoke('account:login', username, password),
    getSession: (): Promise<AccountSession | null> => ipcRenderer.invoke('account:getSession'),
    logout: (): Promise<void> => ipcRenderer.invoke('account:logout'),
    setEquipped: (capeId: number | null, wingsId: number | null): Promise<AccountSession | null> =>
      ipcRenderer.invoke('account:setEquipped', capeId, wingsId)
  },
  cosmetics: {
    catalog: (): Promise<CosmeticItem[]> => ipcRenderer.invoke('cosmetics:catalog')
  },
  admin: {
    listUsers: (): Promise<AccountProfile[]> => ipcRenderer.invoke('admin:listUsers'),
    grantCosmetic: (userId: number, cosmeticId: number): Promise<AccountProfile> =>
      ipcRenderer.invoke('admin:grantCosmetic', userId, cosmeticId),
    revokeCosmetic: (userId: number, cosmeticId: number): Promise<AccountProfile> =>
      ipcRenderer.invoke('admin:revokeCosmetic', userId, cosmeticId),
    resetPassword: (userId: number, newPassword: string): Promise<AccountProfile> =>
      ipcRenderer.invoke('admin:resetPassword', userId, newPassword),
    deleteUser: (userId: number): Promise<{ ok: true }> => ipcRenderer.invoke('admin:deleteUser', userId)
  },
  skin: {
    fetch: (uuid: string): Promise<string | null> => ipcRenderer.invoke('skin:fetch', uuid),
    fetchByUsername: (username: string): Promise<string | null> =>
      ipcRenderer.invoke('skin:fetchByUsername', username)
  },
  updater: {
    download: (): Promise<void> => ipcRenderer.invoke('updater:download'),
    install: (): Promise<void> => ipcRenderer.invoke('updater:install'),
    onStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
      const listener = (_event: unknown, status: UpdateStatus): void => callback(status)
      ipcRenderer.on('updater:status', listener)
      return () => ipcRenderer.removeListener('updater:status', listener)
    }
  }
}

contextBridge.exposeInMainWorld('zewo', api)

export type ZewoApi = typeof api
