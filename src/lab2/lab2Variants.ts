/**
 * TEMPORARY (preview) — Lab 2 animated-background painters.
 *
 * Theme: CONTINUOUS / PHYSICAL / SIGNALS. Each painter models a real physical
 * or analytical system and renders it warm (amber/ember/bone) and atmospheric.
 * Same painter interface as the production bgVariants so a single canvas driver
 * (useLab2Canvas) can swap them live:
 *
 *   makeX(ctx) -> {
 *     resize(w, h, reduced)                       // mount + window resize
 *     paint(w, h, timeSec, progress, reduced)     // per frame (or per scroll when reduced)
 *     pointer(x, y, inside)                        // optional — latest cursor (CSS px)
 *   }
 *
 * Performance contract: O(n) in a small element count, DPR handled by the
 * driver (ctx is pre-scaled, all maths in CSS px), no per-frame allocation in
 * hot loops beyond a couple of gradients, and every painter honours `reduced`
 * with a calm static frame. Colours are constants (never read CSS vars in-loop).
 */

import { mulberry32 } from '../lib/palette'

/** Pointer in CSS px; `active` is only true while the cursor is moving. Mirrors
 * BgMouse from the engine without importing it (these files stay standalone). */
export interface Lab2Mouse {
  x: number
  y: number
  active: boolean
}

export interface Lab2Painter {
  resize(w: number, h: number, reduced: boolean): void
  paint(
    w: number,
    h: number,
    timeSec: number,
    progress: number,
    reduced: boolean,
    mouse?: Lab2Mouse,
  ): void
  pointer?(x: number, y: number, inside: boolean): void
}

// rgb triples for rgba() interpolation
const AMBER = '255, 176, 0'
const EMBER = '199, 95, 0' // amberDeep-ish, warmer/redder ember
const BONE = '232, 228, 216'

/** A near-black warm base wash with a faint ember floor glow + soft vignette. */
function warmBase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
  floor = 0.05,
): void {
  // deep warm-black; the descent very slightly lifts the top toward ember
  const top = 6 + progress * 4
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, `rgb(${Math.round(top)}, ${Math.round(top * 0.8)}, ${Math.round(top * 0.6)})`)
  g.addColorStop(1, 'rgb(8, 5, 3)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // ember floor glow rising from the bottom — atmospheric warmth
  if (floor > 0) {
    const fl = ctx.createLinearGradient(0, h, 0, h * 0.45)
    fl.addColorStop(0, `rgba(${EMBER}, ${floor})`)
    fl.addColorStop(1, `rgba(${EMBER}, 0)`)
    ctx.fillStyle = fl
    ctx.fillRect(0, h * 0.45, w, h * 0.55)
  }
}

