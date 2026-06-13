/**
 * Canvas-side colors. CSS custom properties can't be read cheaply inside
 * rAF paint loops, so canvases import these constants; they must stay in
 * sync with src/theme/space.css.
 */

export const PALETTE = {
  ink: '#0c0b09',
  bone: '#e8e4d8',
  boneDim: '#9b968a',
  amber: '#ffb000',
  amberDeep: '#c77f00',
} as const

/**
 * Home-page descent sky: gradient keyframes from deep space (progress 0)
 * down to the floodlit pad at dusk (progress 1). Each frame is the
 * [top, mid, bottom] colors of a vertical gradient.
 */
export interface SkyStop {
  at: number
  top: [number, number, number]
  mid: [number, number, number]
  bottom: [number, number, number]
}

export const DESCENT_SKY: SkyStop[] = [
  // deep space — near black, hint of blue
  { at: 0.0, top: [2, 2, 8], mid: [4, 5, 14], bottom: [8, 10, 24] },
  // thermosphere/mesosphere — indigo creeps in
  { at: 0.3, top: [3, 4, 12], mid: [10, 14, 38], bottom: [22, 32, 68] },
  // stratosphere — deep blue brightening below
  { at: 0.6, top: [10, 16, 40], mid: [28, 52, 96], bottom: [70, 110, 160] },
  // troposphere — real daylight blue building
  { at: 0.85, top: [24, 48, 92], mid: [70, 120, 180], bottom: [125, 175, 220] },
  // surface — clear blue day over green ground
  { at: 1.0, top: [55, 100, 160], mid: [105, 155, 210], bottom: [150, 195, 235] },
]

/** Linear interpolation across the keyframed sky. */
export function sampleSky(progress: number): {
  top: string
  mid: string
  bottom: string
} {
  const p = Math.min(1, Math.max(0, progress))
  let a = DESCENT_SKY[0]!
  let b = DESCENT_SKY[DESCENT_SKY.length - 1]!
  for (let i = 0; i < DESCENT_SKY.length - 1; i++) {
    if (p >= DESCENT_SKY[i]!.at && p <= DESCENT_SKY[i + 1]!.at) {
      a = DESCENT_SKY[i]!
      b = DESCENT_SKY[i + 1]!
      break
    }
  }
  const span = b.at - a.at || 1
  const t = (p - a.at) / span
  const mix = (x: [number, number, number], y: [number, number, number]) =>
    `rgb(${Math.round(x[0] + (y[0] - x[0]) * t)}, ${Math.round(
      x[1] + (y[1] - x[1]) * t,
    )}, ${Math.round(x[2] + (y[2] - x[2]) * t)})`
  return { top: mix(a.top, b.top), mid: mix(a.mid, b.mid), bottom: mix(a.bottom, b.bottom) }
}

/** Deterministic PRNG shared by canvas painters. */
export function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
