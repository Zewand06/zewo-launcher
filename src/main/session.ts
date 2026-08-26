import Store from 'electron-store'
import type { ZewoSession } from '../shared/types'

interface StoreSchema {
  session: ZewoSession | null
}

const store = new Store<StoreSchema>({
  name: 'zewo-session',
  defaults: { session: null }
})

export function saveSession(session: ZewoSession): void {
  store.set('session', session)
}

export function loadSession(): ZewoSession | null {
  return store.get('session')
}

export function clearSession(): void {
  store.set('session', null)
}
