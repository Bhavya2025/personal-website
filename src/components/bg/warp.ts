/**
 * WARP — hyperspace starfield seen from a ship.
 *
 * Stars stream OUT from a central vanishing point as elongating streaks: the
 * farther a star has travelled from the centre, the faster it moves and the
 * longer/brighter its streak (perspective foreshortening of a point rushing
 * past the camera). At rest it's a gentle drift of short comet-tails; push the
 * warp and the streaks stretch into light-speed lines toward the screen edges.
 *
 * MATH / IDEA
 *  - Each star lives in screen-radial coordinates: a fixed angle `ang` and a
 *    radius `r` in [0,1] measured from the vanishing point out to the corner.
 *    Radius advances by  dr = (r + r0) * speed * dt  — i.e. velocity grows with
 *    radius, the exponential rush of a point passing the camera. When r > 1 the
 *    star respawns near the centre with a fresh random angle (seeded depth).
 *  - The drawn streak runs from the star's CURRENT screen position back toward
 *    the centre by an amount proportional to (its per-frame travel × warp), so
 *    fast/outer stars draw long light-lines and near-centre stars are points.
 *  - `warp` is a smoothed scalar (idle≈0.18 → light-speed≈1). It eases toward a
 *    target each frame (critically-ish damped) so accelerating/“settling” reads
 *    as inertia, never a snap.
 *  - Chromatic identity: each star is tinted amber / bone / cool-steel by a
 *    seeded weight; the very brightest outer streaks also get a faint 1px
 *    amber↔cool fringe (a cheap chromatic-aberration nod) at high warp only.
 *  - A soft central glow sits at the vanishing point; a dark radial vignette
 *    keeps the edges low-contrast so bone/amber TEXT on top stays readable.
 *
 * SCROLL (home only): `progress` 0→1 drives the warp TARGET — scroll down to
 *  jump to light speed (streaks stretch, glow tightens & brightens, a faint
 *  forward-pull blueshift creeps in). At the top / when idle it settles back to
 *  the gentle drift. Projects page holds a steady ambient low warp.
 *
 * MOUSE: the vanishing point eases toward the cursor (steer the ship) while the
 *  pointer is active, then drifts back to centre — every streak re-aims at the
 *  new focus, so the whole field banks toward where you look.
 *
 * REDUCED MOTION: a single calm STATIC frame — a sparse radial starburst of
 *  short amber/bone rays from a centred vanishing point, glow + vignette, no
 *  animation, no per-frame state mutation.
 *
 * Perf: fixed star count (≤ ~240, fewer on small/!home), all state pre-allocated
 *  in resize(); the hot loop allocates nothing and draws plain 1px line strokes
 *  (one batched path per colour band) plus exactly two gradients/frame.
 */

import type { BgPainter, BgPage, BgMouse } from '../bgVariants'
import { mulberry32 } from '../../lib/palette'

// rgb triples for rgba() interpolation (mirror of bgVariants' constants)
const AMBER = '255, 176, 0'
const BONE = '232, 228, 216'
const COOL = '120, 170, 255'

// star colour bands — index 0 amber, 1 bone, 2 cool. We batch one stroke path
// per band so the whole field is ~3 fill colours, not N.
const BANDS = [AMBER, BONE, COOL] as const

interface Star {
  ang: number // direction from the vanishing point
  r: number // radius 0..1 (0 = at vanishing point, 1 = past the corner)
  band: number // 0 amber | 1 bone | 2 cool
  speed: number // per-star speed multiplier (depth variation)
  r0: number // small base so near-centre stars still creep outward
}

