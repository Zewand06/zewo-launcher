import zewoMark from '../assets/zewo-logo-mark.png'

interface LogoProps {
  size?: number
  glow?: boolean
  className?: string
}

// Uygulama içinde (sidebar, giriş ekranları, Yenilikler kutusu, sürüm
// seçici) ve paket simgesi (build/icon.ico) olarak kullanılan tek, tutarlı
// Zewo markası — Poyraz'ın gönderdiği rozetten kırpıldı.
export default function Logo({ size = 28, glow = true, className }: LogoProps): JSX.Element {
  return (
    <img
      src={zewoMark}
      width={size}
      height={size}
      alt="Zewo"
      className={className}
      style={{
        borderRadius: size * 0.22,
        objectFit: 'cover',
        filter: glow ? 'drop-shadow(0 0 10px rgba(224, 41, 47, 0.45))' : undefined
      }}
    />
  )
}
