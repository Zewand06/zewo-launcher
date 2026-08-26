// Azure app registration'dan alınan "Application (client) ID" buraya (veya
// ZEWO_MS_CLIENT_ID ortam değişkenine) girilmeden Microsoft girişi çalışmaz.
// Azure'da redirect URI olarak tam bu değeri, "Mobile and desktop applications"
// platformu altında tanımlamak gerekir: http://localhost/
export const MS_AUTH_CONFIG = {
  clientId: process.env.ZEWO_MS_CLIENT_ID ?? '',
  redirect: 'http://localhost/'
}

export function isMsAuthConfigured(): boolean {
  return MS_AUTH_CONFIG.clientId.trim().length > 0
}
