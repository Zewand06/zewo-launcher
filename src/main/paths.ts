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
// klasörüne çıkarılmış taşınabilir bir JDK varsa onu kullan. Bkz. jdk21/
// klasörü — Adoptium'un zip dağıtımı buraya çıkarılır, kurulum gerekmez.
export function getBundledJavaPath(): string | null {
  const jdkRoot = join(app.getPath('userData'), 'jdk21')
  if (!existsSync(jdkRoot)) return null

  const entries = readdirSync(jdkRoot).filter((name) => name.startsWith('jdk-'))
  if (entries.length === 0) return null

  const javaExe = join(jdkRoot, entries[0], 'bin', 'java.exe')
  return existsSync(javaExe) ? javaExe : null
}
