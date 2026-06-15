/**
 * TEMPORARY — background-variant picker store.
 *
 * A lenisStore-style module singleton (see hooks/useSmoothScroll.ts) that holds
 * the currently-selected animated-background variant and notifies subscribers
 * when it changes. Persisted to localStorage so the choice survives route
 * changes and reloads. Both SkyCanvas (home) and TransitSky (projects) read it.
 *
 * This whole file + BgSwitcher.tsx + bgVariants.ts exist only so Bhavya can
 * preview and pick a background. Once a winner is chosen, hardcode that variant
 * in the two canvas components and delete this module, BgSwitcher and the
 * switcher mount in App.tsx.
 */

export type BgVariant =
  | 'descent'
  | 'grid'
  | 'network'
  | 'aurora'
  | 'flow'
  | 'matrix'
  | 'life'
  | 'harmonics'
  | 'gradient'
  | 'eigen'
  | 'heapsort'
  | 'attractor'
  // merged from the lab copies
  | 'tessellate'
  | 'growth'
  | 'hilbert'
  | 'truchet'
  | 'ripple'
  | 'orbits'
  | 'epicycles'
  | 'pendulum'
  // four signature agents
  | 'blackhole'
  | 'plotter'
  | 'tesseract'
  | 'warp'
  // real-WebGL shader scenes (rendered by GlSky, not the 2D painter path)
  | 'complexgrid'
  | 'complexgrid2'
  | 'complexgrid3'
  | 'synthwave'

/** Variants rendered by the WebGL path (GlSky) instead of the 2D canvas. */
export const GL_VARIANTS = new Set<BgVariant>([
  'complexgrid',
  'complexgrid2',
  'complexgrid3',
  'synthwave',
])
export const isGlVariant = (v: BgVariant): boolean => GL_VARIANTS.has(v)

export interface BgVariantInfo {
  id: BgVariant
  label: string
  blurb: string
  author: string
}

