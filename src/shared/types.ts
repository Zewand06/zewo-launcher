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

export type UserRole = 'member' | 'vip' | 'moderator' | 'admin'

export const ALL_ROLES: UserRole[] = ['member', 'vip', 'moderator', 'admin']

export type Permission =
  | 'view_others'
  | 'manage_cosmetics'
  | 'reset_password'
  | 'delete_user'
  | 'manage_roles'

export const ALL_PERMISSIONS: Permission[] = [
  'view_others',
  'manage_cosmetics',
  'reset_password',
  'delete_user',
  'manage_roles'
]

export interface AccountProfile {
  id: number
  username: string
  isAdmin: boolean
  role: UserRole
  cosmetics: CosmeticItem[]
  createdAt: number
  lastLoginAt: number | null
  totalPlaytimeMs: number
  mostPlayedVersion: string | null
}

export type PermissionMatrix = Record<UserRole, Permission[]>

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
