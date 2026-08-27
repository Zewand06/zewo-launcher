export function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return '0 dk'
  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days} gün`)
  if (hours > 0) parts.push(`${hours} sa`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} dk`)
  return parts.join(' ')
}

export function formatDate(ms: number | null): string {
  if (!ms) return 'Hiç'
  return new Date(ms).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
}

export const ROLE_LABELS: Record<string, string> = {
  member: 'Üye',
  vip: 'VIP',
  moderator: 'Moderatör',
  admin: 'Admin'
}
