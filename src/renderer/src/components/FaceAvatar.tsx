interface FaceAvatarProps {
  skinUrl: string
  size?: number
}

// Minecraft skin dokusu 64x64'lük bir sprite sayfası; yüz 8x8'lik iki katman
// (temel + "hat" katmanı — saç/aksesuar gibi taşan detaylar) olarak (8,8) ve
// (40,8) konumlarında duruyor. Canvas/CORS'a hiç gerek kalmadan, sadece
// background-position ile o 8x8'lik pikseli büyütüp kırpıyoruz.
function layerStyle(skinUrl: string, size: number, srcX: number, srcY: number): React.CSSProperties {
  const scale = size / 8
  return {
    backgroundImage: `url(${skinUrl})`,
    backgroundSize: `${64 * scale}px ${64 * scale}px`,
    backgroundPosition: `${-srcX * scale}px ${-srcY * scale}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated'
  }
}

export default function FaceAvatar({ skinUrl, size = 128 }: FaceAvatarProps): JSX.Element {
  return (
    <div className="face-avatar" style={{ width: size, height: size }}>
      <div className="face-avatar-layer" style={layerStyle(skinUrl, size, 8, 8)} />
      <div className="face-avatar-layer" style={layerStyle(skinUrl, size, 40, 8)} />
    </div>
  )
}
