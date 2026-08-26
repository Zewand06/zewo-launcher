export type AuthType = 'offline' | 'microsoft'

export interface ZewoSession {
  authType: AuthType
  username: string
  uuid: string
  accessToken: string
  loggedInAt: number
}

export interface LaunchProgress {
  stage: string
  message: string
  done?: boolean
  error?: string
}

export interface ModEntry {
  fileName: string
  sizeBytes: number
  enabled: boolean
}

export interface LauncherSettings {
  javaPath: string
  maxMemoryMb: number
}

export type CosmeticType = 'cape' | 'wings'

export interface CosmeticItem {
  id: number
  type: CosmeticType
  name: string
}

export interface AccountProfile {
  id: number
  username: string
  isAdmin: boolean
  cosmetics: CosmeticItem[]
}

export interface AccountSession {
  token: string
  profile: AccountProfile
  equippedCapeId: number | null
  equippedWingsId: number | null
}

export type UpdateStage =
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateStatus {
  stage: UpdateStage
  version?: string
  percent?: number
  message?: string
}
