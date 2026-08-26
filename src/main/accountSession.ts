import Store from 'electron-store'
import type { AccountSession } from '../shared/types'

interface StoreSchema {
  account: AccountSession | null
}

const store = new Store<StoreSchema>({
  name: 'zewo-account',
  defaults: { account: null }
})

export function saveAccountSession(session: AccountSession): void {
  store.set('account', session)
}

export function loadAccountSession(): AccountSession | null {
  return store.get('account')
}

export function clearAccountSession(): void {
  store.set('account', null)
}

export function updateEquipped(
  capeId: number | null,
  wingsId: number | null
): AccountSession | null {
  const current = store.get('account')
  if (!current) return null
  const next: AccountSession = { ...current, equippedCapeId: capeId, equippedWingsId: wingsId }
  store.set('account', next)
  return next
}
