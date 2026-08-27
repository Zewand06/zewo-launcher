import { app } from 'electron'
import { createWriteStream, existsSync } from 'fs'
import { promises as fsp } from 'fs'
import { Readable } from 'stream'
import { join } from 'path'
import extract from 'extract-zip'
import { getBundledJavaPath, getJdkRoot } from './paths'
import type { LaunchProgress } from '../shared/types'

// Modern Minecraft her sürümde farklı bir Java isteyebiliyor (ör. 26.2
// çıkışıyla Java 21'den Java 25'e geçti) — bunu elle takip etmek yerine
// launchGame, sürümün kendi manifest dosyasından okuduğu gerçek
// majorVersion'ı buraya geçiyor. Kullanıcıların bilgisayarında genelde eski
// bir Java kurulu oluyor; sistemin Java'sına hiç dokunmadan, launcher
// gereken sürümü kendi taşınabilir kopyasını otomatik indirip kuruyor.
function adoptiumUrl(majorVersion: number): string {
  return `https://api.adoptium.net/v3/binary/latest/${majorVersion}/ga/windows/x64/jdk/hotspot/normal/eclipse`
}

export async function ensureJavaPath(
  onProgress: (progress: LaunchProgress) => void,
  majorVersion: number
): Promise<string> {
  const existing = getBundledJavaPath(majorVersion)
  if (existing) return existing

  const jdkRoot = getJdkRoot(majorVersion)
  const zipPath = join(app.getPath('temp'), `zewo-jdk${majorVersion}.zip`)

  onProgress({
    stage: 'java-download',
    message: `Java ${majorVersion} indiriliyor (ilk seferde gerekli, ~200 MB, biraz sürebilir)…`
  })

  const res = await fetch(adoptiumUrl(majorVersion), { redirect: 'follow' })
  if (!res.ok || !res.body) {
    throw new Error(`Java ${majorVersion} indirilemedi.`)
  }

  await fsp.mkdir(app.getPath('temp'), { recursive: true })
  await new Promise<void>((resolve, reject) => {
    const fileStream = createWriteStream(zipPath)
    Readable.fromWeb(res.body as import('stream/web').ReadableStream).pipe(fileStream)
    fileStream.on('finish', () => resolve())
    fileStream.on('error', reject)
  })

  onProgress({ stage: 'java-extract', message: 'Java kuruluyor…' })
  await fsp.mkdir(jdkRoot, { recursive: true })
  await extract(zipPath, { dir: jdkRoot })
  await fsp.rm(zipPath, { force: true })

  const installed = getBundledJavaPath(majorVersion)
  if (!installed || !existsSync(installed)) {
    throw new Error(`Java ${majorVersion} kurulumu tamamlanamadı.`)
  }
  return installed
}
