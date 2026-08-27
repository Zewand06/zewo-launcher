import { promises as fs } from 'fs'
import { join } from 'path'
import { getModsDir } from './paths'

interface ModrinthFile {
  url: string
  filename: string
  primary: boolean
}

interface ModrinthDependency {
  version_id: string | null
  project_id: string | null
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded'
}

interface ModrinthVersion {
  version_number: string
  files: ModrinthFile[]
  dependencies: ModrinthDependency[]
}

// Lunar Client/Badlion gibi launcher'ların arka planda otomatik kurduğu FPS
// modları. OptiFine yerine bunları seçtik çünkü OptiFine esasen Forge içindir
// ve Fabric'te resmi desteği yok — Sodium+Lithium+Iris hem daha performanslı
// hem de Fabric'in kendi ekosisteminin parçası.
//
// Sodium ve Iris'i birbirinden bağımsız "en güncel sürüm" diye kurmak riskli:
// bir MC sürümü yeni çıktığında Sodium çoğu zaman Iris'ten önce yeni bir
// alpha yayınlıyor, ikisi birbiriyle uyuşmayabiliyor ve Fabric oyunu hiç
// açmıyor ("Incompatible mods found"). Bunun yerine Iris'in Modrinth'te
// kendi belirttiği "zorunlu bağımlılık" olan tam Sodium sürümünü kullanıyoruz
// — Iris'in geliştiricisi hangi Sodium ile test ettiyse o.
const SODIUM_SLUG = 'sodium'
const LITHIUM_SLUG = 'lithium'
const IRIS_SLUG = 'iris'

async function fetchLatestModrinthVersion(
  slug: string,
  mcVersion: string
): Promise<ModrinthVersion | null> {
  try {
    const loaders = encodeURIComponent(JSON.stringify(['fabric']))
    const gameVersions = encodeURIComponent(JSON.stringify([mcVersion]))
    const res = await fetch(
      `https://api.modrinth.com/v2/project/${slug}/version?loaders=${loaders}&game_versions=${gameVersions}`
    )
    if (!res.ok) return null

    const versions = (await res.json()) as ModrinthVersion[]
    return versions[0] ?? null
  } catch {
    return null
  }
}

async function fetchModrinthVersionById(versionId: string): Promise<ModrinthVersion | null> {
  try {
    const res = await fetch(`https://api.modrinth.com/v2/version/${versionId}`)
    if (!res.ok) return null
    return (await res.json()) as ModrinthVersion
  } catch {
    return null
  }
}

function primaryFile(version: ModrinthVersion): { url: string; filename: string } | null {
  const file = version.files.find((f) => f.primary) ?? version.files[0]
  return file ? { url: file.url, filename: file.filename } : null
}

async function downloadModJar(
  modsDir: string,
  info: { url: string; filename: string }
): Promise<void> {
  const res = await fetch(info.url)
  if (!res.ok) return
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(join(modsDir, info.filename), buffer)
}

// Bu modlar, sürüme göre değişen ayrı jar dosyaları gerektirir. Bir önceki
// sürümden kalma (farklı Minecraft sürümüne ait) jar modlar klasöründe
// kalırsa Fabric aynı mod id'sini iki kez görüp yüklemeyi reddedebilir — bu
// yüzden güncel olmayanları önce temizliyoruz.
function isUpToDate(existing: string[], slug: string, mcVersion: string): string | undefined {
  const matches = existing.filter((name) =>
    name.toLowerCase().replace(/\.disabled$/, '').startsWith(slug)
  )
  return matches.find((name) => name.includes(mcVersion))
}

async function cleanStale(
  modsDir: string,
  existing: string[],
  slug: string,
  keep: string | undefined
): Promise<void> {
  const matches = existing.filter((name) =>
    name.toLowerCase().replace(/\.disabled$/, '').startsWith(slug)
  )
  for (const staleName of matches) {
    if (staleName === keep) continue
    await fs.rm(join(modsDir, staleName), { force: true }).catch(() => {})
  }
}

export async function installPerformanceMods(
  mcVersion: string,
  onProgress: (message: string) => void
): Promise<void> {
  try {
    const modsDir = getModsDir()
    await fs.mkdir(modsDir, { recursive: true })
    const existing = await fs.readdir(modsDir)

    // Lithium diğer ikisinden bağımsız, sırası önemli değil.
    const lithiumUpToDate = isUpToDate(existing, LITHIUM_SLUG, mcVersion)
    await cleanStale(modsDir, existing, LITHIUM_SLUG, lithiumUpToDate)
    if (!lithiumUpToDate) {
      onProgress('Lithium indiriliyor…')
      const version = await fetchLatestModrinthVersion(LITHIUM_SLUG, mcVersion)
      const info = version && primaryFile(version)
      if (info) await downloadModJar(modsDir, info).catch(() => {})
    }

    // Önce Iris'i çözüyoruz ki hangi Sodium sürümüyle uyumlu olduğunu görelim.
    // Iris zaten güncelse jar'ı yeniden indirmiyoruz ama metadata'yı (Sodium
    // bağımlılığını görmek için) yine de çekiyoruz — bu ucuz bir JSON isteği.
    const irisUpToDate = isUpToDate(existing, IRIS_SLUG, mcVersion)
    await cleanStale(modsDir, existing, IRIS_SLUG, irisUpToDate)
    onProgress('Iris kontrol ediliyor…')
    const irisVersion = await fetchLatestModrinthVersion(IRIS_SLUG, mcVersion)
    if (!irisUpToDate) {
      onProgress('Iris indiriliyor…')
      const info = irisVersion && primaryFile(irisVersion)
      if (info) await downloadModJar(modsDir, info).catch(() => {})
    }

    const sodiumUpToDate = isUpToDate(existing, SODIUM_SLUG, mcVersion)
    await cleanStale(modsDir, existing, SODIUM_SLUG, sodiumUpToDate)
    if (!sodiumUpToDate) {
      onProgress('Sodium indiriliyor…')
      // Iris'in Modrinth'te belirttiği zorunlu Sodium sürümü varsa (genelde
      // vardır) onu kullan — "en güncel Sodium" değil, "Iris'in test ettiği
      // Sodium". Yoksa (Iris yeni kurulmadıysa veya bağımlılık belirtmemişse)
      // en güncel Sodium'a düş.
      const pinnedSodiumId = irisVersion?.dependencies.find(
        (d) => d.dependency_type === 'required' && d.version_id
      )?.version_id

      const sodiumVersion = pinnedSodiumId
        ? await fetchModrinthVersionById(pinnedSodiumId)
        : await fetchLatestModrinthVersion(SODIUM_SLUG, mcVersion)

      const info = sodiumVersion && primaryFile(sodiumVersion)
      if (info) await downloadModJar(modsDir, info).catch(() => {})
    }
  } catch {
    // Performans modları tamamen best-effort — herhangi bir hata oyunun
    // açılmasını engellemez.
  }
}
