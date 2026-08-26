import type { ZewoApi } from '../../preload'

declare global {
  interface Window {
    zewo: ZewoApi
  }
}

export {}
