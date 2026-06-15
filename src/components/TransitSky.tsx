import { useEffect, useRef, useState } from 'react'
import { useBgCanvas } from './useBgCanvas'
import { bgStore, isGlVariant, subscribeBgVariant, type BgVariant } from './bgStore'
import GlSky from './GlSky'

/**
 * Projects-page backdrop: a fixed full-viewport canvas behind the dossiers.
 *
 * Same variant choice as Home (driven by the TEMPORARY switcher). 2D variants
 * render via useBgCanvas; the real-GLSL variants render through GlSky (WebGL2).
 * We swap which canvas mounts based on the active variant.
 */
function Bg2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useBgCanvas(canvasRef, 'projects')
  return <canvas className="sky" ref={canvasRef} aria-hidden="true" />
}

function TransitSky() {
  const [variant, setVariant] = useState<BgVariant>(bgStore.current)
  useEffect(() => subscribeBgVariant(setVariant), [])
  return isGlVariant(variant) ? <GlSky page="projects" /> : <Bg2D />
}

export default TransitSky
