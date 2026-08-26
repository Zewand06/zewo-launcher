import { promises as fs } from 'fs'
import { join } from 'path'
import { getModsDir } from './paths'

interface ModrinthFile {
  url: string
  filename: string
  primary: boolean
}

interface ModrinthVersion {
  version_number: string
  files: ModrinthFile[]
}

// Lunar Client/Badlion gibi launcher'ların arka planda otomatik kurduğu FPS
// modları. OptiFine yerine bunları seçtik çünkü OptiFine esasen Forge içindir
// ve Fabric'te resmi desteği yok — Sodium+Lithium+Iris hem daha performanslı
// hem de Fabric'in kendi ekosisteminin parçası.
const PERFORMANCE_MODS = ['sodium', 'lithium', 'iris'] as const

async function fetchLatestModrinthJar(
  slug: string,
  mcVersion: string
): Promise<{ url: string; filename: string } | null> {
  try {
    const loaders = encodeURIComponent(JSON.stringify(['fabric']))
    const gameVersions = encodeURIComponent(JSON.stringify([mcVersion]))
    const res = await fetch(
      `https://api.modrinth.com/v2/project/${slug}/version?loaders=${loaders}&game_versions=${gameVersions}`
    )
    if (!res.ok) return null

    const versions = (await res.json()) as ModrinthVersion[]
    const latest = versions[0]
    if (!latest) return null

    const file = latest.files.find((f) => f.primary) ?? latest.files[0]
    return file ? { url: file.url, filename: file.filename } : null
  } catch {
    return null
  }
}

// Bu üç mod, sürüme göre değişen ayrı jar dosyaları gerektirir. Modun bir
// önceki sürümden kalma (farklı Minecraft sürümüne ait) jar'ı modlar
// klasöründe kalırsa Fabric aynı mod id'sini iki kez görüp yüklemeyi
// reddedebilir — bu yüzden güncel olmayanları önce temizliyoruz.
export async function installPerformanceMods(
  mcVersion: string,
  onProgress: (message: string) => void
): Promise<void> {
  try {
    const modsDir = getModsDir()
    await fs.mkdir(modsDir, { recursive: true })
    const existing = await fs.readdir(modsDir)

    for (const slug of PERFORMANCE_MODS) {
      const matches = existing.filter((name) =>
        name.toLowerCase().replace(/\.disabled$/, '').startsWith(slug)
      )
      const upToDate = matches.find((name) => name.includes(mcVersion))

      for (const staleName of matches) {
        if (staleName === upToDate) continue
        await fs.rm(join(modsDir, staleName), { force: true }).catch(() => {})
      }

      if (upToDate) continue

      onProgress(`${slug[0].toUpperCase()}${slug.slice(1)} indiriliyor…`)
      const info = await fetchLatestModrinthJar(slug, mcVersion)
      if (!info) continue

      try {
        const res = await fetch(info.url)
        if (!res.ok) continue
        const buffer = Buffer.from(await res.arrayBuffer())
        await fs.writeFile(join(modsDir, info.filename), buffer)
      } catch {
        // Tek bir performans modu indirilemese bile oyun başlatmayı bloklamıyoruz.
      }
    }
  } catch {
    // Performans modları tamamen best-effort — herhangi bir hata oyunun
    // açılmasını engellemez.
  }
}
