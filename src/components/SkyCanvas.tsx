import { useEffect, useRef, useState } from 'react'
import { useBgCanvas } from './useBgCanvas'
import { bgStore, isGlVariant, subscribeBgVariant, type BgVariant } from './bgStore'
import GlSky from './GlSky'

/**
 * The descent spine: a fixed full-viewport canvas behind everything on Home.
 *
 * Painting is delegated to the selected background variant so the owner can
 * preview alternatives via the TEMPORARY switcher. Most variants paint in 2D
 * (useBgCanvas + bgVariants); the real-GLSL variants render through GlSky
 * (WebGL2). We swap which canvas is mounted based on the active variant — a
 * canvas can hold only one context type, so they can't share an element.
 */
function Bg2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useBgCanvas(canvasRef, 'home')
  return <canvas className="sky" ref={canvasRef} aria-hidden="true" />
}

function SkyCanvas() {
  const [variant, setVariant] = useState<BgVariant>(bgStore.current)
  useEffect(() => subscribeBgVariant(setVariant), [])
  return isGlVariant(variant) ? <GlSky page="home" /> : <Bg2D />
}

export default SkyCanvas
