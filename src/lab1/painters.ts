/**
 * TEMPORARY (preview) — Lab 1 painters: DISCRETE / GEOMETRIC / STRUCTURAL.
 *
 * Four genuinely distinct, CS / discrete-math flavoured animated backgrounds,
 * cooler steel-blue/cyan with amber accents and crisp 1px geometry. Each is a
 * factory returning a painter with the SAME interface as the existing engine so
 * the canvas driver can swap them live:
 *
 *   make*(ctx, page) -> {
 *     resize(w, h, reduced)                       // mount + window resize
 *     paint(w, h, timeSec, progress, reduced)     // per frame (per scroll when reduced)
 *     pointer?(x, y)                              // optional cursor input (CSS px)
 *   }
 *
 * No CSS-var reads in the loop (colors mirror palette.ts). O(n) hot loops, no
 * per-frame allocation beyond a couple of gradients. `reduced` => calm static
 * frame. These NEVER import the existing engine (useBgCanvas/bgVariants/etc).
 *
 * Distinct from the already-used set (scroll-sky, aurora, constellation,
 * perspective grid, vector field, matrix wave, Conway life, Lissajous,
 * gradient-descent, eigen-grid, heapsort, Lorenz) AND from Agent B's organic
 * territory: these are tessellation / fractal recursion / space-filling curve /
 * Truchet tiling.
 *
 * Delete this folder once a direction is chosen.
 */

import { mulberry32 } from '../lib/palette'

export type LabPage = 'home'

/** Pointer in CSS px; `active` is only true while the cursor is moving. Mirrors
 * BgMouse from the engine without importing it (these files stay standalone). */
export interface LabMouse {
  x: number
  y: number
  active: boolean
}

export interface LabPainter {
  resize(w: number, h: number, reduced: boolean): void
  paint(
    w: number,
    h: number,
    timeSec: number,
    progress: number,
    reduced: boolean,
    mouse?: LabMouse,
  ): void
  pointer?(x: number, y: number): void
}

// Palette mirrors (rgb triples for rgba interpolation). Cool-leaning.
const AMBER = '255, 176, 0'
const BONE = '232, 228, 216'
const STEEL = '120, 158, 196' // cool steel-blue line
const CYAN = '120, 210, 224' // cool cyan accent

