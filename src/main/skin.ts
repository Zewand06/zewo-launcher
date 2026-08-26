interface MojangTextureProperty {
  name: string
  value: string
}

interface MojangProfileResponse {
  properties?: MojangTextureProperty[]
}

// Premium (Microsoft) hesaplar için gerçek Minecraft skin'ini Mojang'ın
// oturum sunucusundan çeker. Cracked/offline hesaplarda gerçek bir profil
// olmadığı için bu her zaman null döner.
export async function fetchMinecraftSkinUrl(uuid: string): Promise<string | null> {
  try {
    const clean = uuid.replace(/-/g, '')
    const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${clean}`)
    if (!res.ok) return null

    const data = (await res.json()) as MojangProfileResponse
    const texturesProp = data.properties?.find((p) => p.name === 'textures')
    if (!texturesProp) return null

    const decoded = JSON.parse(Buffer.from(texturesProp.value, 'base64').toString('utf-8'))
    return decoded?.textures?.SKIN?.url ?? null
  } catch {
    return null
  }
}
