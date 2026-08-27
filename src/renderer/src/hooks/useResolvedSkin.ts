import { useEffect, useState } from 'react'
import alexSkinUrl from '../assets/alex-skin.png'
import type { ZewoSession } from '../../../shared/types'

export type SkinModel = 'default' | 'slim' | 'auto-detect'

export interface ResolvedSkin {
  skinUrl: string
  skinModel: SkinModel
}

// Premium hesaplarda gerçek Minecraft skin'i, offline'da (o kullanıcı adı
// gerçekten senin premium hesabın değilse) resmi Alex skin'i gösterir.
// Home.tsx'in 3D önizlemesi ve Profil'in düz yüz avatarı aynı mantığı kullanıyor.
export function useResolvedSkin(session: ZewoSession): ResolvedSkin {
  const [skinUrl, setSkinUrl] = useState<string>(alexSkinUrl)
  const [skinModel, setSkinModel] = useState<SkinModel>('slim')

  useEffect(() => {
    if (session.authType !== 'microsoft') {
      setSkinUrl(alexSkinUrl)
      setSkinModel('slim')
      window.zewo.skin.fetchByUsername(session.username).then((url) => {
        if (url) {
          setSkinUrl(url)
          setSkinModel('auto-detect')
        }
      })
      return
    }
    window.zewo.skin.fetch(session.uuid).then((url) => {
      if (url) {
        setSkinUrl(url)
        setSkinModel('auto-detect')
      } else {
        setSkinUrl(alexSkinUrl)
        setSkinModel('slim')
      }
    })
  }, [session])

  return { skinUrl, skinModel }
}
