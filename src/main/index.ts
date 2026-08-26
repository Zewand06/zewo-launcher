import { join } from 'path'
import os from 'os'
import { app, BrowserWindow, ipcMain } from 'electron'
import { loginOffline, loginMicrosoft } from './auth'
import { loadSession, clearSession } from './session'
import { fetchSupportedVersions, launchGame } from './launcher'
import { listMods, addModFromDialog, setModEnabled, removeMod } from './mods'
import { getSettings, saveSettings } from './settings'
import {
  registerAccount,
  loginAccount,
  fetchMe,
  fetchCosmeticsCatalog,
  adminListUsers,
  adminGrantCosmetic,
  adminRevokeCosmetic,
  adminResetPassword,
  adminDeleteUser
} from './backendClient'
import {
  saveAccountSession,
  loadAccountSession,
  clearAccountSession,
  updateEquipped
} from './accountSession'
import { fetchMinecraftSkinUrl } from './skin'
import type { AccountSession, LauncherSettings, ZewoSession } from '../shared/types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 740,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0b0e1a',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (process.env.ZEWO_DEBUG) {
      mainWindow?.webContents.openDevTools({ mode: 'right' })
    }
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:toggleMaximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.handle('window:close', () => mainWindow?.close())

  ipcMain.handle('auth:loginOffline', (_event, username: string) => loginOffline(username))
  ipcMain.handle('auth:loginMicrosoft', () => loginMicrosoft())
  ipcMain.handle('auth:getSession', () => loadSession())
  ipcMain.handle('auth:logout', () => clearSession())

  ipcMain.handle('launcher:getVersions', () => fetchSupportedVersions())
  ipcMain.handle('launcher:play', (_event, mcVersion: string, session: ZewoSession) => {
    launchGame(mcVersion, session, (progress) => {
      mainWindow?.webContents.send('launcher:progress', progress)
    })
  })

  ipcMain.handle('mods:list', () => listMods())
  ipcMain.handle('mods:add', () => addModFromDialog())
  ipcMain.handle('mods:setEnabled', (_event, fileName: string, enabled: boolean) =>
    setModEnabled(fileName, enabled)
  )
  ipcMain.handle('mods:remove', (_event, fileName: string) => removeMod(fileName))

  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:save', (_event, settings: LauncherSettings) => saveSettings(settings))
  ipcMain.handle('settings:getSystemMemoryMb', () => Math.floor(os.totalmem() / 1024 / 1024))

  ipcMain.handle('account:register', async (_event, username: string, password: string) => {
    const { token, profile } = await registerAccount(username, password)
    const session: AccountSession = { token, profile, equippedCapeId: null, equippedWingsId: null }
    saveAccountSession(session)
    return session
  })
  ipcMain.handle('account:login', async (_event, username: string, password: string) => {
    const { token, profile } = await loginAccount(username, password)
    const existing = loadAccountSession()
    const session: AccountSession = {
      token,
      profile,
      equippedCapeId: existing?.equippedCapeId ?? null,
      equippedWingsId: existing?.equippedWingsId ?? null
    }
    saveAccountSession(session)
    return session
  })
  ipcMain.handle('account:getSession', async () => {
    const stored = loadAccountSession()
    if (!stored) return null
    try {
      const { profile } = await fetchMe(stored.token)
      const refreshed: AccountSession = { ...stored, profile }
      saveAccountSession(refreshed)
      return refreshed
    } catch {
      return stored
    }
  })
  ipcMain.handle('account:logout', () => clearAccountSession())
  ipcMain.handle(
    'account:setEquipped',
    (_event, capeId: number | null, wingsId: number | null) => updateEquipped(capeId, wingsId)
  )

  ipcMain.handle('cosmetics:catalog', async () => {
    const stored = loadAccountSession()
    if (!stored) throw new Error('Giriş gerekli.')
    return (await fetchCosmeticsCatalog(stored.token)).cosmetics
  })

  ipcMain.handle('admin:listUsers', async () => {
    const stored = loadAccountSession()
    if (!stored) throw new Error('Giriş gerekli.')
    return (await adminListUsers(stored.token)).users
  })
  ipcMain.handle('admin:grantCosmetic', async (_event, userId: number, cosmeticId: number) => {
    const stored = loadAccountSession()
    if (!stored) throw new Error('Giriş gerekli.')
    return (await adminGrantCosmetic(stored.token, userId, cosmeticId)).profile
  })
  ipcMain.handle('admin:revokeCosmetic', async (_event, userId: number, cosmeticId: number) => {
    const stored = loadAccountSession()
    if (!stored) throw new Error('Giriş gerekli.')
    return (await adminRevokeCosmetic(stored.token, userId, cosmeticId)).profile
  })
  ipcMain.handle('admin:resetPassword', async (_event, userId: number, newPassword: string) => {
    const stored = loadAccountSession()
    if (!stored) throw new Error('Giriş gerekli.')
    return (await adminResetPassword(stored.token, userId, newPassword)).profile
  })
  ipcMain.handle('admin:deleteUser', async (_event, userId: number) => {
    const stored = loadAccountSession()
    if (!stored) throw new Error('Giriş gerekli.')
    return adminDeleteUser(stored.token, userId)
  })

  ipcMain.handle('skin:fetch', (_event, uuid: string) => fetchMinecraftSkinUrl(uuid))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
