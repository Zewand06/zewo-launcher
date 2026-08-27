import {
  getVersionList,
  installVersion,
  installLibraries,
  installAssets,
  getLoaderArtifactListFor,
  installFabric
} from '@xmcl/installer'
import { Version, launch as xmclLaunch, type ResolvedVersion } from '@xmcl/core'
import { getInstanceRoot } from './paths'
import { installPerformanceMods } from './performanceMods'
import { ensureJavaPath } from './javaSetup'
import { getSettings } from './settings'
import { startPlaySession, endPlaySession, reportMcSession } from './backendClient'
import type { LaunchProgress, ZewoSession } from '../shared/types'

const FABRIC_META_URL = 'https://meta.fabricmc.net/v2/versions/game'

// @xmcl/file-transfer'a özel bir undici dispatcher verildiğinde bazı
// indirmelerde iç StreamHandler kodunda "Cannot use 'in' operator ... in
// undefined" hatasıyla çöktüğünü gördük — kütüphanenin kendi varsayılan
// dispatcher'ını kullanmasına izin verip sadece eşzamanlılığı düşürüyoruz.
const DOWNLOAD_CONCURRENCY = 1
const DOWNLOAD_ATTEMPTS = 4

const downloadOptions = {
  assetsDownloadConcurrency: DOWNLOAD_CONCURRENCY,
  librariesDownloadConcurrency: DOWNLOAD_CONCURRENCY
}

// install()/installDependencies() zaten indirilmiş+doğrulanmış dosyaları
// atlıyor, bu yüzden bir kısmı zaman aşımına uğrasa bile yeniden çağırmak
// güvenli — her denemede sadece eksik/bozuk dosyalar tekrar indirilir.
async function withDownloadRetries<T>(
  label: string,
  fn: () => Promise<T>,
  onProgress: (progress: LaunchProgress) => void
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      // eslint-disable-next-line no-console
      console.error(`[launchGame] ${label} attempt ${attempt} failed:`, err)
      if (attempt < DOWNLOAD_ATTEMPTS) {
        onProgress({
          stage: 'retry',
          message: `Bazı dosyalar indirilemedi, tekrar deneniyor (${attempt}/${DOWNLOAD_ATTEMPTS - 1})…`
        })
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
  }
  throw lastErr
}

// Ses/görsel varlıklarının bir kısmı bu ağda tutarlı biçimde başarısız
// olabiliyor (nedeni araştırılıyor) ama bunlar oyunun açılması için şart
// değil — sadece bazı ses/doku eksik kalır. jar+kütüphaneler olmadan oyun
// hiç açılmayacağı için onları ayrı tutup zorunlu kılıyoruz.
async function installAssetsBestEffort(
  version: ResolvedVersion,
  onProgress: (progress: LaunchProgress) => void
): Promise<void> {
  try {
    await withDownloadRetries('assets', () => installAssets(version, downloadOptions), onProgress)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[launchGame] some assets failed permanently, continuing anyway:', err)
    onProgress({
      stage: 'assets-warning',
      message: 'Bazı ses/görsel dosyaları indirilemedi ama oyun yine de başlatılacak…'
    })
  }
}

interface FabricGameVersion {
  version: string
  stable: boolean
}

// getFabricGames() from @xmcl/installer only returns version strings without
// the "stable" flag, so we hit the same endpoint directly to know which ones
// to show as recommended in the picker.
export async function fetchSupportedVersions(): Promise<FabricGameVersion[]> {
  const res = await fetch(FABRIC_META_URL)
  if (!res.ok) {
    throw new Error('Sürüm listesi alınamadı.')
  }
  const all = (await res.json()) as FabricGameVersion[]
  return all.filter((entry) => /^\d+\.\d+(\.\d+)?$/.test(entry.version)).slice(0, 40)
}

function stripDashes(uuid: string): string {
  return uuid.replace(/-/g, '')
}

