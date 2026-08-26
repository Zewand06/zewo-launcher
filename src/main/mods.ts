import { promises as fs } from 'fs'
import { basename, extname, join } from 'path'
import { dialog } from 'electron'
import { getModsDir } from './paths'
import type { ModEntry } from '../shared/types'

const DISABLED_SUFFIX = '.disabled'

async function ensureModsDir(): Promise<string> {
  const dir = getModsDir()
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export async function listMods(): Promise<ModEntry[]> {
  const dir = await ensureModsDir()
  const files = await fs.readdir(dir)
  const entries: ModEntry[] = []

  for (const file of files) {
    const enabled = extname(file) === '.jar'
    const isDisabledJar = file.endsWith(`.jar${DISABLED_SUFFIX}`)
    if (!enabled && !isDisabledJar) continue

    const stat = await fs.stat(join(dir, file))
    entries.push({
      fileName: file,
      sizeBytes: stat.size,
      enabled
    })
  }

  return entries.sort((a, b) => a.fileName.localeCompare(b.fileName))
}

export async function addModFromDialog(): Promise<ModEntry[]> {
  const dir = await ensureModsDir()
  const result = await dialog.showOpenDialog({
    title: 'Mod dosyası seç (.jar)',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Minecraft Mod', extensions: ['jar'] }]
  })

  if (!result.canceled) {
    for (const filePath of result.filePaths) {
      const target = join(dir, basename(filePath))
      await fs.copyFile(filePath, target)
    }
  }

  return listMods()
}

export async function setModEnabled(fileName: string, enabled: boolean): Promise<ModEntry[]> {
  const dir = await ensureModsDir()
  const current = join(dir, fileName)

  if (enabled && fileName.endsWith(DISABLED_SUFFIX)) {
    await fs.rename(current, join(dir, fileName.slice(0, -DISABLED_SUFFIX.length)))
  } else if (!enabled && !fileName.endsWith(DISABLED_SUFFIX)) {
    await fs.rename(current, join(dir, `${fileName}${DISABLED_SUFFIX}`))
  }

  return listMods()
}

export async function removeMod(fileName: string): Promise<ModEntry[]> {
  const dir = await ensureModsDir()
  await fs.rm(join(dir, fileName), { force: true })
  return listMods()
}
