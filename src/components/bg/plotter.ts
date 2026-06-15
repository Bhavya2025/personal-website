/**
 * PLOTTER — a function-plotter background.
 *
 * A faint Cartesian plane (thin axes + light grid, low-contrast bone) on which a
 * looping library of mathematically-elegant curves DRAW THEMSELVES stroke by
 * stroke, hold, then fade — cycling forever like pages of an instrument's
 * scratchpad. The signature is the "pen": a glowing amber head that traces the
 * curve left→right (or along the parameter), leaving the inked line behind it.
 *
 * The interface matches BgPainter (see src/components/bgVariants.ts):
 *   makePlotter(ctx, page) -> { resize(w,h,reduced), paint(w,h,t,progress,reduced,mouse) }
 *
 * MATH / IDEA
 *   World space is mathematical: x ∈ [-X, X], y in mathematical units, mapped to
 *   pixels by a fitted scale so every curve sits nicely in frame. Curves come in
 *   two flavours:
 *     - explicit  y = f(x): sine, damped e^{-x}·sin, cubic polynomial, Gaussian
 *       bell, logistic. Drawn by sweeping x from left to right.
 *     - parametric (x(u), y(u)): a rose r=cos(kθ) and a log spiral. Drawn by
 *       sweeping the parameter u.
 *   Each curve runs a small state machine: DRAW (pen reveals the path) → HOLD
 *   (full curve glows) → FADE (it dims toward a faint ghost, the cool-blue
 *   afterimage of the *previous* curve stays underneath for depth) → advance.
 *
 * SCROLL (home only)
 *   `progress` 0→1 pans the plane downward a little (the origin drifts) and adds
 *   a phase offset that biases which function is "up next", so scrolling feels
 *   like flipping through the notebook. It also lifts the grid contrast a hair.
 *
 * MOUSE
 *   The cursor gives a gentle parallax (the whole plane eases toward it) and
 *   drops an instrument "probe": a faint vertical guide at the cursor x with a
 *   readout dot riding *on* the current explicit curve (snaps to f(x)). Settles
 *   back to centre when the cursor stops (mouse.active goes false).
 *
 * PERF: O(samples) per frame with a fixed small sample count; ≤ a couple of
 * gradients; no per-frame array allocation. reduced-motion → a calm static frame
 * (grid + one fully-inked curve, no pen, no probe).
 */

import type { BgPainter, BgPage, BgMouse } from '../bgVariants'
import { mulberry32, PALETTE } from '../../lib/palette'

const AMBER = '255, 176, 0'
const BONE = '232, 228, 216'
const COOL = '120, 170, 255'

type CurveKind =
  | 'sine'
  | 'damped'
  | 'cubic'
  | 'gauss'
  | 'logistic'
  | 'rose'
  | 'spiral'

interface CurveDef {
  kind: CurveKind
  /** parametric curves sweep u ∈ [0, uMax]; explicit ones ignore this. */
  parametric: boolean
  uMax: number
  /** per-curve coefficients, baked once so the cycle is varied but stable. */
  a: number
  b: number
  c: number
  color: string
}

