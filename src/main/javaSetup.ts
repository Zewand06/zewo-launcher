import { app } from 'electron'
import { createWriteStream, existsSync } from 'fs'
import { promises as fsp } from 'fs'
import { Readable } from 'stream'
import { join } from 'path'
import extract from 'extract-zip'
import { getBundledJavaPath } from './paths'
import type { LaunchProgress } from '../shared/types'

// Modern Minecraft (1.20.5+) Java 21 gerektiriyor ama kullanıcıların
// bilgisayarında genelde eski bir Java (ör. 1.8) kurulu oluyor — Poyraz'ın
// arkadaşında tam bu yüzden "compatibility level JAVA_21" hatası çıktı.
// Bunu her kullanıcı için elle çözmek yerine, launcher kendi taşınabilir
// Java 21'ini otomatik indirip kuruyor; sistemin Java'sına hiç dokunmuyoruz.
const ADOPTIUM_URL =
  'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse'

export async function ensureJavaPath(
  onProgress: (progress: LaunchProgress) => void
): Promise<string> {
  const existing = getBundledJavaPath()
  if (existing) return existing

  const jdkRoot = join(app.getPath('userData'), 'jdk21')
  const zipPath = join(app.getPath('temp'), 'zewo-jdk21.zip')

  onProgress({
    stage: 'java-download',
    message: 'Java 21 indiriliyor (ilk seferde gerekli, ~200 MB, biraz sürebilir)…'
  })

  const res = await fetch(ADOPTIUM_URL, { redirect: 'follow' })
  if (!res.ok || !res.body) {
    throw new Error('Java 21 indirilemedi.')
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

  const installed = getBundledJavaPath()
  if (!installed || !existsSync(installed)) {
    throw new Error('Java kurulumu tamamlanamadı.')
  }
  return installed
}
