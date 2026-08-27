import { Client } from '@xhayper/discord-rpc'

// Discord Developer Portal'da oluşturulan "Zewo Launcher" uygulamasının
// gerçek Application ID'si.
const CLIENT_ID = '1542558910978728097'

// .ico Discord'un resim proxy'sinde güvenilir açılmıyor — backend'de
// zaten herkese açık statik dosya sunan /public üzerinden gerçek bir PNG
// veriyoruz (cape/kanat dokularıyla aynı yöntem).
const ZEWO_MARK_URL = 'https://zewo-backend-production.up.railway.app/public/branding/zewo-mark.png'

const ROLE_LABELS: Record<string, string> = {
  member: 'Üye',
  vip: 'VIP',
  moderator: 'Moderatör',
  admin: 'Admin'
}

type Activity = Parameters<NonNullable<Client['user']>['setActivity']>[0]

let client: Client | null = null
let ready = false
let connecting = false
let playStartedAt: number | null = null
let idleStartedAt: number | null = null
// Discord bağlantısı (IPC handshake) birkaç yüz ms sürebiliyor. O sırada
// gelen bir setActivity isteği kaybolmasın diye en son isteği burada
// bekletiyoruz, 'ready' event'i gelince otomatik uyguluyoruz.
let pendingActivity: Activity | null = null

function ensureClient(): Client | null {
  if (!CLIENT_ID) return null
  if (client) return client
  if (connecting) return null
  connecting = true

  client = new Client({ clientId: CLIENT_ID })
  client.on('ready', () => {
    ready = true
    connecting = false
    console.log('[Discord] RPC hazır, kullanıcı:', client?.user?.username)
    if (pendingActivity) {
      client?.user?.setActivity(pendingActivity).catch((err) => {
        console.error('[Discord] setActivity başarısız:', err)
      })
      pendingActivity = null
    }
  })
  client.login().catch((err) => {
    // Discord masaüstü uygulaması kapalıysa veya bağlanılamazsa sessizce
    // vazgeçiyoruz — bu launcher'ın çalışmasını hiç etkilememeli.
    console.error('[Discord] RPC bağlantısı başarısız:', err)
    client = null
    ready = false
    connecting = false
  })
  return client
}

function applyActivity(activity: Activity): void {
  const c = ensureClient()
  if (!c || !ready) {
    pendingActivity = activity
    return
  }
  c.user?.setActivity(activity).catch((err) => {
    console.error('[Discord] setActivity başarısız:', err)
  })
}

export function setIdlePresence(username: string): void {
  playStartedAt = null
  if (!idleStartedAt) idleStartedAt = Date.now()
  applyActivity({
    details: 'Zewo Launcher',
    state: `${username} olarak giriş yaptı`,
    startTimestamp: idleStartedAt,
    largeImageUrl: ZEWO_MARK_URL,
    largeImageText: 'Zewo Launcher — Skyblock',
    smallImageUrl: ZEWO_MARK_URL,
    smallImageText: 'Ana menüde',
    instance: false
  })
}

export function setPlayingPresence(username: string, mcVersion: string, role: string): void {
  idleStartedAt = null
  if (!playStartedAt) playStartedAt = Date.now()
  const roleLabel = ROLE_LABELS[role] ?? role
  applyActivity({
    details: 'Zewo Skyblock oynuyor',
    state: `${mcVersion} · ${roleLabel}`,
    startTimestamp: playStartedAt,
    largeImageUrl: ZEWO_MARK_URL,
    largeImageText: `${username} · Zewo Skyblock`,
    smallImageUrl: ZEWO_MARK_URL,
    smallImageText: 'Oyunda',
    instance: true
  })
}

export function clearPresence(): void {
  playStartedAt = null
  idleStartedAt = null
  pendingActivity = null
  client?.user?.clearActivity().catch(() => {})
}

export function destroyPresence(): void {
  client?.destroy().catch(() => {})
  client = null
  ready = false
  connecting = false
  playStartedAt = null
  idleStartedAt = null
  pendingActivity = null
}
