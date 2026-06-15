/**
 * TEMPORARY (preview) — shared animated-background painters.
 *
 * Each variant is a factory that returns a painter with the SAME interface, so
 * SkyCanvas (home) and TransitSky (projects) can swap between them at runtime
 * with one code path. Painters own their own particle state and a `resize`
 * hook; they never read CSS vars in the loop (colors come from palette.ts).
 *
 * Interface:
 *   makeX(ctx, page) -> {
 *     resize(w, h, reduced)   // called on mount + window resize
 *     paint(w, h, timeSec, progress, reduced)   // called per frame (or per scroll when reduced)
 *   }
 *
 * `page` ('home' | 'projects') lets a variant tailor itself per page (e.g. the
 * home grid reacts to scroll progress; projects stays ambient).
 *
 * Performance: every painter is O(n) in a small particle count, no allocations
 * in the hot loop beyond a couple of gradients, and honours `reduced` by
 * drawing a calm static frame.
 *
 * Delete alongside bgStore.ts / BgSwitcher.tsx once a variant is chosen.
 */

import { mulberry32, sampleSky, PALETTE } from '../lib/palette'
// merged-in painters from the lab copies (same painter interface)
import { makeTessellate, makeGrowth, makeHilbert, makeTruchet } from '../lab1/painters'
import { makeRipple, makeOrbits, makeEpicycles, makePendulum } from '../lab2/lab2Variants'
// four signature agents
import { makeBlackhole } from './bg/blackhole'
import { makePlotter } from './bg/plotter'
import { makeTesseract } from './bg/tesseract'
import { makeWarp } from './bg/warp'

export type BgPage = 'home' | 'projects'

/** Pointer in canvas px (= viewport px). `active` is true only while the cursor
 * is moving (decays ~0.4s after it stops) so interactive fields settle back. */
export interface BgMouse {
  x: number
  y: number
  active: boolean
}

export interface BgPainter {
  resize(w: number, h: number, reduced: boolean): void
  paint(
    w: number,
    h: number,
    timeSec: number,
    progress: number,
    reduced: boolean,
    mouse?: BgMouse,
  ): void
}

// amber #ffb000 / bone #e8e4d8 as rgb triples for rgba() interpolation
const AMBER = '255, 176, 0'
const BONE = '232, 228, 216'
const COOL = '120, 170, 255'

/* ------------------------------------------------------------------ */
/* A — DESCENT (the original sky, refined with occasional shooting stars) */
/* ------------------------------------------------------------------ */

interface Star {
  x: number
  y: number
  r: number
  tw: number
}

interface Shooter {
  x: number
  y: number
  vx: number
  vy: number
  life: number // 0..1, counts down
  len: number
}