export const BG_VARIANTS: BgVariantInfo[] = [
  // — first ambient set —
  { id: 'descent', label: 'DESCENT', blurb: 'Scroll sky + shooting stars', author: 'Lab · ambient' },
  { id: 'aurora', label: 'AURORA', blurb: 'Soft flowing nebula light', author: 'Lab · ambient' },
  { id: 'network', label: 'NETWORK', blurb: 'Drifting constellation / particle web', author: 'Lab · ambient' },
  { id: 'grid', label: 'GRID', blurb: 'Perspective grid receding to a horizon', author: 'Lab · ambient' },
  // — Claude: CS / math —
  { id: 'flow', label: 'FLOW', blurb: 'Vector field, traced by particles', author: 'Claude · CS-math' },
  { id: 'matrix', label: 'MATRIX', blurb: 'A grid of bits, lit by a passing wave', author: 'Claude · CS-math' },
  { id: 'life', label: 'LIFE', blurb: "Conway's Game of Life, evolving", author: 'Claude · CS-math' },
  { id: 'harmonics', label: 'HARMONICS', blurb: 'Morphing Lissajous curves', author: 'Claude · CS-math' },
  // — Claude: interactive concepts —
  { id: 'gradient', label: 'GRADIENT', blurb: 'Vector field — cursor repels the flow', author: 'Claude · concepts' },
  { id: 'eigen', label: 'EIGEN', blurb: 'Linear transform; scroll shears, eigenvectors hold', author: 'Claude · concepts' },
  { id: 'heapsort', label: 'HEAPSORT', blurb: 'Constellation that swaps nodes; hover repels', author: 'Claude · concepts' },
  { id: 'attractor', label: 'ATTRACTOR', blurb: 'Lorenz attractor; cursor steers the view', author: 'Claude · concepts' },
  // — Lab A: discrete / geometric —
  { id: 'tessellate', label: 'TESSELLATE', blurb: 'Drifting Voronoi cells', author: 'Lab A · geometric' },
  { id: 'growth', label: 'GROWTH', blurb: 'Recursive L-system fractal tree', author: 'Lab A · geometric' },
  { id: 'hilbert', label: 'HILBERT', blurb: 'Space-filling curve + comet', author: 'Lab A · geometric' },
  { id: 'truchet', label: 'TRUCHET', blurb: 'Flipping arc-tiles form contours', author: 'Lab A · geometric' },
  // — Lab B: continuous / physical —
  { id: 'ripple', label: 'RIPPLE', blurb: 'Wave interference / ripple tank', author: 'Lab B · physical' },
  { id: 'orbits', label: 'ORBITS', blurb: 'n-body gravity with comet trails', author: 'Lab B · physical' },
  { id: 'epicycles', label: 'EPICYCLES', blurb: 'Fourier epicycles draw a glyph', author: 'Lab B · physical' },
  { id: 'pendulum', label: 'PENDULUM', blurb: 'Chaotic double pendulums', author: 'Lab B · physical' },
  // — four signature agents —
  { id: 'blackhole', label: 'BLACKHOLE', blurb: 'A clean black void; the spacetime grid wraps + funnels into it', author: 'Agent · blackhole' },
  { id: 'plotter', label: 'PLOTTER', blurb: 'Cool functions draw on a Cartesian plane', author: 'Agent · plotter' },
  { id: 'tesseract', label: 'TESSERACT', blurb: 'A 4D hypercube rotating in space', author: 'Agent · tesseract' },
  { id: 'warp', label: 'WARP', blurb: 'Hyperspace starfield; scroll jumps to light speed', author: 'Agent · warp' },
  // — real WebGL shaders (GlSky render path) —
  { id: 'complexgrid', label: 'COMPLEX GRID', blurb: 'Live GLSL: a complex-plane grid warped by a Bézier map', author: 'WebGL · shader' },
  { id: 'complexgrid2', label: 'COMPLEX GRID 2', blurb: 'Calmer complex grid: slower, faded, single-colour', author: 'WebGL · shader' },
  { id: 'complexgrid3', label: 'COMPLEX GRID 3', blurb: 'The complex grid, much, much slower (full colour)', author: 'WebGL · shader' },
  { id: 'synthwave', label: 'SYNTHWAVE', blurb: 'Live GLSL: a retro sunset over an endless amber grid', author: 'WebGL · shader' },
]

const STORAGE_KEY = 'bk-bg-variant'
const DEFAULT: BgVariant = 'network'

function read(): BgVariant {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v && BG_VARIANTS.some((b) => b.id === v)) return v as BgVariant
  } catch {
    /* private mode / disabled storage — fall through to default */
  }
  return DEFAULT
}

const listeners = new Set<(v: BgVariant) => void>()

export const bgStore: { current: BgVariant } = { current: read() }

/** Switch the active variant, persist it, and notify every canvas + the switcher. */
export function setBgVariant(v: BgVariant): void {
  if (v === bgStore.current) return
  bgStore.current = v
  try {
    window.localStorage.setItem(STORAGE_KEY, v)
  } catch {
    /* ignore storage failures */
  }
  for (const fn of listeners) fn(v)
}

/** Subscribe to variant changes. Returns an unsubscribe fn. */
export function subscribeBgVariant(fn: (v: BgVariant) => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/* ------------------------------------------------------------------ */
/* DOM black-hole easter egg toggle (separate from the bg variant).    */
/* A cursor-following lens that warps + temporarily swallows real page  */
/* elements. Toggled from the dev menu; mounted at the App root.        */
/* ------------------------------------------------------------------ */

const HOLE_KEY = 'bk-domhole'

function readHole(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(HOLE_KEY) === '1'
  } catch {
    return false
  }
}

const holeListeners = new Set<(on: boolean) => void>()

export const domHoleStore: { current: boolean } = { current: readHole() }

export function setDomHole(on: boolean): void {
  if (on === domHoleStore.current) return
  domHoleStore.current = on
  try {
    window.localStorage.setItem(HOLE_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
  for (const fn of holeListeners) fn(on)
}

export function subscribeDomHole(fn: (on: boolean) => void): () => void {
  holeListeners.add(fn)
  return () => {
    holeListeners.delete(fn)
  }
}