/** Dark radial vignette so edges stay low-contrast under bone/amber text. */
function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.5): void {
  const minDim = Math.min(w, h)
  const vg = ctx.createRadialGradient(
    w / 2,
    h * 0.42,
    minDim * 0.28,
    w / 2,
    h * 0.42,
    Math.max(w, h) * 0.8,
  )
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vg.addColorStop(1, `rgba(0, 0, 0, ${strength})`)
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

/* ================================================================== */
/* A — RIPPLE  (wave interference / ripple tank from N drifting sources) */
/* ================================================================== */
/*
 * The physics: each point source emits a circular wave. At any pixel the
 * displacement is the SUPERPOSITION of all sources,
 *     u(p,t) = Σ_i  A_i · sin(k·|p - s_i| − ω·t + φ_i) · atten(|p - s_i|)
 * Where crests meet crests you get constructive interference (bright), where a
 * crest meets a trough they cancel (dark). We render the wave field on a coarse
 * lattice (cheap), then draw it as a smooth amber height-shaded mesh so it reads
 * as a luminous ripple tank rather than literal contour lines. Sources drift on
 * slow Lissajous paths; the cursor becomes a live source you can stir the tank with.
 */

interface Source {
  bx: number // base position (fraction of w/h)
  by: number
  ax: number // drift amplitude (fraction)
  ay: number
  sx: number // drift speed
  sy: number
  ph: number // temporal phase of the wave
  k: number // wavenumber
  w: number // angular frequency
}

export function makeRipple(ctx: CanvasRenderingContext2D): Lab2Painter {
  const rand = mulberry32(311)
  const SRC_N = 4
  const sources: Source[] = Array.from({ length: SRC_N }, () => ({
    bx: 0.2 + rand() * 0.6,
    by: 0.2 + rand() * 0.6,
    ax: 0.05 + rand() * 0.08,
    ay: 0.04 + rand() * 0.07,
    sx: 0.12 + rand() * 0.14,
    sy: 0.1 + rand() * 0.13,
    ph: rand() * Math.PI * 2,
    k: 0.018 + rand() * 0.01, // ~ wavelength 280–450px
    w: 1.6 + rand() * 0.9,
  }))

  let W = 0
  let H = 0
  let cell = 14 // lattice spacing in CSS px
  let gw = 0
  let gh = 0
  let buf = new Float32Array(0)
  const px = new Float32Array(SRC_N + 1)
  const py = new Float32Array(SRC_N + 1)
  let ptr = { x: 0, y: 0, on: false }

  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    // coarser lattice on big screens / when reduced — keeps it cheap & smooth
    cell = reduced ? 26 : Math.max(12, Math.round(Math.min(w, h) / 46))
    gw = Math.ceil(w / cell) + 2
    gh = Math.ceil(h / cell) + 2
    buf = new Float32Array(gw * gh)
  }

  const sample = (x: number, y: number, t: number, nSrc: number): number => {
    let u = 0
    for (let i = 0; i < nSrc; i++) {
      const dx = x - px[i]!
      const dy = y - py[i]!
      const r = Math.sqrt(dx * dx + dy * dy)
      const s = sources[i] ?? sources[0]!
      // 1/sqrt(r) energy spread + a soft far-field cutoff so distant sources fade
      const atten = 1 / (1 + r * 0.0042) / Math.sqrt(1 + r * 0.02)
      u += Math.sin(s.k * r - s.w * t + s.ph) * atten
    }
    // cursor source (last slot) — a sharper, brighter ripple
    if (ptr.on) {
      const dx = x - px[nSrc]!
      const dy = y - py[nSrc]!
      const r = Math.sqrt(dx * dx + dy * dy)
      const atten = 1.4 / (1 + r * 0.006)
      u += Math.sin(0.03 * r - 4.2 * t) * atten
    }
    return u
  }

  return {
    resize(w, h, reduced) {
      build(w, h, reduced)
    },
    pointer(x, y, inside) {
      ptr = { x, y, on: inside }
    },
    paint(w, h, timeSec, progress, reduced, mouse) {
      if (w !== W || h !== H) build(w, h, reduced)
      // engine drives the cursor via paint()'s mouse arg (pointer() is never
      // called); make the cursor a live wave source while it's moving.
      if (mouse) ptr = { x: mouse.x, y: mouse.y, on: mouse.active && !reduced }
      warmBase(ctx, w, h, progress, 0.06)

      const t = reduced ? 0.6 : timeSec
      // advance source positions (CSS px)
      for (let i = 0; i < SRC_N; i++) {
        const s = sources[i]!
        px[i] = (s.bx + (reduced ? 0 : Math.sin(t * s.sx + s.ph) * s.ax)) * w
        py[i] = (s.by + (reduced ? 0 : Math.cos(t * s.sy + s.ph) * s.ay)) * h
      }
      px[SRC_N] = ptr.x
      py[SRC_N] = ptr.y
      const nSrc = SRC_N

      // fill the lattice with the wave field
      for (let gy = 0; gy < gh; gy++) {
        const y = gy * cell
        for (let gx = 0; gx < gw; gx++) {
          buf[gy * gw + gx] = sample(gx * cell, y, t, nSrc)
        }
      }

      // Render as glowing dots whose size/alpha track the wave height — crests
      // bloom amber, troughs fall to ember. Additive so overlaps glow.
      ctx.globalCompositeOperation = 'lighter'
      for (let gy = 0; gy < gh; gy++) {
        const y = gy * cell
        for (let gx = 0; gx < gw; gx++) {
          const u = buf[gy * gw + gx]!
          // normalise into 0..1 — crest brightness
          const m = (u + 2) / 4
          if (m <= 0.04) continue
          const x = gx * cell
          // crest (m>0.5) → amber bloom; trough → faint ember speck
          const crest = u > 0
          const a = crest ? (m - 0.5) * 0.85 : (0.5 - m) * 0.32
          if (a <= 0.012) continue
          const rad = crest ? cell * (0.45 + (m - 0.5) * 1.4) : cell * 0.4
          const col = crest ? AMBER : EMBER
          const rg = ctx.createRadialGradient(x, y, 0, x, y, rad)
          rg.addColorStop(0, `rgba(${col}, ${a})`)
          rg.addColorStop(1, `rgba(${col}, 0)`)
          ctx.fillStyle = rg
          ctx.beginPath()
          ctx.arc(x, y, rad, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalCompositeOperation = 'source-over'

      // faint source markers (the emitters)
      if (!reduced) {
        for (let i = 0; i < SRC_N; i++) {
          ctx.fillStyle = `rgba(${BONE}, 0.5)`
          ctx.beginPath()
          ctx.arc(px[i]!, py[i]!, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      vignette(ctx, w, h, 0.42)
    },
  }
}

/* ================================================================== */
/* B — ORBITS  (softened n-body gravity with luminous ember trails)    */
/* ================================================================== */
/*
 * The physics: Newtonian gravity between bodies,
 *     a_i = Σ_{j≠i}  G·m_j·(r_j − r_i) / (|r_j − r_i|² + ε²)^{3/2}
 * The ε² softening removes the singularity at close approach (otherwise two
 * bodies would fling to infinity), giving stable, graceful slingshots. We
 * integrate with semi-implicit (symplectic) Euler so energy doesn't blow up,
 * and persist a fading trail layer so each body paints a comet tail. A heavy
 * central "primary" keeps the system bound and beautiful. The cursor adds a
 * gentle attractor you can perturb the dance with.
 */

interface Body {
  x: number
  y: number
  vx: number
  vy: number
  m: number
  amber: boolean
}

export function makeOrbits(ctx: CanvasRenderingContext2D): Lab2Painter {
  const rand = mulberry32(523)
  let bodies: Body[] = []
  let W = 0
  let H = 0
  let trail: HTMLCanvasElement | null = null
  let tctx: CanvasRenderingContext2D | null = null
  let primary = { x: 0, y: 0, m: 2600 }
  let ptr = { x: 0, y: 0, on: false }
  const G = 1

  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    primary = { x: w * 0.5, y: h * 0.44, m: 2600 }
    const n = reduced ? 4 : 9
    bodies = Array.from({ length: n }, () => {
      // seed on near-circular orbits around the primary: v = sqrt(G·M/r) ⟂ r
      const ang = rand() * Math.PI * 2
      const r = Math.min(w, h) * (0.12 + rand() * 0.34)
      const x = primary.x + Math.cos(ang) * r
      const y = primary.y + Math.sin(ang) * r
      const speed = Math.sqrt((G * primary.m) / r) * (0.85 + rand() * 0.3)
      const dir = rand() > 0.5 ? 1 : 1 // co-rotating reads calmer than chaotic
      return {
        x,
        y,
        vx: -Math.sin(ang) * speed * dir,
        vy: Math.cos(ang) * speed * dir,
        m: 6 + rand() * 14,
        amber: rand() > 0.6,
      }
    })
    // dedicated trail buffer at CSS-px resolution (driver scales the main ctx;
    // we keep trails at logical px so blending math is resolution-independent)
    trail = document.createElement('canvas')
    trail.width = Math.max(1, Math.round(w))
    trail.height = Math.max(1, Math.round(h))
    tctx = trail.getContext('2d')
    if (tctx) {
      tctx.fillStyle = 'rgb(8, 5, 3)'
      tctx.fillRect(0, 0, w, h)
    }
  }

  const accel = (bx: number, by: number, exclude: number): [number, number] => {
    let ax = 0
    let ay = 0
    // primary
    let dx = primary.x - bx
    let dy = primary.y - by
    let d2 = dx * dx + dy * dy + 900 // ε² softening
    let inv = (G * primary.m) / (d2 * Math.sqrt(d2))
    ax += dx * inv
    ay += dy * inv
    // peer bodies
    for (let j = 0; j < bodies.length; j++) {
      if (j === exclude) continue
      const o = bodies[j]!
      dx = o.x - bx
      dy = o.y - by
      d2 = dx * dx + dy * dy + 400
      inv = (G * o.m) / (d2 * Math.sqrt(d2))
      ax += dx * inv
      ay += dy * inv
    }
    // cursor attractor
    if (ptr.on) {
      dx = ptr.x - bx
      dy = ptr.y - by
      d2 = dx * dx + dy * dy + 2500
      inv = (G * 1400) / (d2 * Math.sqrt(d2))
      ax += dx * inv
      ay += dy * inv
    }
    return [ax, ay]
  }

  return {
    resize(w, h, reduced) {
      build(w, h, reduced)
    },
    pointer(x, y, inside) {
      ptr = { x, y, on: inside }
    },
    paint(w, h, _timeSec, progress, reduced, mouse) {
      if (w !== W || h !== H || !trail || !tctx) build(w, h, reduced)
      const tc = tctx!
      // engine drives the cursor via paint()'s mouse arg (pointer() is never
      // called); make it a gentle attractor while moving.
      if (mouse) ptr = { x: mouse.x, y: mouse.y, on: mouse.active && !reduced }

      if (reduced) {
        // static frame: draw the primary + bodies on their seeded orbit ring
        warmBase(ctx, w, h, progress, 0.06)
        ctx.strokeStyle = `rgba(${AMBER}, 0.1)`
        for (const b of bodies) {
          const r = Math.hypot(b.x - primary.x, b.y - primary.y)
          ctx.beginPath()
          ctx.arc(primary.x, primary.y, r, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.fillStyle = `rgba(${AMBER}, 0.9)`
        ctx.beginPath()
        ctx.arc(primary.x, primary.y, 6, 0, Math.PI * 2)
        ctx.fill()
        for (const b of bodies) {
          ctx.fillStyle = b.amber ? `rgba(${AMBER}, 0.85)` : `rgba(${BONE}, 0.7)`
          ctx.beginPath()
          ctx.arc(b.x, b.y, 2.4, 0, Math.PI * 2)
          ctx.fill()
        }
        vignette(ctx, w, h, 0.42)
        return
      }

      // 1) fade the trail buffer toward the warm base → comet tails decay
      tc.globalCompositeOperation = 'source-over'
      tc.fillStyle = 'rgba(8, 5, 3, 0.052)'
      tc.fillRect(0, 0, w, h)

      // 2) integrate (semi-implicit Euler, a few substeps for close approaches)
      const STEPS = 3
      const dt = 0.55 / STEPS
      for (let s = 0; s < STEPS; s++) {
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i]!
          const [ax, ay] = accel(b.x, b.y, i)
          b.vx += ax * dt
          b.vy += ay * dt
        }
        for (const b of bodies) {
          b.x += b.vx * dt
          b.y += b.vy * dt
        }
      }

      // gentle containment: if a body escapes, softly recapture (rare with softening)
      for (const b of bodies) {
        const margin = Math.max(w, h) * 0.65
        if (
          b.x < -margin ||
          b.x > w + margin ||
          b.y < -margin ||
          b.y > h + margin
        ) {
          const ang = rand() * Math.PI * 2
          const r = Math.min(w, h) * 0.28
          b.x = primary.x + Math.cos(ang) * r
          b.y = primary.y + Math.sin(ang) * r
          const speed = Math.sqrt((G * primary.m) / r)
          b.vx = -Math.sin(ang) * speed
          b.vy = Math.cos(ang) * speed
        }
      }

      // 3) stamp glowing bodies into the trail buffer (additive)
      tc.globalCompositeOperation = 'lighter'
      for (const b of bodies) {
        const col = b.amber ? AMBER : BONE
        const rad = 2 + b.m * 0.16
        const rg = tc.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad * 2.4)
        rg.addColorStop(0, `rgba(${col}, 0.9)`)
        rg.addColorStop(0.4, `rgba(${col}, 0.28)`)
        rg.addColorStop(1, `rgba(${col}, 0)`)
        tc.fillStyle = rg
        tc.beginPath()
        tc.arc(b.x, b.y, rad * 2.4, 0, Math.PI * 2)
        tc.fill()
      }
      tc.globalCompositeOperation = 'source-over'

      // 4) blit trail buffer to the screen, then top with the primary star glow
      ctx.drawImage(trail!, 0, 0, w, h)

      // a faint top wash + vignette so text stays readable over bright tails
      warmBase(ctx, w, h, progress, 0)
      ctx.globalCompositeOperation = 'lighter'
      ctx.drawImage(trail!, 0, 0, w, h)
      // primary: a hot ember sun
      const pr = ctx.createRadialGradient(primary.x, primary.y, 0, primary.x, primary.y, 70)
      pr.addColorStop(0, `rgba(${AMBER}, 0.5)`)
      pr.addColorStop(0.4, `rgba(${EMBER}, 0.22)`)
      pr.addColorStop(1, `rgba(${EMBER}, 0)`)
      ctx.fillStyle = pr
      ctx.beginPath()
      ctx.arc(primary.x, primary.y, 70, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      vignette(ctx, w, h, 0.4)
    },
  }
}

/* ================================================================== */
/* C — EPICYCLES  (Fourier series drawing a glyph with rotating vectors) */
/* ================================================================== */
/*
 * The analysis: any closed path can be written as a Fourier series — a sum of
 * counter-rotating circular vectors (epicycles),
 *     z(t) = Σ_k  c_k · e^{i·2π·k·t}
 * Here we take a hand-defined orbit/rocket glyph as a complex signal, run a
 * Discrete Fourier Transform to get the coefficients c_k, sort by magnitude
 * (largest circles first), and animate the chain: tip of each vector is the
 * centre of the next, and the very last tip traces the original shape. The
 * traced path glows and fades, so the figure draws and redraws itself.
 */

function dft(points: { x: number; y: number }[]): { freq: number; amp: number; phase: number }[] {
  const N = points.length
  const out: { freq: number; amp: number; phase: number }[] = []
  for (let k = 0; k < N; k++) {
    let re = 0
    let im = 0
    for (let n = 0; n < N; n++) {
      const phi = (2 * Math.PI * k * n) / N
      const c = Math.cos(phi)
      const s = Math.sin(phi)
      const p = points[n]!
      re += p.x * c + p.y * s
      im += -p.x * s + p.y * c
    }
    re /= N
    im /= N
    // map k to signed frequency so vectors counter-rotate symmetrically
    const freq = k <= N / 2 ? k : k - N
    out.push({ freq, amp: Math.hypot(re, im), phase: Math.atan2(im, re) })
  }
  out.sort((a, b) => b.amp - a.amp)
  return out
}

// A stylised orbit/comet glyph (an ellipse with a tail flick) as a complex path.
function glyphPath(samples: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2
    // base ellipse
    let x = Math.cos(t) * 1.0
    let y = Math.sin(t) * 0.62
    // a comet-tail bump on one side (adds high-frequency interest)
    const tail = Math.exp(-Math.pow((t - Math.PI) * 1.6, 2)) * 0.5
    x -= tail
    y += Math.sin(t * 3) * 0.04
    pts.push({ x, y })
  }
  return pts
}

export function makeEpicycles(ctx: CanvasRenderingContext2D): Lab2Painter {
  const SAMPLES = 128
  const series = dft(glyphPath(SAMPLES))
  // cap the number of vectors we actually animate (keep the strongest)
  const N_VEC = 56
  const vectors = series.slice(0, N_VEC)

  let W = 0
  let H = 0
  let scale = 1
  let cx = 0
  let cy = 0
  let trace: { x: number; y: number }[] = []
  const MAX_TRACE = SAMPLES
  let ptr = { x: 0, y: 0, on: false }

  const build = (w: number, h: number) => {
    W = w
    H = h
    scale = Math.min(w, h) * 0.28
    cx = w * 0.5
    cy = h * 0.42
    trace = []
  }

  return {
    resize(w, h) {
      build(w, h)
    },
    pointer(x, y, inside) {
      ptr = { x, y, on: inside }
    },
    paint(w, h, timeSec, progress, reduced, mouse) {
      if (w !== W || h !== H) build(w, h)
      // engine drives the cursor via paint()'s mouse arg (pointer() is never
      // called); a moving cursor nudges the figure's center for parallax.
      if (mouse) ptr = { x: mouse.x, y: mouse.y, on: mouse.active }
      // center drifts subtly with scroll; cursor nudges it (parallax)
      const baseY = h * (0.42 + progress * 0.06)
      const targetX = w * 0.5 + (ptr.on ? (ptr.x - w * 0.5) * 0.06 : 0)
      const targetY = baseY + (ptr.on ? (ptr.y - baseY) * 0.06 : 0)
      cx += (targetX - cx) * 0.04
      cy += (targetY - cy) * 0.04

      warmBase(ctx, w, h, progress, 0.05)

      // time param 0..1 around the cycle
      const t = reduced ? 0.18 : (timeSec * 0.06) % 1

      // walk the epicycle chain
      let x = cx
      let y = cy
      ctx.lineWidth = 1
      for (let i = 0; i < vectors.length; i++) {
        const v = vectors[i]!
        const prevX = x
        const prevY = y
        const ang = v.freq * 2 * Math.PI * t + v.phase
        const r = v.amp * scale
        x += r * Math.cos(ang)
        y += r * Math.sin(ang)

        if (!reduced && r > 0.6) {
          // faint construction circle
          ctx.strokeStyle = `rgba(${BONE}, 0.05)`
          ctx.beginPath()
          ctx.arc(prevX, prevY, r, 0, Math.PI * 2)
          ctx.stroke()
          // the radial arm
          ctx.strokeStyle = `rgba(${AMBER}, ${0.05 + 0.1 * (1 - i / vectors.length)})`
          ctx.beginPath()
          ctx.moveTo(prevX, prevY)
          ctx.lineTo(x, y)
          ctx.stroke()
        }
      }

      // record the pen tip → the traced glyph
      trace.push({ x, y })
      if (trace.length > MAX_TRACE) trace.shift()

      // draw the trace with a head→tail glow falloff (additive)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      const n = trace.length
      for (let i = 1; i < n; i++) {
        const a = i / n // newer = brighter
        const p0 = trace[i - 1]!
        const p1 = trace[i]!
        ctx.strokeStyle = `rgba(${AMBER}, ${a * 0.7})`
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }
      // bright pen head
      if (n > 0) {
        const head = trace[n - 1]!
        const rg = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 10)
        rg.addColorStop(0, `rgba(${BONE}, 0.95)`)
        rg.addColorStop(0.5, `rgba(${AMBER}, 0.5)`)
        rg.addColorStop(1, `rgba(${AMBER}, 0)`)
        ctx.fillStyle = rg
        ctx.beginPath()
        ctx.arc(head.x, head.y, 10, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      vignette(ctx, w, h, 0.45)
    },
  }
}

/* ================================================================== */
/* D — PENDULUM  (a field of chaotic double pendulums, phosphor trails) */
/* ================================================================== */
/*
 * The physics: the double pendulum — two coupled rods/masses — is the textbook
 * chaotic system. Its equations of motion are the standard Lagrangian ones for
 * angles θ1, θ2 (full nonlinear form, integrated with RK4 for stability). Two
 * pendulums started a hair apart diverge exponentially — sensitive dependence
 * on initial conditions. We run a small grid of them with tiny offset starting
 * angles and let the BOB-2 tips paint slowly-fading phosphor arcs, so the screen
 * fills with chaotic, never-repeating amber calligraphy.
 */

interface DPend {
  th1: number
  th2: number
  w1: number
  w2: number
  ox: number // pivot x
  oy: number // pivot y
  L1: number
  L2: number
  hue: 0 | 1 // 0 amber, 1 bone
}

// one RK4 step of the double-pendulum ODE (m1=m2=1, gravity g)
function dpDerivs(th1: number, th2: number, w1: number, w2: number, g: number) {
  const d = th1 - th2
  const cs = Math.cos(d)
  const sn = Math.sin(d)
  const denom = 2 - cs * cs // (m1+m2) − m2·cos²  with masses 1 → 2 − cos²
  const a1 =
    (-g * 2 * Math.sin(th1) -
      g * Math.sin(th1 - 2 * th2) -
      2 * sn * (w2 * w2 + w1 * w1 * cs)) /
    denom
  const a2 =
    (2 * sn * (w1 * w1 * 2 + g * 2 * Math.cos(th1) + w2 * w2 * cs)) / denom
  return { dth1: w1, dth2: w2, dw1: a1, dw2: a2 }
}

export function makePendulum(ctx: CanvasRenderingContext2D): Lab2Painter {
  const rand = mulberry32(797)
  let W = 0
  let H = 0
  let pends: DPend[] = []
  let trail: HTMLCanvasElement | null = null
  let tctx: CanvasRenderingContext2D | null = null
  const g = 9.81

  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    // a sparse grid of pivots; fewer when reduced
    const cols = reduced ? 2 : Math.min(5, Math.max(3, Math.round(w / 360)))
    const rows = reduced ? 1 : Math.min(3, Math.max(2, Math.round(h / 380)))
    const L = Math.min(w / (cols + 1), h / (rows + 1)) * 0.27
    pends = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = ((c + 1) / (cols + 1)) * w
        const oy = ((r + 1) / (rows + 1)) * h * 0.92 + h * 0.02
        // start near the unstable top, with a hair of offset → chaos
        const base = Math.PI * (0.92 + rand() * 0.16)
        pends.push({
          th1: base,
          th2: base + (rand() - 0.5) * 0.02,
          w1: 0,
          w2: 0,
          ox,
          oy,
          L1: L,
          L2: L * 0.84,
          hue: rand() > 0.55 ? 1 : 0,
        })
      }
    }
    trail = document.createElement('canvas')
    trail.width = Math.max(1, Math.round(w))
    trail.height = Math.max(1, Math.round(h))
    tctx = trail.getContext('2d')
    if (tctx) {
      tctx.fillStyle = 'rgb(8, 5, 3)'
      tctx.fillRect(0, 0, w, h)
    }
  }

  const tipOf = (p: DPend) => {
    const x1 = p.ox + p.L1 * Math.sin(p.th1)
    const y1 = p.oy + p.L1 * Math.cos(p.th1)
    const x2 = x1 + p.L2 * Math.sin(p.th2)
    const y2 = y1 + p.L2 * Math.cos(p.th2)
    return { x1, y1, x2, y2 }
  }

  return {
    resize(w, h, reduced) {
      build(w, h, reduced)
    },
    paint(w, h, _timeSec, progress, reduced) {
      if (w !== W || h !== H || !trail || !tctx) build(w, h, reduced)
      const tc = tctx!

      if (reduced) {
        warmBase(ctx, w, h, progress, 0.06)
        for (const p of pends) {
          const { x1, y1, x2, y2 } = tipOf(p)
          ctx.strokeStyle = `rgba(${BONE}, 0.35)`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(p.ox, p.oy)
          ctx.lineTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
          ctx.fillStyle = `rgba(${AMBER}, 0.8)`
          ctx.beginPath()
          ctx.arc(x2, y2, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        vignette(ctx, w, h, 0.42)
        return
      }

      // 1) decay the phosphor trail toward base
      tc.globalCompositeOperation = 'source-over'
      tc.fillStyle = 'rgba(8, 5, 3, 0.035)'
      tc.fillRect(0, 0, w, h)

      // 2) integrate each pendulum a few RK4 substeps and stamp its tip arc
      const STEPS = 4
      const dt = 0.06
      tc.globalCompositeOperation = 'lighter'
      tc.lineCap = 'round'
      for (const p of pends) {
        const col = p.hue ? BONE : AMBER
        for (let s = 0; s < STEPS; s++) {
          const prev = tipOf(p)
          // RK4
          const k1 = dpDerivs(p.th1, p.th2, p.w1, p.w2, g)
          const k2 = dpDerivs(
            p.th1 + (k1.dth1 * dt) / 2,
            p.th2 + (k1.dth2 * dt) / 2,
            p.w1 + (k1.dw1 * dt) / 2,
            p.w2 + (k1.dw2 * dt) / 2,
            g,
          )
          const k3 = dpDerivs(
            p.th1 + (k2.dth1 * dt) / 2,
            p.th2 + (k2.dth2 * dt) / 2,
            p.w1 + (k2.dw1 * dt) / 2,
            p.w2 + (k2.dw2 * dt) / 2,
            g,
          )
          const k4 = dpDerivs(
            p.th1 + k3.dth1 * dt,
            p.th2 + k3.dth2 * dt,
            p.w1 + k3.dw1 * dt,
            p.w2 + k3.dw2 * dt,
            g,
          )
          p.th1 += ((k1.dth1 + 2 * k2.dth1 + 2 * k3.dth1 + k4.dth1) * dt) / 6
          p.th2 += ((k1.dth2 + 2 * k2.dth2 + 2 * k3.dth2 + k4.dth2) * dt) / 6
          p.w1 += ((k1.dw1 + 2 * k2.dw1 + 2 * k3.dw1 + k4.dw1) * dt) / 6
          p.w2 += ((k1.dw2 + 2 * k2.dw2 + 2 * k3.dw2 + k4.dw2) * dt) / 6
          const cur = tipOf(p)
          // draw the segment the tip swept this substep → continuous calligraphy
          tc.strokeStyle = `rgba(${col}, 0.5)`
          tc.lineWidth = 1.6
          tc.beginPath()
          tc.moveTo(prev.x2, prev.y2)
          tc.lineTo(cur.x2, cur.y2)
          tc.stroke()
        }
      }
      tc.globalCompositeOperation = 'source-over'

      // 3) composite: base + glowing trail + the live arms on top
      warmBase(ctx, w, h, progress, 0.05)
      ctx.globalCompositeOperation = 'lighter'
      ctx.drawImage(trail!, 0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'

      // live pendulum arms (thin, so they read as instruments over the trails)
      for (const p of pends) {
        const { x1, y1, x2, y2 } = tipOf(p)
        ctx.strokeStyle = `rgba(${BONE}, 0.22)`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(p.ox, p.oy)
        ctx.lineTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        // pivot + bobs
        ctx.fillStyle = `rgba(${BONE}, 0.4)`
        ctx.beginPath()
        ctx.arc(p.ox, p.oy, 1.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = p.hue ? `rgba(${BONE}, 0.85)` : `rgba(${AMBER}, 0.9)`
        ctx.beginPath()
        ctx.arc(x2, y2, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      vignette(ctx, w, h, 0.4)
    },
  }
}

/* Merged into the main engine (src/components/bgVariants.ts) — the individual
   make* factories above are imported there directly. */