export function makePlotter(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 23 : 64)

  // --- the looping curve library (order shuffled by seed, coeffs jittered) ---
  const baseColors = [AMBER, COOL]
  const make = (kind: CurveKind, parametric: boolean, uMax: number, a: number, b: number, c: number): CurveDef => ({
    kind,
    parametric,
    uMax,
    a,
    b,
    c,
    color: '', // assigned in sequence below so amber/cool alternate
  })
  const library: CurveDef[] = [
    make('sine', false, 0, 1.15, 1.0, 0), // a·sin(b·x)
    make('damped', false, 0, 1.7, 2.4, 0.55), // a·e^{-c·x}·sin(b·x)
    make('gauss', false, 0, 1.55, 0.9, 0), // a·e^{-(x/b)^2}
    make('logistic', false, 0, 1.45, 1.6, 0), // a/(1+e^{-b·x}) - a/2
    make('cubic', false, 0, 0.16, -0.55, 0.0), // a·x³ + b·x  (odd, tidy)
    make('rose', true, Math.PI * 2, 1.45, 3, 0), // r = a·cos(b·θ)
    make('spiral', true, Math.PI * 6.5, 0.12, 0.16, 0), // log spiral r = a·e^{b·θ}
  ]
  // light jitter so it doesn't feel canned, then assign alternating colors
  for (let i = 0; i < library.length; i++) {
    const cv = library[i]!
    cv.a *= 0.9 + rand() * 0.2
    cv.b *= 0.92 + rand() * 0.16
    cv.color = baseColors[i % 2]!
  }

  // --- size-dependent fit (world units → pixels) ---
  let W = 0
  let H = 0
  let unit = 60 // px per mathematical unit (x)
  let halfX = 6 // x spans [-halfX, halfX]

  // --- cycle state machine ---
  // phase ∈ { 0:draw, 1:hold, 2:fade }, with a per-state timer.
  const DRAW_T = 3.0
  const HOLD_T = 1.6
  const FADE_T = 1.4
  let curIdx = 0
  let prevIdx = -1
  let phase = 0
  let phaseT = 0
  let lastTime = -1

  // eased plane offset (mouse parallax + scroll pan), held in closure so it
  // tweens smoothly without per-frame allocation.
  let panX = 0
  let panY = 0

  const reset = () => {
    curIdx = 0
    prevIdx = -1
    phase = 0
    phaseT = 0
    lastTime = -1
  }

  // explicit y = f(x), in world units
  const fExplicit = (cv: CurveDef, x: number): number => {
    switch (cv.kind) {
      case 'sine':
        return cv.a * Math.sin(cv.b * x)
      case 'damped':
        return cv.a * Math.exp(-cv.c * Math.abs(x)) * Math.sin(cv.b * x)
      case 'gauss':
        return cv.a * Math.exp(-((x / cv.b) ** 2))
      case 'logistic': {
        const L = cv.a
        return L / (1 + Math.exp(-cv.b * x)) - L / 2
      }
      case 'cubic':
        return cv.a * x * x * x + cv.b * x
      default:
        return 0
    }
  }

  // parametric (x,y) in world units
  const fParam = (cv: CurveDef, u: number): [number, number] => {
    if (cv.kind === 'rose') {
      const r = cv.a * Math.cos(cv.b * u)
      return [r * Math.cos(u), r * Math.sin(u)]
    }
    // log spiral
    const r = cv.a * Math.exp(cv.b * u)
    return [r * Math.cos(u), r * Math.sin(u)]
  }

  const fit = (w: number, h: number) => {
    W = w
    H = h
    // span a comfortable horizontal range; pick unit so curves fill ~70% width
    halfX = w < 640 ? 4.6 : 6
    unit = (w * 0.42) / halfX
  }

  /**
   * Draw one curve at a given completion ratio (0..1 of its path) and alpha.
   * `glowHead` paints the pen at the leading point when true (DRAW phase).
   */
  const drawCurve = (
    cv: CurveDef,
    ox: number,
    oy: number,
    reveal: number,
    alpha: number,
    glowHead: boolean,
    timeSec: number,
  ) => {
    if (alpha <= 0.004) return
    const SAMPLES = 200
    const last = Math.max(1, Math.floor(SAMPLES * reveal))
    const col = cv.color

    const px = (xWorld: number) => ox + xWorld * unit
    const py = (yWorld: number) => oy - yWorld * unit

    // resolve a sample index → screen point
    let hx = 0
    let hy = 0
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // soft underglow pass (wider, faint) then the crisp line on top
    ctx.globalCompositeOperation = 'lighter'
    for (let pass = 0; pass < 2; pass++) {
      const wide = pass === 0
      ctx.lineWidth = wide ? 4.5 : 1.5
      ctx.strokeStyle = `rgba(${col}, ${alpha * (wide ? 0.1 : 0.85)})`
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= last; i++) {
        const tt = i / SAMPLES // 0..1 along the path
        let sx: number
        let sy: number
        if (cv.parametric) {
          const u = tt * cv.uMax
          const [wx, wy] = fParam(cv, u)
          sx = px(wx)
          sy = py(wy)
        } else {
          const xw = -halfX + tt * (halfX * 2)
          sx = px(xw)
          sy = py(fExplicit(cv, xw))
        }
        // clamp wildly off-screen vertical excursions so a steep curve doesn't
        // spike into a hairline; keep within a generous band.
        if (sy < -H) sy = -H
        else if (sy > H * 2) sy = H * 2
        if (!started) {
          ctx.moveTo(sx, sy)
          started = true
        } else {
          ctx.lineTo(sx, sy)
        }
        hx = sx
        hy = sy
      }
      ctx.stroke()
    }

    // pen head: a hot bone-white core in an amber halo at the leading point
    if (glowHead && reveal < 0.999) {
      const pulse = 1 + 0.18 * Math.sin(timeSec * 9)
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 11 * pulse)
      hg.addColorStop(0, `rgba(${BONE}, ${0.95 * alpha})`)
      hg.addColorStop(0.35, `rgba(${col}, ${0.55 * alpha})`)
      hg.addColorStop(1, `rgba(${col}, 0)`)
      ctx.fillStyle = hg
      ctx.beginPath()
      ctx.arc(hx, hy, 11 * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = alpha
      ctx.fillStyle = PALETTE.bone
      ctx.beginPath()
      ctx.arc(hx, hy, 1.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  // faint Cartesian plane: minor grid, axes, tick marks
  const drawPlane = (ox: number, oy: number, contrast: number) => {
    const minA = 0.05 * contrast
    const majA = 0.1 * contrast
    const axisA = 0.16 * contrast
    const step = unit // one world unit per grid cell
    ctx.lineWidth = 1

    // minor vertical + horizontal grid lines
    ctx.strokeStyle = `rgba(${BONE}, ${minA})`
    ctx.beginPath()
    const leftN = Math.ceil((ox - 0) / step)
    const rightN = Math.ceil((W - ox) / step)
    for (let i = -leftN; i <= rightN; i++) {
      const x = ox + i * step
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
    }
    const upN = Math.ceil(oy / step)
    const dnN = Math.ceil((H - oy) / step)
    for (let j = -upN; j <= dnN; j++) {
      const y = oy + j * step
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
    }
    ctx.stroke()

    // every 5th line a touch stronger (major grid), in cool-blue for instrument feel
    ctx.strokeStyle = `rgba(${COOL}, ${majA})`
    ctx.beginPath()
    for (let i = -leftN; i <= rightN; i++) {
      if (i % 5 !== 0) continue
      const x = ox + i * step
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
    }
    for (let j = -upN; j <= dnN; j++) {
      if (j % 5 !== 0) continue
      const y = oy + j * step
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
    }
    ctx.stroke()

    // axes (bone, a little brighter) + tick marks along them
    ctx.strokeStyle = `rgba(${BONE}, ${axisA})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, oy)
    ctx.lineTo(W, oy)
    ctx.moveTo(ox, 0)
    ctx.lineTo(ox, H)
    // ticks on x-axis
    const tick = 4
    for (let i = -leftN; i <= rightN; i++) {
      const x = ox + i * step
      ctx.moveTo(x, oy - tick)
      ctx.lineTo(x, oy + tick)
    }
    for (let j = -upN; j <= dnN; j++) {
      const y = oy + j * step
      ctx.moveTo(ox - tick, y)
      ctx.lineTo(ox + tick, y)
    }
    ctx.stroke()
  }

  // dark base + subtle vignette so bone/amber text stays readable on top
  const drawBase = (progress: number) => {
    const topB = page === 'home' ? 5 + progress * 4 : 5
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, `rgb(${Math.round(topB)}, ${Math.round(topB)}, ${Math.round(topB + 3)})`)
    g.addColorStop(1, 'rgb(3, 3, 6)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  const drawVignette = () => {
    const minDim = Math.min(W, H)
    const vg = ctx.createRadialGradient(
      W / 2,
      H / 2,
      minDim * 0.32,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.78,
    )
    vg.addColorStop(0, 'rgba(0, 0, 0, 0)')
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, W, H)
  }

  return {
    resize(w, h) {
      fit(w, h)
      reset()
    },

    paint(w, h, timeSec, progress, reduced, mouse?: BgMouse) {
      if (w !== W || h !== H) fit(w, h)

      drawBase(progress)

      // origin: centred, nudged a touch high; scroll pans it down on home.
      const scrollPan = page === 'home' ? progress * h * 0.16 : 0
      const baseOx = w * 0.5
      const baseOy = h * 0.46 + scrollPan

      // ---------- REDUCED MOTION: calm static frame ----------
      if (reduced) {
        drawPlane(baseOx, baseOy, 1)
        // one fully-inked representative curve (the damped oscillation), no pen
        const cv = library[1]!
        drawCurve(cv, baseOx, baseOy, 1, 0.55, false, 0)
        drawVignette()
        return
      }

      // ---------- mouse parallax (eased) ----------
      const tgtPanX = mouse && mouse.active ? (mouse.x / w - 0.5) * -28 : 0
      const tgtPanY = mouse && mouse.active ? (mouse.y / h - 0.5) * -18 : 0
      panX += (tgtPanX - panX) * 0.06
      panY += (tgtPanY - panY) * 0.06
      const ox = baseOx + panX
      const oy = baseOy + panY

      // grid contrast lifts slightly as you scroll on home
      const contrast = 1 + (page === 'home' ? progress * 0.5 : 0)
      drawPlane(ox, oy, contrast)

      // ---------- advance the cycle state machine ----------
      if (lastTime < 0) lastTime = timeSec
      let dt = timeSec - lastTime
      lastTime = timeSec
      if (dt < 0 || dt > 0.1) dt = 1 / 60 // guard against tab-throttle jumps
      phaseT += dt

      const dur = phase === 0 ? DRAW_T : phase === 1 ? HOLD_T : FADE_T
      if (phaseT >= dur) {
        phaseT = 0
        if (phase === 0) phase = 1
        else if (phase === 1) phase = 2
        else {
          // FADE finished → advance. Scroll biases the next pick on home so the
          // sequence feels coupled to the page position.
          phase = 0
          prevIdx = curIdx
          const bias = page === 'home' ? Math.floor(progress * library.length) : 0
          curIdx = (curIdx + 1 + (bias % 2)) % library.length
        }
      }

      const cur = library[curIdx]!

      // previous curve lingers as a faint cool afterimage during DRAW/HOLD
      if (prevIdx >= 0 && phase !== 2) {
        const prev = library[prevIdx]!
        const ghost = phase === 0 ? 0.18 * (1 - phaseT / DRAW_T) : 0
        if (ghost > 0.01) drawCurve(prev, ox, oy, 1, ghost, false, timeSec)
      }

      // current curve per phase
      if (phase === 0) {
        // DRAW: ease the reveal so the pen accelerates then settles
        const k = phaseT / DRAW_T
        const reveal = k * k * (3 - 2 * k) // smoothstep
        drawCurve(cur, ox, oy, reveal, 0.95, true, timeSec)
      } else if (phase === 1) {
        // HOLD: full curve, a gentle breathing glow
        const glow = 0.82 + 0.12 * Math.sin(timeSec * 1.6)
        drawCurve(cur, ox, oy, 1, glow, false, timeSec)
      } else {
        // FADE: dim toward zero
        const a = 0.82 * (1 - phaseT / FADE_T)
        drawCurve(cur, ox, oy, 1, a, false, timeSec)
      }

      // ---------- instrument probe (mouse) ----------
      // only for explicit curves and while the curve is fully drawn enough that
      // a readout makes sense (HOLD, or late DRAW).
      if (mouse && mouse.active && !cur.parametric && (phase === 1 || (phase === 0 && phaseT / DRAW_T > 0.6))) {
        const xWorld = (mouse.x - ox) / unit
        if (xWorld >= -halfX && xWorld <= halfX) {
          const yWorld = fExplicit(cur, xWorld)
          const sx = mouse.x
          const sy = oy - yWorld * unit
          // vertical guide
          ctx.strokeStyle = `rgba(${BONE}, 0.14)`
          ctx.lineWidth = 1
          ctx.setLineDash([3, 4])
          ctx.beginPath()
          ctx.moveTo(sx, oy)
          ctx.lineTo(sx, sy)
          ctx.stroke()
          // horizontal guide to the y-axis
          ctx.beginPath()
          ctx.moveTo(ox, sy)
          ctx.lineTo(sx, sy)
          ctx.stroke()
          ctx.setLineDash([])
          // readout dot riding the curve
          ctx.globalCompositeOperation = 'lighter'
          const dg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 7)
          dg.addColorStop(0, `rgba(${BONE}, 0.85)`)
          dg.addColorStop(0.4, `rgba(${AMBER}, 0.5)`)
          dg.addColorStop(1, `rgba(${AMBER}, 0)`)
          ctx.fillStyle = dg
          ctx.beginPath()
          ctx.arc(sx, sy, 7, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalCompositeOperation = 'source-over'
        }
      }

      drawVignette()
    },
  }
}