export function makeWarp(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const seed = page === 'home' ? 23 : 91
  let rand = mulberry32(seed)

  let stars: Star[] = []
  let W = 0
  let H = 0
  let DIAG = 1 // half-diagonal: the radius unit (centre → corner) in px

  // smoothed, frame-persistent warp factor and steered vanishing point (0..1)
  let warp = 0.18
  let vpx = 0.5
  let vpy = 0.5

  const newStar = (rExisting: boolean): Star => {
    const band = rand() < 0.62 ? 1 : rand() < 0.62 ? 0 : 2 // mostly bone, then amber, few cool
    return {
      ang: rand() * Math.PI * 2,
      // fresh stars seed across the field on first build so it's full immediately;
      // respawns start near the centre (a touch out so they're not all at r=0).
      r: rExisting ? rand() : 0.02 + rand() * 0.06,
      band,
      speed: 0.55 + rand() * 0.9,
      r0: 0.05 + rand() * 0.08,
    }
  }

  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    DIAG = Math.hypot(w, h) * 0.5
    rand = mulberry32(seed) // deterministic field per size
    // density scales with area; capped. Fewer when reduced / on projects.
    const area = w * h
    const target = Math.round(area / 7600)
    const cap = reduced ? 120 : page === 'home' ? 240 : 180
    const count = Math.max(40, Math.min(cap, target))
    stars = Array.from({ length: count }, () => newStar(true))
    // reset smoothed state so a resize doesn't carry a stale focus
    warp = page === 'home' ? 0.18 : 0.24
    vpx = 0.5
    vpy = 0.5
  }

  /* ---- static reduced-motion frame: a calm radial starburst ---- */
  const paintStatic = (w: number, h: number) => {
    paintBackdrop(ctx, w, h)
    const cx = w / 2
    const cy = h * (page === 'home' ? 0.46 : 0.5)
    // draw each star as a short fixed ray pointing outward — no motion.
    for (let b = 0; b < BANDS.length; b++) {
      ctx.strokeStyle = `rgba(${BANDS[b]}, ${b === 1 ? 0.32 : 0.42})`
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const s of stars) {
        if (s.band !== b) continue
        const ux = Math.cos(s.ang)
        const uy = Math.sin(s.ang)
        const rad = s.r * DIAG
        const len = 6 + s.r * 26 // outer rays are longer (depth cue), but static
        const ex = cx + ux * rad
        const ey = cy + uy * rad
        ctx.moveTo(ex - ux * len, ey - uy * len)
        ctx.lineTo(ex, ey)
      }
      ctx.stroke()
    }
    paintGlowAndVignette(ctx, w, h, cx, cy, 0.18, 0)
  }

  return {
    resize(w, h, reduced) {
      build(w, h, reduced)
    },

    paint(
      w: number,
      h: number,
      timeSec: number,
      progress: number,
      reduced: boolean,
      mouse?: BgMouse,
    ) {
      if (w !== W || h !== H || stars.length === 0) build(w, h, reduced)

      if (reduced) {
        paintStatic(w, h)
        return
      }

      // ---- ease the warp factor toward its target (inertia / settle) ----
      // home: scroll accelerates to light speed; projects: steady ambient warp.
      // a subtle idle breath keeps the drift alive at rest.
      const breath = 0.04 * Math.sin(timeSec * 0.5)
      const target =
        page === 'home'
          ? 0.16 + breath + Math.pow(progress, 1.35) * 1.0
          : 0.26 + breath
      warp += (target - warp) * 0.045

      // ---- ease the vanishing point toward the cursor (steer the ship) ----
      const tvx = mouse && mouse.active ? mouse.x / Math.max(1, w) : 0.5
      const tvy = mouse && mouse.active ? mouse.y / Math.max(1, h) : page === 'home' ? 0.46 : 0.5
      // clamp travel so the focus stays in the readable inner zone
      vpx += (clamp(tvx, 0.3, 0.7) - vpx) * 0.05
      vpy += (clamp(tvy, 0.32, 0.66) - vpy) * 0.05
      const cx = vpx * w
      const cy = vpy * h

      paintBackdrop(ctx, w, h)

      const dt = 1 / 60
      // streak length scales with warp; outer (fast) stars stretch the most.
      const streak = (8 + warp * 150) // px factor at full radius
      // brightness lifts with warp (light-speed glare) but stays text-safe.
      const baseAlpha = 0.22 + warp * 0.5
      // chromatic fringe only kicks in near light speed
      const fringe = warp > 0.62 ? (warp - 0.62) / 0.38 : 0

      ctx.lineCap = 'round'

      // Advance + draw, batched one stroke path per colour band so we only flip
      // strokeStyle three times. Integration happens once per star, on the first
      // band pass (b===0); passes 1,2 only draw their own band. No allocation.
      for (let b = 0; b < BANDS.length; b++) {
        ctx.strokeStyle = `rgba(${BANDS[b]}, ${(b === 2 ? 0.85 : 1) * baseAlpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i]!
          if (b === 0) {
            // integrate: velocity grows with radius (camera rush)
            s.r += (s.r + s.r0) * s.speed * warp * 1.9 * dt + 0.0016 * dt * 60
            if (s.r > 1.18) {
              // respawn near centre with a new heading (depth recycle)
              s.ang = rand() * Math.PI * 2
              s.r = 0.02 + rand() * 0.05
              s.speed = 0.55 + rand() * 0.9
              s.band = rand() < 0.62 ? 1 : rand() < 0.62 ? 0 : 2
              s.r0 = 0.05 + rand() * 0.08
            }
          }
          if (s.band !== b) continue
          const ux = Math.cos(s.ang)
          const uy = Math.sin(s.ang)
          const rad = s.r * DIAG
          const ex = cx + ux * rad
          const ey = cy + uy * rad
          // streak length: grows with radius (perspective) and warp; clamp so a
          // streak never reaches back past the centre.
          const len = Math.min(rad, streak * (0.12 + s.r * s.r))
          const sx = ex - ux * len
          const sy = ey - uy * len
          ctx.moveTo(sx, sy)
          ctx.lineTo(ex, ey)
        }
        ctx.stroke()
      }

      // bright leading dot on the fastest (outer) stars for a glinting head
      ctx.fillStyle = `rgba(${BONE}, ${Math.min(0.9, baseAlpha + 0.15)})`
      ctx.beginPath()
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]!
        if (s.r < 0.5) continue
        const rad = s.r * DIAG
        const ex = cx + Math.cos(s.ang) * rad
        const ey = cy + Math.sin(s.ang) * rad
        const dr = 0.5 + s.r * (0.7 + warp * 0.9)
        ctx.moveTo(ex + dr, ey)
        ctx.arc(ex, ey, dr, 0, Math.PI * 2)
      }
      ctx.fill()

      // faint chromatic fringe on outer streaks near light speed (amber/cool)
      if (fringe > 0.01) {
        ctx.lineWidth = 1
        for (let pass = 0; pass < 2; pass++) {
          const col = pass === 0 ? AMBER : COOL
          const off = (pass === 0 ? 1 : -1) * (0.6 + fringe * 1.2)
          ctx.strokeStyle = `rgba(${col}, ${0.18 * fringe})`
          ctx.beginPath()
          for (let i = 0; i < stars.length; i++) {
            const s = stars[i]!
            if (s.r < 0.66) continue
            const ux = Math.cos(s.ang)
            const uy = Math.sin(s.ang)
            // perpendicular offset for the colour split
            const px = -uy * off
            const py = ux * off
            const rad = s.r * DIAG
            const ex = cx + ux * rad
            const ey = cy + uy * rad
            const len = Math.min(rad, streak * (0.12 + s.r * s.r))
            ctx.moveTo(ex - ux * len + px, ey - uy * len + py)
            ctx.lineTo(ex + px, ey + py)
          }
          ctx.stroke()
        }
      }

      ctx.lineCap = 'butt'

      // central glow tightens + brightens with warp; vignette keeps edges dark
      paintGlowAndVignette(ctx, w, h, cx, cy, 0.16 + warp * 0.22, warp)
    },
  }
}

/* ---------------------------- shared helpers ---------------------------- */

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v
}

/** Near-black base with a faint vertical deepening — one gradient. */
function paintBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, 'rgb(5, 5, 9)')
  g.addColorStop(1, 'rgb(8, 7, 5)') // a hair warmer toward the bottom (amber cast)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

/** Central vanishing-point glow + dark edge vignette (one gradient each). */
function paintGlowAndVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  glowStrength: number,
  warp: number,
) {
  const minDim = Math.min(w, h)
  // glow: tightens (smaller radius, hotter core) as warp rises
  const gr = minDim * (0.34 - warp * 0.12)
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(8, gr))
  glow.addColorStop(0, `rgba(${AMBER}, ${Math.min(0.34, glowStrength)})`)
  glow.addColorStop(0.5, `rgba(${AMBER}, ${Math.min(0.12, glowStrength * 0.4)})`)
  glow.addColorStop(1, `rgba(${AMBER}, 0)`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  const vg = ctx.createRadialGradient(
    cx,
    cy,
    minDim * 0.32,
    cx,
    cy,
    Math.max(w, h) * 0.78,
  )
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vg.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}
