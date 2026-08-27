import { app } from 'electron'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

export function getInstanceRoot(): string {
  return join(app.getPath('userData'), 'instance')
}

export function getModsDir(): string {
  return join(getInstanceRoot(), 'mods')
}

// Java kurulu olmayan (veya çok eski sürümü olan) kullanıcılar için: launcher
// klasörüne çıkarılmış taşınabilir bir JDK varsa onu kullan. Her Minecraft
// sürümü kendi Java sürümünü istediği için (ör. 26.2 → Java 25, eski
// sürümler → Java 21) sürüme özel bir klasörde tutuyoruz: jdk21/, jdk25/…
export function getJdkRoot(majorVersion: number): string {
  return join(app.getPath('userData'), `jdk${majorVersion}`)
}

export function getBundledJavaPath(majorVersion: number): string | null {
  const jdkRoot = getJdkRoot(majorVersion)
  if (!existsSync(jdkRoot)) return null

  const entries = readdirSync(jdkRoot).filter((name) => name.startsWith('jdk-'))
  if (entries.length === 0) return null

  const javaExe = join(jdkRoot, entries[0], 'bin', 'java.exe')
  return existsSync(javaExe) ? javaExe : null
}
