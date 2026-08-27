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
    const url: string | undefined = decoded?.textures?.SKIN?.url
    if (!url) return null
    // Mojang bazı eski hesaplar için texture URL'ini http:// olarak döndürüyor
    // — Electron bunu sessizce engelliyor (skin hiç yüklenmiyor). https zaten
    // aynı sunucuda çalışıyor, sadece şemayı düzeltiyoruz.
    return url.replace(/^http:\/\//, 'https://')
  } catch {
    return null
  }
}

interface MojangUsernameLookup {
  id?: string
  name?: string
}

// Kullanıcı offline/cracked modda oynasa bile, kullandığı kullanıcı adı
// gerçekten sahip olduğu bir premium hesaba aitse (ör. "Zewand" hem premium
// hem de offline girişte kullanılıyor), o hesabın gerçek skin'ini yine de
// gösterebiliriz — Mojang'ın herkese açık kullanıcı adı->UUID servisiyle.
// O isimde kayıtlı bir premium hesap yoksa null döner ve Alex'e düşülür.
export async function fetchSkinUrlByUsername(username: string): Promise<string | null> {
  try {
    const lookupRes = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`
    )
    if (!lookupRes.ok) return null

    const lookup = (await lookupRes.json()) as MojangUsernameLookup
    if (!lookup.id) return null

    return await fetchMinecraftSkinUrl(lookup.id)
  } catch {
    return null
  }
}
