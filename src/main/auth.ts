import { createHash } from 'crypto'
import { Auth } from 'msmc'
import type { types as MsmcTypes } from 'msmc'
import { MS_AUTH_CONFIG, isMsAuthConfigured } from './msAuthConfig'
import { saveSession } from './session'
import type { ZewoSession } from '../shared/types'

const OFFLINE_USERNAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/

// Vanilla sunucunun offline-mode'da ürettiği UUID ile aynı algoritma (MD5
// tabanlı, version-3 UUID) — böylece cape/kanat gibi cosmetic'ler ileride bu
// UUID'ye bağlanırsa sunucu tarafındaki offline UUID ile eşleşir.
export function offlineUuidFromUsername(username: string): string {
  const hash = createHash('md5').update(`OfflinePlayer:${username}`).digest()
  hash[6] = (hash[6] & 0x0f) | 0x30
  hash[8] = (hash[8] & 0x3f) | 0x80
  const hex = hash.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function loginOffline(username: string): Promise<ZewoSession> {
  if (!OFFLINE_USERNAME_PATTERN.test(username)) {
    throw new Error(
      'Kullanıcı adı 3-16 karakter olmalı, sadece harf, rakam ve alt çizgi (_) içerebilir.'
    )
  }

  const uuid = offlineUuidFromUsername(username)
  const session: ZewoSession = {
    authType: 'offline',
    username,
    uuid,
    // Offline-mode sunucular access token'ı doğrulamaz; sadece dolu bir değer olması yeterli.
    accessToken: uuid,
    loggedInAt: Date.now()
  }
  saveSession(session)
  return session
}

export async function loginMicrosoft(): Promise<ZewoSession> {
  if (!isMsAuthConfigured()) {
    throw new Error(
      'Microsoft girişi henüz yapılandırılmadı. Bir Azure app registration oluşturup ' +
        'client ID değerini ZEWO_MS_CLIENT_ID ortam değişkenine eklemeniz gerekiyor.'
    )
  }

  const msToken: MsmcTypes.MSToken = {
    client_id: MS_AUTH_CONFIG.clientId,
    redirect: MS_AUTH_CONFIG.redirect,
    prompt: 'select_account'
  }
  const authManager = new Auth(msToken)

  const xboxManager = await authManager.launch('electron', {
    width: 500,
    height: 650,
    resizable: false,
    title: 'Microsoft ile Giriş Yap',
    backgroundColor: '#0b0e1a'
  })

  const token = await xboxManager.getMinecraft()

  if (!token.profile) {
    throw new Error(
      'Bu Microsoft hesabına bağlı bir Minecraft profili bulunamadı. Minecraft satın alınmış bir hesapla giriş yapın.'
    )
  }

  const session: ZewoSession = {
    authType: 'microsoft',
    username: token.profile.name,
    uuid: token.profile.id,
    accessToken: token.mcToken,
    loggedInAt: Date.now()
  }
  saveSession(session)
  return session
}