/** Shared deep, cool base wash. Slightly deepens with scroll on home. */
function coolBase(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) {
  const t = Math.max(0, Math.min(1, progress))
  const g = ctx.createLinearGradient(0, 0, 0, h)
  // near-black with a faint blue tilt; bottom a touch deeper as you descend
  g.addColorStop(0, `rgb(${6 - t * 2}, ${8 - t * 2}, ${14 - t * 2})`)
  g.addColorStop(1, `rgb(3, 4, 9)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

/* ================================================================== */
/* A — TESSELLATE                                                       */
/*   Animated Voronoi diagram: a set of drifting "sites" partitions the */
/*   plane into nearest-site cells. We sample the plane on a coarse grid */
/*   and stroke the boundaries where the nearest site changes (a cheap, */
/*   allocation-free Voronoi edge render). The cell under the cursor and */
/*   its Delaunay-neighbour spokes light amber. Lloyd-style gentle drift */
/*   keeps the tessellation alive without ever settling.                */
/* ================================================================== */

interface Site {
  x: number
  y: number
  bx: number // base (orbit center), normalized 0..1
  by: number
  ax: number // orbit amplitude
  ay: number
  sx: number // orbit speed
  sy: number
  ph: number
  cool: boolean
}

export function makeTessellate(ctx: CanvasRenderingContext2D): LabPainter {
  const rand = mulberry32(1337)
  let W = 0
  let H = 0
  let sites: Site[] = []
  let px = -1
  let py = -1
  // grid sampling buffers (reused; no per-frame alloc)
  let cols = 0
  let rows = 0
  let step = 0
  let owner = new Int16Array(0)

  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    const n = reduced ? 14 : Math.max(18, Math.min(34, Math.round((w * h) / 46000)))
    sites = Array.from({ length: n }, () => ({
      x: 0,
      y: 0,
      bx: 0.06 + rand() * 0.88,
      by: 0.06 + rand() * 0.88,
      ax: 0.02 + rand() * 0.05,
      ay: 0.02 + rand() * 0.05,
      sx: 0.05 + rand() * 0.12,
      sy: 0.05 + rand() * 0.12,
      ph: rand() * Math.PI * 2,
      cool: rand() > 0.5,
    }))
    // sampling grid: coarse enough to be cheap, fine enough for clean edges
    step = Math.max(7, Math.round(Math.min(w, h) / 120))
    cols = Math.ceil(w / step) + 1
    rows = Math.ceil(h / step) + 1
    owner = new Int16Array(cols * rows)
  }

  const nearest = (x: number, y: number): number => {
    let best = -1
    let bd = Infinity
    for (let i = 0; i < sites.length; i++) {
      const s = sites[i]!
      const dx = s.x - x
      const dy = s.y - y
      const d = dx * dx + dy * dy
      if (d < bd) {
        bd = d
        best = i
      }
    }
    return best
  }

  return {
    resize(w, h, reduced) {
      build(w, h, reduced)
    },
    pointer(x, y) {
      px = x
      py = y
    },
    paint(w, h, t, progress, reduced, mouse) {
      if (w !== W || h !== H) build(w, h, reduced)
      // the engine drives the cursor through paint()'s mouse arg (it never calls
      // pointer()); track it here so the hot-cell highlight + spokes light up,
      // and release the highlight when the cursor goes still.
      if (mouse) {
        if (mouse.active) {
          px = mouse.x
          py = mouse.y
        } else {
          px = -1
          py = -1
        }
      }
      coolBase(ctx, w, h, progress)

      // advance sites along gentle orbits (frozen when reduced)
      const tt = reduced ? 0 : t
      for (const s of sites) {
        s.x = (s.bx + Math.sin(tt * s.sx + s.ph) * s.ax) * w
        s.y = (s.by + Math.cos(tt * s.sy + s.ph) * s.ay) * h
      }

      // pass 1: nearest-site ownership over the sampling grid
      for (let r = 0; r < rows; r++) {
        const gy = r * step
        for (let c = 0; c < cols; c++) {
          owner[r * cols + c] = nearest(c * step, gy)
        }
      }

      // which site owns the cursor?
      const hot = px >= 0 ? nearest(px, py) : -1

      // pass 2: stroke a 1px edge where the right/down neighbour has a different
      // owner — this traces the Voronoi cell boundaries cheaply.
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgba(${STEEL}, 0.30)`
      ctx.beginPath()
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const o = owner[r * cols + c]!
          const right = owner[r * cols + c + 1]!
          const down = owner[(r + 1) * cols + c]!
          if (o !== right) {
            const x = c * step + step * 0.5
            ctx.moveTo(x, r * step)
            ctx.lineTo(x, (r + 1) * step)
          }
          if (o !== down) {
            const y = r * step + step * 0.5
            ctx.moveTo(c * step, y)
            ctx.lineTo((c + 1) * step, y)
          }
        }
      }
      ctx.stroke()

      // highlight the cursor cell's boundary in amber
      if (hot >= 0 && !reduced) {
        ctx.lineWidth = 1.4
        ctx.strokeStyle = `rgba(${AMBER}, 0.7)`
        ctx.beginPath()
        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols - 1; c++) {
            const o = owner[r * cols + c]!
            const right = owner[r * cols + c + 1]!
            const down = owner[(r + 1) * cols + c]!
            if ((o === hot) !== (right === hot)) {
              const x = c * step + step * 0.5
              ctx.moveTo(x, r * step)
              ctx.lineTo(x, (r + 1) * step)
            }
            if ((o === hot) !== (down === hot)) {
              const y = r * step + step * 0.5
              ctx.moveTo(c * step, y)
              ctx.lineTo((c + 1) * step, y)
            }
          }
        }
        ctx.stroke()
      }

      // Delaunay-ish spokes: connect the hot site to its near neighbours
      if (hot >= 0 && !reduced) {
        const a = sites[hot]!
        ctx.lineWidth = 1
        for (let j = 0; j < sites.length; j++) {
          if (j === hot) continue
          const b = sites[j]!
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < Math.min(w, h) * 0.34) {
            const alpha = (1 - d / (Math.min(w, h) * 0.34)) * 0.45
            ctx.strokeStyle = `rgba(${CYAN}, ${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // site dots
      for (let i = 0; i < sites.length; i++) {
        const s = sites[i]!
        const isHot = i === hot
        ctx.fillStyle = isHot
          ? `rgba(${AMBER}, 0.95)`
          : s.cool
            ? `rgba(${CYAN}, 0.6)`
            : `rgba(${BONE}, 0.5)`
        ctx.beginPath()
        ctx.arc(s.x, s.y, isHot ? 2.6 : 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}

/* ================================================================== */
/* B — GROWTH                                                          */
/*   A recursive binary fractal tree (an L-system: each branch splits   */
/*   into two child branches rotated by ±theta and scaled by ratio).    */
/*   It "grows" — a 0..1 growth value reveals depth-by-depth — then     */
/*   sways. Scroll progress + a slow breath drive the branch angle so   */
/*   the canopy opens and closes. Drawn recursively each frame (depth   */
/*   capped) — fully deterministic, no stored particles.                */
/* ================================================================== */

export function makeGrowth(ctx: CanvasRenderingContext2D): LabPainter {
  let W = 0
  let H = 0

  const build = (w: number, h: number) => {
    W = w
    H = h
  }

  // recursive branch: returns nothing, strokes one segment then recurses
  const branch = (
    x: number,
    y: number,
    angle: number,
    len: number,
    depth: number,
    maxDepth: number,
    grow: number, // 0..1 reveal progress
    theta: number,
    sway: number,
  ) => {
    if (depth > maxDepth || len < 2) return
    // reveal: each depth ring fades in over its slice of `grow`
    const slice = depth / (maxDepth + 1)
    const local = Math.max(0, Math.min(1, (grow - slice) * (maxDepth + 1)))
    if (local <= 0.001) return

    const ex = x + Math.cos(angle) * len * local
    const ey = y + Math.sin(angle) * len * local

    // deeper branches are cooler & thinner; trunk steel, tips cyan
    const k = depth / maxDepth
    const alpha = 0.1 + (1 - k) * 0.32
    const col = k > 0.62 ? CYAN : STEEL
    ctx.strokeStyle = `rgba(${col}, ${alpha * local})`
    ctx.lineWidth = Math.max(0.6, (1 - k) * 2.1)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(ex, ey)
    ctx.stroke()

    if (local < 0.999) return // don't recurse past the growing tip

    // amber buds at the leaf tips
    if (depth === maxDepth) {
      ctx.fillStyle = `rgba(${AMBER}, 0.5)`
      ctx.beginPath()
      ctx.arc(ex, ey, 1.4, 0, Math.PI * 2)
      ctx.fill()
    }

    const nextLen = len * 0.74
    // sway increases toward the tips (like wind in a canopy)
    const wob = sway * (depth + 1) * 0.16
    branch(ex, ey, angle - theta + wob, nextLen, depth + 1, maxDepth, grow, theta, sway)
    branch(ex, ey, angle + theta + wob, nextLen, depth + 1, maxDepth, grow, theta, sway)
  }

  return {
    resize(w, h) {
      build(w, h)
    },
    paint(w, h, t, progress, reduced) {
      if (w !== W || h !== H) build(w, h)
      coolBase(ctx, w, h, progress)

      const minD = Math.min(w, h)
      const maxDepth = w < 640 ? 8 : 10
      // grow: animate in once then hold full; reduced => fully grown static
      const grow = reduced ? 1 : Math.min(1, t * 0.35)
      // branch angle opens with scroll + a slow breath; sway is the wind
      const breath = reduced ? 0 : Math.sin(t * 0.5) * 0.06
      const theta = 0.42 + progress * 0.16 + breath
      const sway = reduced ? 0 : Math.sin(t * 0.7)

      ctx.lineCap = 'round'

      // Two trees rooted off the bottom corners, reaching inward, so the
      // canopy frames the content without ever crowding the center text.
      const trunk = minD * 0.2
      branch(w * 0.16, h + 6, -Math.PI / 2 - 0.28, trunk, 0, maxDepth, grow, theta, sway)
      branch(
        w * 0.86,
        h + 6,
        -Math.PI / 2 + 0.28,
        trunk * 0.92,
        0,
        maxDepth,
        grow,
        theta,
        -sway,
      )

      ctx.lineCap = 'butt'
    },
  }
}

/* ================================================================== */
/* C — HILBERT                                                         */
/*   The Hilbert space-filling curve at a fixed order (a recursive      */
/*   fractal that visits every cell of a 2^n x 2^n grid exactly once,   */
/*   a real CS structure used for locality-preserving indexing). The    */
/*   full path is precomputed once; the screen draws it dim, then a      */
/*   bright amber "pulse" travels along the path and a leading edge      */
/*   "draws it in" so it reads as the curve writing itself. Scroll       */
/*   nudges the pulse position too.                                      */
/* ================================================================== */

export function makeHilbert(ctx: CanvasRenderingContext2D): LabPainter {
  let W = 0
  let H = 0
  let pts: { x: number; y: number }[] = []
  let order = 5

  // map a distance d along a Hilbert curve of side n (=2^order) to (x,y)
  const d2xy = (n: number, dIn: number): [number, number] => {
    let rx: number
    let ry: number
    let d = dIn
    let x = 0
    let y = 0
    for (let s = 1; s < n; s *= 2) {
      rx = 1 & (d / 2)
      ry = 1 & (d ^ rx)
      // rotate
      if (ry === 0) {
        if (rx === 1) {
          x = s - 1 - x
          y = s - 1 - y
        }
        const tmp = x
        x = y
        y = tmp
      }
      x += s * rx
      y += s * ry
      d = Math.floor(d / 4)
    }
    return [x, y]
  }

  const build = (w: number, h: number) => {
    W = w
    H = h
    order = Math.min(w, h) < 620 ? 4 : 5
    const n = 1 << order // cells per side
    const total = n * n
    // square area centered, padded
    const size = Math.min(w, h) * 0.82
    const ox = (w - size) / 2
    const oy = (h - size) / 2
    const cell = size / n
    pts = new Array(total)
    for (let d = 0; d < total; d++) {
      const [gx, gy] = d2xy(n, d)
      pts[d] = { x: ox + (gx + 0.5) * cell, y: oy + (gy + 0.5) * cell }
    }
  }

  return {
    resize(w, h) {
      build(w, h)
    },
    paint(w, h, t, progress, reduced) {
      if (w !== W || h !== H || pts.length === 0) build(w, h)
      coolBase(ctx, w, h, progress)

      const total = pts.length

      // dim full curve (the "scaffold")
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgba(${STEEL}, 0.14)`
      ctx.beginPath()
      ctx.moveTo(pts[0]!.x, pts[0]!.y)
      for (let i = 1; i < total; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
      ctx.stroke()

      if (reduced) {
        // static: just a soft amber dot at the start, no pulse
        ctx.fillStyle = `rgba(${AMBER}, 0.6)`
        ctx.beginPath()
        ctx.arc(pts[0]!.x, pts[0]!.y, 2.2, 0, Math.PI * 2)
        ctx.fill()
        return
      }

      // a pulse travels along the path; scroll offsets its head a little
      const head = ((t * 0.06 + progress * 0.25) % 1) * total
      const tailLen = total * 0.16 // bright comet tail length

      // draw the bright segment as a fading gradient comet
      ctx.lineWidth = 1.6
      const start = Math.max(1, Math.floor(head - tailLen))
      const end = Math.min(total - 1, Math.ceil(head))
      for (let i = start; i <= end; i++) {
        const a = pts[i - 1]!
        const b = pts[i]!
        // brightness ramps to the head
        const u = (i - start) / Math.max(1, end - start)
        const alpha = u * 0.85
        // cool body, amber at the very head
        const col = u > 0.8 ? AMBER : CYAN
        ctx.strokeStyle = `rgba(${col}, ${alpha})`
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      // glowing head node
      const hi = Math.min(total - 1, Math.floor(head))
      const hp = pts[hi]!
      const glow = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 14)
      glow.addColorStop(0, `rgba(${AMBER}, 0.55)`)
      glow.addColorStop(1, `rgba(${AMBER}, 0)`)
      ctx.fillStyle = glow
      ctx.fillRect(hp.x - 14, hp.y - 14, 28, 28)
      ctx.fillStyle = `rgba(${AMBER}, 0.95)`
      ctx.beginPath()
      ctx.arc(hp.x, hp.y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    },
  }
}

/* ================================================================== */
/* D — TRUCHET                                                         */
/*   Truchet tiling: each square tile carries two quarter-circle arcs   */
/*   in one of two orientations. A field of tiles whose orientation is  */
/*   driven by a moving sine wave flips region-by-region, so smooth     */
/*   maze-like contours continuously reform across the grid. A diagonal */
/*   wave front highlights the arcs it's currently passing through in    */
/*   amber. Classic generative-art / discrete-combinatorics motif.      */
/* ================================================================== */

export function makeTruchet(ctx: CanvasRenderingContext2D): LabPainter {
  const rand = mulberry32(8675309)
  let W = 0
  let H = 0
  let cell = 56
  let cols = 0
  let rows = 0
  let bias = new Float32Array(0) // per-tile random phase offset

  const build = (w: number, h: number) => {
    W = w
    H = h
    cell = Math.max(40, Math.round(Math.min(w, h) / 11))
    cols = Math.ceil(w / cell) + 1
    rows = Math.ceil(h / cell) + 1
    bias = new Float32Array(cols * rows)
    for (let i = 0; i < bias.length; i++) bias[i] = rand() * Math.PI * 2
  }

  return {
    resize(w, h) {
      build(w, h)
    },
    paint(w, h, t, progress, reduced) {
      if (w !== W || h !== H || bias.length === 0) build(w, h)
      coolBase(ctx, w, h, progress)

      const tt = reduced ? 0 : t
      const r = cell / 2
      // a diagonal wave sweeps; tiles ahead of the front are one orientation,
      // behind it the other → contours flow across the field.
      const wave = tt * 0.6 + progress * 4

      ctx.lineWidth = 1.1
      ctx.lineCap = 'round'

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const x = gx * cell
          const y = gy * cell
          const b = bias[gy * cols + gx]!
          // orientation flips with a diagonal sine + per-tile bias
          const s = Math.sin((gx + gy) * 0.55 - wave + b * 0.4)
          const flipped = s > 0

          // how close this tile is to the wave crest → amber highlight
          const crest = Math.max(0, Math.abs(s) < 0.18 ? 1 - Math.abs(s) / 0.18 : 0)
          const lit = !reduced && crest > 0
          const col = lit ? AMBER : STEEL
          const alpha = lit ? 0.35 + crest * 0.5 : 0.22
          ctx.strokeStyle = `rgba(${col}, ${alpha})`

          // Two quarter-circle arcs. Orientation A: arcs centered at TL & BR
          // corners. Orientation B: arcs centered at TR & BL corners.
          ctx.beginPath()
          if (!flipped) {
            ctx.arc(x, y, r, 0, Math.PI / 2)
            ctx.arc(x + cell, y + cell, r, Math.PI, Math.PI * 1.5)
          } else {
            ctx.arc(x + cell, y, r, Math.PI / 2, Math.PI)
            ctx.arc(x, y + cell, r, Math.PI * 1.5, Math.PI * 2)
          }
          ctx.stroke()
        }
      }
      ctx.lineCap = 'butt'
    },
  }
}

/* Merged into the main engine (src/components/bgVariants.ts) — the individual
   make* factories above are imported there directly. */
