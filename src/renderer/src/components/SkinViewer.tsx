import { useEffect, useRef } from 'react'
import { SkinViewer as SkinViewerLib } from 'skinview3d'
import { AmbientWingAnimation } from '../utils/wingAnimation'

interface SkinViewerProps {
  skinUrl: string
  capeUrl?: string | null
  backEquipment?: 'cape' | 'elytra'
}

export default function SkinViewer({
  skinUrl,
  capeUrl,
  backEquipment = 'cape'
}: SkinViewerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewerRef = useRef<SkinViewerLib | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const viewer = new SkinViewerLib({
      canvas: canvasRef.current,
      width: 220,
      height: 300,
      zoom: 0.72,
      animation: new AmbientWingAnimation()
    })
    viewer.autoRotate = true
    viewer.autoRotateSpeed = 0.6
    viewer.controls.enableZoom = false
    viewerRef.current = viewer

    return () => {
      viewer.dispose()
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!skinUrl) return
    viewerRef.current?.loadSkin(skinUrl).catch(() => {})
  }, [skinUrl])

  useEffect(() => {
    if (capeUrl) {
      viewerRef.current?.loadCape(capeUrl, { backEquipment }).catch(() => {})
    } else {
      viewerRef.current?.resetCape()
    }
  }, [capeUrl, backEquipment])

  return <canvas ref={canvasRef} className="skin-viewer-canvas" />
}