export async function launchGame(
  mcVersion: string,
  session: ZewoSession,
  onProgress: (progress: LaunchProgress) => void,
  accountToken: string | null
): Promise<void> {
  const root = getInstanceRoot()
  const settings = getSettings()

  try {
    onProgress({ stage: 'version-list', message: 'Sürüm bilgisi alınıyor…' })
    const list = await getVersionList()
    const versionMeta = list.versions.find((v) => v.id === mcVersion)
    if (!versionMeta) {
      throw new Error(`${mcVersion} sürümü Mojang sunucularında bulunamadı.`)
    }

    onProgress({ stage: 'vanilla', message: 'Minecraft dosyaları indiriliyor (ilk seferde uzun sürebilir)…' })
    const resolvedVanilla = await withDownloadRetries(
      'vanilla jar+json',
      () => installVersion(versionMeta, root),
      onProgress
    )
    await withDownloadRetries(
      'vanilla libraries',
      () => installLibraries(resolvedVanilla, downloadOptions),
      onProgress
    )
    await installAssetsBestEffort(resolvedVanilla, onProgress)

    onProgress({ stage: 'fabric-meta', message: 'Fabric bilgisi alınıyor…' })
    const loaders = await getLoaderArtifactListFor(mcVersion)
    const stableLoader = loaders.find((l) => l.loader.stable) ?? loaders[0]
    if (!stableLoader) {
      throw new Error('Bu sürüm için Fabric loader bulunamadı.')
    }

    onProgress({ stage: 'fabric-install', message: 'Fabric kuruluyor…' })
    const fabricVersionId = await installFabric({
      minecraftVersion: mcVersion,
      version: stableLoader.loader.version,
      minecraft: root
    })

    onProgress({ stage: 'fabric-deps', message: 'Fabric kütüphaneleri indiriliyor…' })
    const resolved = await Version.parse(root, fabricVersionId)
    await withDownloadRetries(
      'fabric libraries',
      () => installLibraries(resolved, downloadOptions),
      onProgress
    )
    await installAssetsBestEffort(resolved, onProgress)

    onProgress({ stage: 'perf-mods', message: 'Performans modları kontrol ediliyor (Sodium, Lithium, Iris)…' })
    await installPerformanceMods(mcVersion, (message) => onProgress({ stage: 'perf-mods', message }))

    // Kullanıcı Ayarlar'dan özel bir Java yolu seçmediyse (hâlâ varsayılan
    // "java" ise), sistemin Java'sına (genelde eski/uyumsuz) güvenmek yerine
    // launcher'ın kendi Java'sını kullan — bu sürümün gerçekte istediği
    // major sürümü Mojang'ın kendi manifest verisinden okuyoruz (ör. 26.2
    // Java 25 ister, eski sürümler genelde Java 21) — sabit kodlamıyoruz.
    const requiredJavaMajor = resolvedVanilla.javaVersion.majorVersion
    const effectiveJavaPath =
      settings.javaPath === 'java'
        ? await ensureJavaPath(onProgress, requiredJavaMajor)
        : settings.javaPath

    onProgress({ stage: 'launching', message: 'Oyun başlatılıyor…' })

    const child = await xmclLaunch({
      gamePath: root,
      resourcePath: root,
      javaPath: effectiveJavaPath,
      version: fabricVersionId,
      gameProfile: { name: session.username, id: stripDashes(session.uuid) },
      accessToken: session.accessToken,
      userType: session.authType === 'microsoft' ? 'mojang' : 'legacy',
      minMemory: 1024,
      maxMemory: settings.maxMemoryMb
    })

    onProgress({ stage: 'running', message: 'Oyun açık.', done: true })

    // Profil ekranındaki "toplam oynama süresi" / "en çok oynanan sürüm"
    // buradan besleniyor — kurulum/indirme süresi değil, sadece Minecraft
    // süreci gerçekten açıkken geçen süre sayılıyor. Backend'e ulaşılamazsa
    // (internet yok, sunucu çöktü vb.) oyunun açılmasını hiç etkilemesin
    // diye sessizce yutulur.
    let playSessionId: number | null = null
    if (accountToken) {
      reportMcSession(accountToken, session.username, session.uuid).catch(() => {})
      try {
        const started = await startPlaySession(accountToken, mcVersion)
        playSessionId = started.sessionId
      } catch {
        playSessionId = null
      }
    }

    function endTrackedSession(): void {
      if (accountToken && playSessionId !== null) {
        endPlaySession(accountToken, playSessionId).catch(() => {})
      }
    }

    child.once('exit', (code) => {
      endTrackedSession()
      if (code === 0 || code === null) {
        onProgress({ stage: 'exited', message: 'Oyun kapatıldı.', done: true })
      } else {
        onProgress({
          stage: 'error',
          message: 'Oyun bir hatayla kapandı.',
          error: `Çıkış kodu: ${code}. Açılan Java hata penceresine bakabilirsin (genelde Java sürümüyle ilgilidir).`,
          done: true
        })
      }
    })
    child.once('error', (err) => {
      endTrackedSession()
      onProgress({ stage: 'error', message: 'Oyun başlatılamadı.', error: err.message, done: true })
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[launchGame] failed:', err)
    const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'
    onProgress({ stage: 'error', message: 'Başlatma başarısız oldu.', error: message, done: true })
  }
}