export function makeDescent(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 7 : 99)
  const stars: Star[] = Array.from({ length: 150 }, () => ({
    x: rand(),
    y: rand(),
    r: 0.3 + rand() * 0.8,
    tw: rand() * Math.PI * 2,
  }))
  const shooters: Shooter[] = []
  let lastSpawn = 0

  // projects page has no scroll-driven sky → use a fixed deep-space frame
  const projectsSky = { top: 'rgb(2,2,6)', mid: 'rgb(4,5,12)', bottom: 'rgb(8,10,22)' }

  return {
    resize() {},
    paint(w, h, timeSec, progress, reduced) {
      const p = page === 'home' ? progress : 0
      const sky = page === 'home' ? sampleSky(progress) : projectsSky
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, sky.top)
      grad.addColorStop(0.55, sky.mid)
      grad.addColorStop(1, sky.bottom)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      const starAlpha = page === 'home' ? Math.max(0, 1 - p * 1.8) : 0.85
      if (starAlpha > 0.01) {
        for (const s of stars) {
          const twinkle = reduced ? 1 : 0.7 + 0.3 * Math.sin(timeSec * 1.5 + s.tw)
          ctx.globalAlpha = starAlpha * twinkle * 0.75
          ctx.fillStyle = s.r > 0.95 ? PALETTE.amber : PALETTE.bone
          const sy = (s.y - p * 0.35 + 1) % 1
          ctx.beginPath()
          ctx.arc(s.x * w, sy * h, s.r, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // occasional shooting stars (skip when reduced or when stars faded out)
      if (!reduced && starAlpha > 0.2) {
        if (timeSec - lastSpawn > 2.6 && Math.random() < 0.018) {
          lastSpawn = timeSec
          const speed = 360 + Math.random() * 280
          const ang = Math.PI * (0.12 + Math.random() * 0.16) // shallow down-right
          shooters.push({
            x: Math.random() * w * 0.7,
            y: Math.random() * h * 0.4,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            life: 1,
            len: 90 + Math.random() * 80,
          })
        }
        const dt = 1 / 60
        for (let i = shooters.length - 1; i >= 0; i--) {
          const sh = shooters[i]!
          sh.x += sh.vx * dt
          sh.y += sh.vy * dt
          sh.life -= dt * 0.85
          if (sh.life <= 0 || sh.x > w + 120 || sh.y > h + 120) {
            shooters.splice(i, 1)
            continue
          }
          const nx = sh.vx
          const ny = sh.vy
          const mag = Math.hypot(nx, ny) || 1
          const tx = sh.x - (nx / mag) * sh.len
          const ty = sh.y - (ny / mag) * sh.len
          const tail = ctx.createLinearGradient(sh.x, sh.y, tx, ty)
          tail.addColorStop(0, `rgba(${BONE}, ${0.9 * sh.life})`)
          tail.addColorStop(1, `rgba(${AMBER}, 0)`)
          ctx.strokeStyle = tail
          ctx.lineWidth = 1.6
          ctx.beginPath()
          ctx.moveTo(sh.x, sh.y)
          ctx.lineTo(tx, ty)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* B — GRID (perspective grid receding to a horizon, parallax drift)  */
/* ------------------------------------------------------------------ */

export function makeGrid(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  // faint background stars above the horizon for depth
  const rand = mulberry32(21)
  const stars = Array.from({ length: 70 }, () => ({
    x: rand(),
    y: rand() * 0.55,
    r: 0.3 + rand() * 0.7,
    tw: rand() * Math.PI * 2,
  }))

  return {
    resize() {},
    paint(w, h, timeSec, progress, reduced) {
      // horizon sits a touch lower on home as you descend; fixed on projects
      const hz = page === 'home' ? h * (0.42 + progress * 0.14) : h * 0.46

      // sky above the horizon: deep ink → faint amber band at the horizon line
      const sky = ctx.createLinearGradient(0, 0, 0, hz)
      sky.addColorStop(0, 'rgb(3, 4, 8)')
      sky.addColorStop(1, 'rgb(10, 9, 14)')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, hz)

      // ground: ink darkening toward the bottom
      const ground = ctx.createLinearGradient(0, hz, 0, h)
      ground.addColorStop(0, 'rgb(10, 9, 12)')
      ground.addColorStop(1, 'rgb(4, 4, 7)')
      ctx.fillStyle = ground
      ctx.fillRect(0, hz, w, h - hz)

      // amber horizon glow
      const glow = ctx.createLinearGradient(0, hz - h * 0.14, 0, hz + h * 0.06)
      glow.addColorStop(0, `rgba(${AMBER}, 0)`)
      glow.addColorStop(0.78, `rgba(${AMBER}, 0.1)`)
      glow.addColorStop(1, `rgba(${AMBER}, 0)`)
      ctx.fillStyle = glow
      ctx.fillRect(0, hz - h * 0.14, w, h * 0.2)

      // background stars (twinkle) above the horizon
      for (const s of stars) {
        const sy = s.y * hz
        const tw = reduced ? 0.6 : 0.45 + 0.4 * Math.sin(timeSec * 1.2 + s.tw)
        ctx.globalAlpha = tw * 0.6
        ctx.fillStyle = PALETTE.bone
        ctx.beginPath()
        ctx.arc(s.x * w, sy, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const cx = w / 2
      // scroll nudges the vanishing point on home for subtle life
      const vpx = page === 'home' ? cx + (progress - 0.5) * w * 0.12 : cx

      ctx.lineWidth = 1
      ctx.strokeStyle = `rgba(${AMBER}, 0.22)`

      // --- horizontal lines marching toward the horizon (perspective rows) ---
      // rows are placed by a perspective curve; a scrolling phase makes them
      // drift toward the viewer so the grid feels like it's moving forward.
      const speed = reduced ? 0 : 0.06
      const phase = (timeSec * speed + (page === 'home' ? progress * 0.5 : 0)) % 1
      const ROWS = 16
      // stroke each row on its own so the per-row depth alpha actually applies
      // (one shared beginPath + a single stroke would paint every row at the
      // last globalAlpha value — i.e. no depth fade at all).
      for (let i = 0; i < ROWS; i++) {
        const t = (i + phase) / ROWS // 0 (far) .. 1 (near)
        const ease = t * t // perspective: rows bunch up near horizon
        const y = hz + ease * (h - hz)
        ctx.globalAlpha = 0.05 + t * 0.22
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // --- vertical lines fanning out from the vanishing point ---
      const COLS = 22
      ctx.beginPath()
      for (let i = -COLS; i <= COLS; i++) {
        const fx = vpx + (i / COLS) * w * 2.4 // spread at the bottom edge
        ctx.moveTo(vpx, hz)
        ctx.lineTo(fx, h)
      }
      ctx.globalAlpha = 0.16
      ctx.stroke()
      ctx.globalAlpha = 1
    },
  }
}

/* ------------------------------------------------------------------ */
/* C — NETWORK (drifting constellation: points + near-neighbour links) */
/* ------------------------------------------------------------------ */

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  amber: boolean
}

export function makeNetwork(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  let nodes: Node[] = []
  let W = 0
  let H = 0
  const LINK_DIST = 150
  let count = 0

  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    const rand = mulberry32(page === 'home' ? 41 : 67)
    // density scales with area; capped for perf. Fewer when reduced.
    const target = Math.round((w * h) / 22000)
    count = reduced ? Math.min(40, target) : Math.min(90, target)
    nodes = Array.from({ length: count }, () => ({
      x: rand() * w,
      y: rand() * h,
      vx: (rand() - 0.5) * (reduced ? 0 : 22),
      vy: (rand() - 0.5) * (reduced ? 0 : 22),
      amber: rand() > 0.85,
    }))
  }

  return {
    resize(w, h, reduced) {
      build(w, h, reduced)
    },
    paint(w, h, _timeSec, progress, reduced) {
      if (w !== W || h !== H) build(w, h, reduced)

      // deep base; home deepens very slightly with descent
      const base = page === 'home' ? 4 + progress * 6 : 4
      ctx.fillStyle = `rgb(${Math.round(base * 0.7)}, ${Math.round(base * 0.8)}, ${Math.round(base + 4)})`
      ctx.fillRect(0, 0, w, h)

      // soft amber corner haze
      const haze = ctx.createRadialGradient(w * 0.85, h * 0.12, 0, w * 0.85, h * 0.12, h * 0.85)
      haze.addColorStop(0, `rgba(${AMBER}, 0.05)`)
      haze.addColorStop(1, `rgba(${AMBER}, 0)`)
      ctx.fillStyle = haze
      ctx.fillRect(0, 0, w, h)

      const dt = 1 / 60
      // integrate + wrap
      if (!reduced) {
        for (const n of nodes) {
          n.x += n.vx * dt
          n.y += n.vy * dt
          if (n.x < -20) n.x = w + 20
          else if (n.x > w + 20) n.x = -20
          if (n.y < -20) n.y = h + 20
          else if (n.y > h + 20) n.y = -20
        }
      }

      // links between near neighbours (O(n^2) but n<=90 → ~4k checks, fine)
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK_DIST * LINK_DIST) {
            const d = Math.sqrt(d2)
            const alpha = (1 - d / LINK_DIST) * 0.28
            ctx.strokeStyle =
              a.amber || b.amber
                ? `rgba(${AMBER}, ${alpha})`
                : `rgba(${BONE}, ${alpha * 0.7})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // nodes
      for (const n of nodes) {
        ctx.fillStyle = n.amber ? `rgba(${AMBER}, 0.9)` : `rgba(${BONE}, 0.75)`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.amber ? 1.8 : 1.3, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* D — AURORA (soft flowing nebula light, layered animated gradients)  */
/* ------------------------------------------------------------------ */

interface Blob {
  baseX: number
  baseY: number
  ax: number // drift amplitude
  ay: number
  sx: number // drift speed
  sy: number
  ph: number // phase
  r: number
  color: string // 'amber' | 'cool' | 'bone'
}

export function makeAurora(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 13 : 53)
  const palette = [AMBER, COOL, COOL, BONE]
  const blobs: Blob[] = Array.from({ length: 6 }, (_, i) => ({
    baseX: 0.15 + rand() * 0.7,
    baseY: 0.15 + rand() * 0.7,
    ax: 0.06 + rand() * 0.1,
    ay: 0.05 + rand() * 0.08,
    sx: 0.05 + rand() * 0.08,
    sy: 0.04 + rand() * 0.07,
    ph: rand() * Math.PI * 2,
    r: 0.34 + rand() * 0.22,
    color: palette[i % palette.length]!,
  }))

  return {
    resize() {},
    paint(w, h, timeSec, progress, reduced) {
      // very dark ink base, faint vertical shift on home
      const topB = page === 'home' ? 4 + progress * 4 : 4
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, `rgb(${Math.round(topB)}, ${Math.round(topB + 1)}, ${Math.round(topB + 6)})`)
      g.addColorStop(1, 'rgb(3, 3, 7)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // additive blend so overlapping nebula light glows rather than muddies
      ctx.globalCompositeOperation = 'lighter'
      const t = reduced ? 0 : timeSec
      const minDim = Math.min(w, h)
      for (const b of blobs) {
        const x = (b.baseX + (reduced ? 0 : Math.sin(t * b.sx + b.ph) * b.ax)) * w
        const y = (b.baseY + (reduced ? 0 : Math.cos(t * b.sy + b.ph) * b.ay)) * h
        const rad = b.r * minDim
        const breathe = reduced ? 0.16 : 0.13 + 0.05 * Math.sin(t * 0.4 + b.ph)
        const rg = ctx.createRadialGradient(x, y, 0, x, y, rad)
        rg.addColorStop(0, `rgba(${b.color}, ${breathe})`)
        rg.addColorStop(0.5, `rgba(${b.color}, ${breathe * 0.4})`)
        rg.addColorStop(1, `rgba(${b.color}, 0)`)
        ctx.fillStyle = rg
        ctx.fillRect(0, 0, w, h)
      }
      ctx.globalCompositeOperation = 'source-over'

      // a faint dark vignette to keep edges low-contrast for text
      const vg = ctx.createRadialGradient(
        w / 2,
        h / 2,
        minDim * 0.3,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.75,
      )
      vg.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vg.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)
    },
  }
}

/* ------------------------------------------------------------------ */
/* E — FLOW (a vector field traced by drifting particles)             */
/* ------------------------------------------------------------------ */

interface FlowP {
  x: number
  y: number
}

export function makeFlow(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 5 : 71)
  let parts: FlowP[] = []
  let W = 0
  let H = 0

  // smooth flow field: angle from layered sines (a calm divergence-free-ish curl)
  const field = (x: number, y: number, t: number) =>
    (Math.sin(x * 0.0016 + t * 0.05) +
      Math.cos(y * 0.0019 - t * 0.045) +
      Math.sin((x + y) * 0.0011 + t * 0.03)) *
    1.7

  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    const n = reduced ? 0 : Math.min(240, Math.round((w * h) / 7000))
    parts = Array.from({ length: n }, () => ({ x: rand() * w, y: rand() * h }))
  }

  return {
    resize(w, h, reduced) {
      build(w, h, reduced)
    },
    paint(w, h, t, progress, reduced) {
      if (w !== W || h !== H) build(w, h, reduced)

      if (reduced) {
        // static field: a grid of short ticks oriented by the field
        ctx.fillStyle = 'rgb(5, 5, 9)'
        ctx.fillRect(0, 0, w, h)
        ctx.strokeStyle = `rgba(${AMBER}, 0.22)`
        ctx.lineWidth = 1
        ctx.beginPath()
        const step = 46
        for (let gx = step / 2; gx < w; gx += step) {
          for (let gy = step / 2; gy < h; gy += step) {
            const a = field(gx, gy, 0)
            const dx = Math.cos(a) * 12
            const dy = Math.sin(a) * 12
            ctx.moveTo(gx - dx, gy - dy)
            ctx.lineTo(gx + dx, gy + dy)
          }
        }
        ctx.stroke()
        return
      }

      // fade the previous frame slightly → particles leave flowing trails
      ctx.fillStyle = 'rgba(5, 5, 9, 0.10)'
      ctx.fillRect(0, 0, w, h)

      const tt = t + (page === 'home' ? progress * 4 : 0)
      const v = 1.35
      ctx.lineWidth = 1.2
      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i]!
        const a = field(pt.x, pt.y, tt)
        const nx = pt.x + Math.cos(a) * v
        const ny = pt.y + Math.sin(a) * v
        ctx.strokeStyle =
          i % 6 === 0 ? `rgba(${AMBER}, 0.5)` : `rgba(${BONE}, 0.16)`
        ctx.beginPath()
        ctx.moveTo(pt.x, pt.y)
        ctx.lineTo(nx, ny)
        ctx.stroke()
        pt.x = nx
        pt.y = ny
        // respawn off-edge or occasionally, to keep the field evenly seeded
        if (pt.x < 0 || pt.x > w || pt.y < 0 || pt.y > h || rand() < 0.004) {
          pt.x = rand() * w
          pt.y = rand() * h
        }
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* F — MATRIX (a quiet grid of bits, lit by a passing diagonal wave)  */
/* ------------------------------------------------------------------ */

export function makeMatrix(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 9 : 81)
  let off: HTMLCanvasElement | null = null
  let chars: string[] = []
  let cell = 20
  let cols = 0
  let rows = 0
  let W = 0
  let H = 0

  const build = (w: number, h: number) => {
    W = w
    H = h
    cell = Math.max(16, Math.round(Math.min(w, h) / 34))
    cols = Math.ceil(w / cell) + 1
    rows = Math.ceil(h / cell) + 1
    chars = new Array(cols * rows)
    off = document.createElement('canvas')
    off.width = Math.max(1, w)
    off.height = Math.max(1, h)
    const o = off.getContext('2d')!
    o.font = `${Math.round(cell * 0.72)}px ui-monospace, "SF Mono", monospace`
    o.textBaseline = 'top'
    o.fillStyle = `rgba(${BONE}, 0.05)`
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch =
          rand() < 0.8 ? (rand() < 0.5 ? '0' : '1') : '0123456789'[(rand() * 10) | 0]!
        chars[r * cols + c] = ch
        o.fillText(ch, c * cell, r * cell)
      }
    }
  }

  return {
    resize(w, h) {
      build(w, h)
    },
    paint(w, h, t, progress, reduced) {
      if (w !== W || h !== H || !off) build(w, h)
      ctx.fillStyle = 'rgb(4, 4, 7)'
      ctx.fillRect(0, 0, w, h)
      if (off) ctx.drawImage(off, 0, 0)

      ctx.font = `${Math.round(cell * 0.72)}px ui-monospace, "SF Mono", monospace`
      ctx.textBaseline = 'top'
      const tt = reduced ? 0 : t
      const offset = page === 'home' ? progress * 3 : 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // a moving diagonal sine — only cells near its crest light up amber
          const s = Math.sin(c * 0.5 + r * 0.35 - tt * 0.9 - offset)
          if (s > 0.86) {
            const a = (s - 0.86) / 0.14
            ctx.fillStyle = `rgba(${AMBER}, ${0.12 + a * 0.6})`
            ctx.fillText(chars[r * cols + c] ?? '0', c * cell, r * cell)
          }
        }
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* G — LIFE (Conway's Game of Life, slow generations, soft fades)     */
/* ------------------------------------------------------------------ */

export function makeAutomata(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 17 : 43)
  let cols = 0
  let rows = 0
  let cell = 18
  let W = 0
  let H = 0
  let cur = new Uint8Array(0)
  let alpha = new Float32Array(0)
  let lastStep = 0

  const seed = () => {
    for (let i = 0; i < cur.length; i++) cur[i] = rand() < 0.16 ? 1 : 0
  }
  const build = (w: number, h: number) => {
    W = w
    H = h
    cell = Math.max(14, Math.round(Math.min(w, h) / 40))
    cols = Math.ceil(w / cell)
    rows = Math.ceil(h / cell)
    cur = new Uint8Array(cols * rows)
    alpha = new Float32Array(cols * rows)
    seed()
  }
  const step = () => {
    const next = new Uint8Array(cols * rows)
    let live = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let n = 0
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue
            const rr = (r + dr + rows) % rows
            const cc = (c + dc + cols) % cols
            n += cur[rr * cols + cc]!
          }
        }
        const alive = cur[r * cols + c]!
        const nv = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0
        next[r * cols + c] = nv
        live += nv
      }
    }
    cur = next
    if (live < cols * rows * 0.04) seed() // re-seed if the colony dies out
  }

  return {
    resize(w, h) {
      build(w, h)
    },
    paint(w, h, t, _progress, reduced) {
      if (w !== W || h !== H || cur.length === 0) build(w, h)
      ctx.fillStyle = 'rgb(4, 4, 6)'
      ctx.fillRect(0, 0, w, h)

      if (!reduced && t - lastStep > 0.42) {
        lastStep = t
        step()
      }
      const ease = reduced ? 1 : 0.12
      for (let i = 0; i < cur.length; i++) {
        const target = cur[i] ? 1 : 0
        const a = (alpha[i] ?? 0) + (target - (alpha[i] ?? 0)) * ease
        alpha[i] = a
        if (a < 0.03) continue
        const c = i % cols
        const r = (i / cols) | 0
        ctx.globalAlpha = a * 0.42
        ctx.fillStyle = PALETTE.amber
        ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2)
      }
      ctx.globalAlpha = 1
    },
  }
}

/* ------------------------------------------------------------------ */
/* H — HARMONICS (morphing Lissajous / parametric curves, amber+cool) */
/* ------------------------------------------------------------------ */

export function makeHarmonics(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 29 : 61)
  const curves = Array.from({ length: 4 }, (_, i) => ({
    a: 2 + (i % 3),
    b: 3 + ((i + 1) % 4),
    da: 0.02 + rand() * 0.05,
    db: 0.02 + rand() * 0.05,
    phase: rand() * Math.PI * 2,
    color: i % 2 === 0 ? AMBER : COOL,
    rx: 0.3 + rand() * 0.1,
    ry: 0.24 + rand() * 0.1,
  }))

  return {
    resize() {},
    paint(w, h, t, progress, reduced) {
      ctx.fillStyle = 'rgb(4, 4, 8)'
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2
      const cy = h * (page === 'home' ? 0.42 + progress * 0.1 : 0.5)
      const minD = Math.min(w, h)
      const tt = reduced ? 0 : t
      const M = 240

      ctx.globalCompositeOperation = 'lighter'
      ctx.lineWidth = 1.2
      for (const cv of curves) {
        const Rx = cv.rx * minD
        const Ry = cv.ry * minD
        const ph = cv.phase + tt * 0.25
        // drift the frequency ratio slightly so the figure keeps morphing
        const a = cv.a + Math.sin(tt * cv.da) * 0.5
        const b = cv.b + Math.cos(tt * cv.db) * 0.5
        ctx.strokeStyle = `rgba(${cv.color}, 0.22)`
        ctx.beginPath()
        for (let k = 0; k <= M; k++) {
          const u = (k / M) * Math.PI * 2
          const x = cx + Rx * Math.sin(a * u + ph)
          const y = cy + Ry * Math.sin(b * u)
          if (k === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}

/* ------------------------------------------------------------------ */
/* I — GRADIENT DESCENT (a dense vector field; the cursor repels it)   */
/* ------------------------------------------------------------------ */

export function makeGradient(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 6 : 72)
  let parts: FlowP[] = []
  let W = 0
  let H = 0
  const field = (x: number, y: number, t: number) =>
    (Math.sin(x * 0.0015 + t * 0.04) +
      Math.cos(y * 0.0018 - t * 0.04) +
      Math.sin((x - y) * 0.001 + t * 0.025)) *
    1.7
  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    const n = reduced ? 0 : Math.min(460, Math.round((w * h) / 4200))
    parts = Array.from({ length: n }, () => ({ x: rand() * w, y: rand() * h }))
  }
  return {
    resize(w, h, reduced) {
      build(w, h, reduced)
    },
    paint(w, h, t, progress, reduced, mouse) {
      if (w !== W || h !== H) build(w, h, reduced)
      if (reduced) {
        ctx.fillStyle = 'rgb(5, 5, 9)'
        ctx.fillRect(0, 0, w, h)
        ctx.strokeStyle = `rgba(${AMBER}, 0.2)`
        ctx.lineWidth = 1
        ctx.beginPath()
        const step = 46
        for (let gx = step / 2; gx < w; gx += step) {
          for (let gy = step / 2; gy < h; gy += step) {
            const a = field(gx, gy, 0)
            ctx.moveTo(gx - Math.cos(a) * 12, gy - Math.sin(a) * 12)
            ctx.lineTo(gx + Math.cos(a) * 12, gy + Math.sin(a) * 12)
          }
        }
        ctx.stroke()
        return
      }
      ctx.fillStyle = 'rgba(5, 5, 9, 0.12)' // trail fade
      ctx.fillRect(0, 0, w, h)
      const tt = t + (page === 'home' ? progress * 4 : 0)
      const R = 160
      ctx.lineWidth = 1
      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i]!
        const a = field(pt.x, pt.y, tt)
        let vx = Math.cos(a)
        let vy = Math.sin(a)
        // cursor pushes the flow outward, then it settles back into the field
        if (mouse && mouse.active) {
          const dx = pt.x - mouse.x
          const dy = pt.y - mouse.y
          const d = Math.hypot(dx, dy)
          if (d > 0.1 && d < R) {
            const f = (1 - d / R) * 2.6
            vx += (dx / d) * f
            vy += (dy / d) * f
          }
        }
        const m = Math.hypot(vx, vy) || 1
        const nx = pt.x + (vx / m) * 1.3
        const ny = pt.y + (vy / m) * 1.3
        ctx.strokeStyle = i % 9 === 0 ? `rgba(${AMBER}, 0.55)` : `rgba(${BONE}, 0.13)`
        ctx.beginPath()
        ctx.moveTo(pt.x, pt.y)
        ctx.lineTo(nx, ny)
        ctx.stroke()
        pt.x = nx
        pt.y = ny
        if (pt.x < 0 || pt.x > w || pt.y < 0 || pt.y > h || rand() < 0.003) {
          pt.x = rand() * w
          pt.y = rand() * h
        }
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* J — EIGEN-TRANSFORM (a grid sheared by a matrix; eigenvectors hold) */
/* ------------------------------------------------------------------ */

export function makeEigen(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  // two (non-orthogonal) eigen-directions; the transform only scales along them
  const th1 = 0.32 // ~18°
  const th2 = 1.95 // ~112°
  const e1x = Math.cos(th1)
  const e1y = Math.sin(th1)
  const e2x = Math.cos(th2)
  const e2y = Math.sin(th2)
  const det = e1x * e2y - e2x * e1y
  // inverse of the eigenbasis E = [[e1x,e2x],[e1y,e2y]]
  const i00 = e2y / det
  const i01 = -e2x / det
  const i10 = -e1y / det
  const i11 = e1x / det

  return {
    resize() {},
    paint(w, h, t, progress, reduced) {
      ctx.fillStyle = 'rgb(4, 4, 8)'
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      const U = Math.min(w, h) / 11 // px per unit
      // scroll drives the transform on home; projects breathes on its own
      const amt =
        page === 'home' ? (progress - 0.5) * 2 : reduced ? 0.4 : Math.sin(t * 0.3)
      const l1 = 1 + amt * 0.75
      const l2 = 1 - amt * 0.5

      // M = E · diag(l1,l2) · E⁻¹  (apply to a unit-grid point)
      const ed00 = e1x * l1
      const ed01 = e2x * l2
      const ed10 = e1y * l1
      const ed11 = e2y * l2
      const a = ed00 * i00 + ed01 * i10
      const b = ed00 * i01 + ed01 * i11
      const c = ed10 * i00 + ed11 * i10
      const d = ed10 * i01 + ed11 * i11
      const tx = (gx: number, gy: number) => cx + (a * gx + b * gy) * U
      const ty = (gx: number, gy: number) => cy + (c * gx + d * gy) * U

      const N = Math.ceil(Math.max(w, h) / U) + 3
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgba(${BONE}, 0.12)`
      ctx.beginPath()
      for (let i = -N; i <= N; i++) {
        ctx.moveTo(tx(i, -N), ty(i, -N))
        ctx.lineTo(tx(i, N), ty(i, N))
        ctx.moveTo(tx(-N, i), ty(-N, i))
        ctx.lineTo(tx(N, i), ty(N, i))
      }
      ctx.stroke()

      // the two eigenvectors: they only stretch along their own span
      const ray = (ex: number, ey: number, l: number, col: string) => {
        const L = N * l
        ctx.strokeStyle = col
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(cx - ex * L * U, cy - ey * L * U)
        ctx.lineTo(cx + ex * L * U, cy + ey * L * U)
        ctx.stroke()
      }
      ray(e1x, e1y, l1, `rgba(${AMBER}, 0.6)`)
      ray(e2x, e2y, l2, `rgba(${COOL}, 0.5)`)

      // origin marker
      ctx.fillStyle = `rgba(${BONE}, 0.7)`
      ctx.beginPath()
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2)
      ctx.fill()
    },
  }
}

/* ------------------------------------------------------------------ */
/* K — HEAPSORT (a constellation that periodically swaps two nodes)    */
/* ------------------------------------------------------------------ */

interface HNode {
  x: number
  y: number
  vx: number
  vy: number
}

export function makeHeapsort(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 33 : 88)
  let nodes: HNode[] = []
  let W = 0
  let H = 0
  const LINK = 165
  // swap animation state
  let swap: { i: number; j: number; t0: number; ax: number; ay: number; bx: number; by: number } | null = null
  let nextSwap = 0

  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    const target = Math.round((w * h) / 24000)
    const n = reduced ? Math.min(38, target) : Math.min(80, target)
    nodes = Array.from({ length: n }, () => ({
      x: rand() * w,
      y: rand() * h,
      vx: (rand() - 0.5) * (reduced ? 0 : 16),
      vy: (rand() - 0.5) * (reduced ? 0 : 16),
    }))
    swap = null
    nextSwap = 0
  }

  return {
    resize(w, h, reduced) {
      build(w, h, reduced)
    },
    paint(w, h, t, progress, reduced, mouse) {
      if (w !== W || h !== H) build(w, h, reduced)
      const base = page === 'home' ? 4 + progress * 5 : 4
      ctx.fillStyle = `rgb(${Math.round(base * 0.7)}, ${Math.round(base * 0.8)}, ${Math.round(base + 4)})`
      ctx.fillRect(0, 0, w, h)

      const dt = 1 / 60
      if (!reduced) {
        for (const n of nodes) {
          n.x += n.vx * dt
          n.y += n.vy * dt
          if (n.x < -20) n.x = w + 20
          else if (n.x > w + 20) n.x = -20
          if (n.y < -20) n.y = h + 20
          else if (n.y > h + 20) n.y = -20
          // hover repulsion
          if (mouse && mouse.active) {
            const dx = n.x - mouse.x
            const dy = n.y - mouse.y
            const d = Math.hypot(dx, dy)
            if (d > 0.1 && d < 130) {
              const f = (1 - d / 130) * 60 * dt
              n.x += (dx / d) * f
              n.y += (dy / d) * f
            }
          }
        }

        // schedule + run "heapify" swaps: two nodes glide into each other's slot
        if (!swap && t > nextSwap && nodes.length > 3) {
          const i = (rand() * nodes.length) | 0
          let j = (rand() * nodes.length) | 0
          if (j === i) j = (j + 1) % nodes.length
          const A = nodes[i]!
          const B = nodes[j]!
          swap = { i, j, t0: t, ax: A.x, ay: A.y, bx: B.x, by: B.y }
        }
      }

      let glowI = -1
      let glowJ = -1
      if (swap) {
        const k = Math.min(1, (t - swap.t0) / 0.7)
        const e = k * k * (3 - 2 * k) // smoothstep
        const A = nodes[swap.i]!
        const B = nodes[swap.j]!
        A.x = swap.ax + (swap.bx - swap.ax) * e
        A.y = swap.ay + (swap.by - swap.ay) * e
        B.x = swap.bx + (swap.ax - swap.bx) * e
        B.y = swap.by + (swap.ay - swap.by) * e
        glowI = swap.i
        glowJ = swap.j
        if (k >= 1) {
          swap = null
          nextSwap = t + 0.7 + rand() * 1.4
        }
      }

      // links between near neighbours
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK * LINK) {
            const al = (1 - Math.sqrt(d2) / LINK) * 0.26
            ctx.strokeStyle = `rgba(${BONE}, ${al * 0.7})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // nodes (the swapping pair glows amber)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!
        const glow = i === glowI || i === glowJ
        if (glow) {
          ctx.fillStyle = `rgba(${AMBER}, 0.95)`
          ctx.shadowColor = `rgba(${AMBER}, 0.9)`
          ctx.shadowBlur = 12
        } else {
          ctx.fillStyle = `rgba(${BONE}, 0.7)`
        }
        ctx.beginPath()
        ctx.arc(n.x, n.y, glow ? 3 : 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* L — ATTRACTOR (a Lorenz strange attractor; cursor steers the view) */
/* ------------------------------------------------------------------ */

export function makeAttractor(ctx: CanvasRenderingContext2D, _page: BgPage): BgPainter {
  const N = 2600
  const xs = new Float32Array(N)
  const ys = new Float32Array(N)
  const zs = new Float32Array(N)
  let head = 0
  let yaw = 0
  let pitch = -0.35

  // integrate the Lorenz system once into a buffer (shape is precomputed; we
  // just rotate it each frame + run a bright "comet" along it for motion)
  const integrate = () => {
    let x = 0.1
    let y = 0
    let z = 0
    const dt = 0.006
    const sig = 10
    const rho = 28
    const beta = 8 / 3
    let mz = 0
    for (let i = 0; i < N; i++) {
      const dx = sig * (y - x)
      const dy = x * (rho - z) - y
      const dz = x * y - beta * z
      x += dx * dt
      y += dy * dt
      z += dz * dt
      xs[i] = x
      ys[i] = y
      zs[i] = z
      mz += z
    }
    mz /= N
    for (let i = 0; i < N; i++) zs[i] = (zs[i] ?? 0) - mz // centre on Z
  }
  integrate()

  return {
    resize() {},
    paint(w, h, t, _progress, reduced, mouse) {
      ctx.fillStyle = 'rgb(4, 4, 7)'
      ctx.fillRect(0, 0, w, h)

      // camera: slow auto-rotate + ease toward the cursor for parallax
      const tgtYaw = t * 0.12 + (mouse && mouse.active ? (mouse.x / w - 0.5) * 1.2 : 0)
      const tgtPitch = -0.35 + (mouse && mouse.active ? (mouse.y / h - 0.5) * 0.7 : 0)
      yaw += (tgtYaw - yaw) * (reduced ? 1 : 0.05)
      pitch += (tgtPitch - pitch) * (reduced ? 1 : 0.05)
      const cy_ = Math.cos(yaw)
      const sy_ = Math.sin(yaw)
      const cp = Math.cos(pitch)
      const sp = Math.sin(pitch)

      const scale = Math.min(w, h) * 0.016
      const ox = w / 2
      const oy = h / 2

      const px = (i: number): [number, number] => {
        const X = xs[i] ?? 0
        const Y = ys[i] ?? 0
        const Z = zs[i] ?? 0
        // rotate around Y (yaw) then X (pitch), orthographic project
        const x1 = X * cy_ + Z * sy_
        const z1 = -X * sy_ + Z * cy_
        const y2 = Y * cp - z1 * sp
        return [ox + x1 * scale, oy - y2 * scale]
      }

      // the whole trajectory, faint + additive so the knot glows where it folds
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = `rgba(${AMBER}, 0.16)`
      ctx.lineWidth = 1
      ctx.beginPath()
      let prev = px(0)
      ctx.moveTo(prev[0], prev[1])
      for (let i = 1; i < N; i++) {
        const p = px(i)
        // the Lorenz line can jump between lobes — don't connect long hops
        if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) < scale * 6) ctx.lineTo(p[0], p[1])
        else ctx.moveTo(p[0], p[1])
        prev = p
      }
      ctx.stroke()

      // a bright comet tracing the trajectory (the "current state")
      if (!reduced) head = (head + 5) % N
      const TRAIL = 90
      for (let k = 0; k < TRAIL; k++) {
        const i = (head - k + N) % N
        const p = px(i)
        const a = (1 - k / TRAIL) * 0.9
        ctx.fillStyle = `rgba(${k < 14 ? BONE : AMBER}, ${a})`
        ctx.beginPath()
        ctx.arc(p[0], p[1], k < 6 ? 2 : 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}

/* ------------------------------------------------------------------ */

export function makePainter(
  variant: import('./bgStore').BgVariant,
  ctx: CanvasRenderingContext2D,
  page: BgPage,
): BgPainter {
  switch (variant) {
    case 'grid':
      return makeGrid(ctx, page)
    case 'network':
      return makeNetwork(ctx, page)
    case 'aurora':
      return makeAurora(ctx, page)
    case 'flow':
      return makeFlow(ctx, page)
    case 'matrix':
      return makeMatrix(ctx, page)
    case 'life':
      return makeAutomata(ctx, page)
    case 'harmonics':
      return makeHarmonics(ctx, page)
    case 'gradient':
      return makeGradient(ctx, page)
    case 'eigen':
      return makeEigen(ctx, page)
    case 'heapsort':
      return makeHeapsort(ctx, page)
    case 'attractor':
      return makeAttractor(ctx, page)
    // merged from the lab copies (factories take only ctx)
    case 'tessellate':
      return makeTessellate(ctx)
    case 'growth':
      return makeGrowth(ctx)
    case 'hilbert':
      return makeHilbert(ctx)
    case 'truchet':
      return makeTruchet(ctx)
    case 'ripple':
      return makeRipple(ctx)
    case 'orbits':
      return makeOrbits(ctx)
    case 'epicycles':
      return makeEpicycles(ctx)
    case 'pendulum':
      return makePendulum(ctx)
    // four signature agents
    case 'blackhole':
      return makeBlackhole(ctx, page)
    case 'plotter':
      return makePlotter(ctx, page)
    case 'tesseract':
      return makeTesseract(ctx, page)
    case 'warp':
      return makeWarp(ctx, page)
    case 'descent':
    default:
      return makeDescent(ctx, page)
  }
}
