/**
 * BLACK HOLE — a clean black void wrapped by a spacetime gravity well.
 *
 * CONCEPT
 * -------
 * The centrepiece is a single dead-#000 BLACK CIRCLE — a clean void with a soft
 * dark "gravity" halo just outside it (no accretion disk, no jets, no Doppler
 * beams). The SIGNATURE is the WRAPPING: a polar grid of the fabric of
 * spacetime — concentric RINGS + radial SPOKES — that funnels INTO the void,
 * the classic "rubber-sheet" gravity well seen top-down.
 *
 * HOW THE WRAPPING WORKS
 * ----------------------
 * Every grid vertex lives at a rest radius `rr`. A radial gravity dip pulls each
 * vertex INWARD by a smooth Lorentzian well:
 *
 *     warp(rr) = rr - DIP / (1 + (rr / CORE)^2)
 *
 * Far-out vertices barely move; vertices near the rim are sucked toward the hole
 * and PILE UP just outside the horizon — rings compress into a dense bright band
 * hugging the circle's circumference (the visual "wrap"). Radial spokes are
 * drawn through the SAME warped radii so they bend and crowd at the rim too, and
 * a differential swirl `swirl(rr)` rotates inner radii faster than outer ones,
 * twisting the whole sheet into a gentle whirlpool that winds around the void
 * (frame-dragging flavour). Rings nearest the hole glow AMBER; the far sheet
 * fades to faint cool-blue / bone, pulling the eye inward along the funnel.
 *
 * A few SPARSE STARS sit in the calm outer field, gravitationally LENSED by the
 * same well (pushed outward near the rim and pooled into a faint Einstein ring)
 * so the void reads as bending real space, not just a drawn diagram.
 *
 * SCROLL (home, progress 0→1): DIP deepens, CORE tightens and the void grows, so
 * the well digs harder and the rings wrap tighter as you descend; the swirl
 * winds faster. Projects page ignores scroll and holds a calm mid intensity.
 *
 * MOUSE: the whole well eases a few px toward the cursor and settles back.
 *
 * REDUCED MOTION: one calm STATIC frame (swirl frozen, no shimmer/twinkle) with
 * lower element counts.
 *
 * PERF: O(RINGS*STEPS + SPOKES*SAMPLES + STARS) per frame, all caps small and
 * area-scaled; two scratch Float32Arrays + a handful of gradients, zero
 * allocation inside the hot loop. Drawn in CSS px (engine owns DPR).
 */

import type { BgPainter, BgPage, BgMouse } from '../bgVariants'
import { mulberry32 } from '../../lib/palette'

const AMBER = '255, 176, 0'
const AMBER_DEEP = '199, 127, 0'
const BONE = '232, 228, 216'
const COOL = '120, 170, 255'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

interface BHStar {
  /** rest position, normalized to minDim, centred on the void */
  nx: number
  ny: number
  r: number
  tw: number
  warm: boolean
}

export function makeBlackhole(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  // Deterministic seed so the (very light) randomness is stable per page.
  const rand = mulberry32(page === 'home' ? 0x9e11 : 0x4c0d)
  // A tiny per-page rotational offset so the two pages aren't identical.
  const baseRot = rand() * Math.PI * 2

  let W = 0
  let H = 0
  let minDim = 0
  let builtReduced = false

  // --- geometry caps (resolved per resize, area-scaled) ------------------
  let RINGS = 26 // concentric circles of the sheet
  let STEPS = 96 // angular samples per ring (closed loop)
  let SPOKES = 36 // radial lines fanning out
  let SAMPLES = 30 // radial samples per spoke

  // rest radii (normalized to minDim) for ring i and spoke sample s
  let ringRest: Float32Array = new Float32Array(0)
  let spokeRest: Float32Array = new Float32Array(0)

  // scratch buffers for one ring's warped points — reused, never reallocated
  let ringX: Float32Array = new Float32Array(0)
  let ringY: Float32Array = new Float32Array(0)

  // sparse lensed starfield (far outer depth)
  let stars: BHStar[] = []

  // eased mouse parallax (px)
  let pOffX = 0
  let pOffY = 0

  const build = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    minDim = Math.min(w, h)
    builtReduced = reduced

    // Scale element counts with the smaller dimension, capped both ways so a
    // 4K monitor and a phone both stay O(n) and visually balanced. Reduced
    // motion draws a lighter sheet.
    const sd = minDim
    RINGS = Math.max(reduced ? 12 : 16, Math.min(reduced ? 22 : 30, Math.round(sd / 26)))
    SPOKES = Math.max(reduced ? 18 : 24, Math.min(reduced ? 32 : 44, Math.round(sd / 18)))
    STEPS = 96
    SAMPLES = 30

    // Rest radii for rings: from just outside the (max) horizon to ~1.5 of the
    // larger dimension. Bias spacing so rest rings bunch slightly outward — the
    // warp then crushes them inward at the rim, reading as the funnel pulling.
    ringRest = new Float32Array(RINGS)
    const rInner = 0.14
    const rOuter = (Math.max(w, h) / minDim) * 1.55
    for (let i = 0; i < RINGS; i++) {
      const t = i / (RINGS - 1)
      ringRest[i] = lerp(rInner, rOuter, Math.pow(t, 0.82))
    }

    // Rest radii for spoke samples — same span, finer near the hole so bent
    // spokes stay smooth through the high-curvature zone at the rim.
    spokeRest = new Float32Array(SAMPLES)
    for (let s = 0; s < SAMPLES; s++) {
      const t = s / (SAMPLES - 1)
      spokeRest[s] = lerp(rInner, rOuter, Math.pow(t, 1.18))
    }

    ringX = new Float32Array(STEPS + 1)
    ringY = new Float32Array(STEPS + 1)

    // sparse stars across a square a bit larger than the viewport
    const starCount = Math.min(reduced ? 40 : 80, Math.max(28, Math.round((w * h) / 26000)))
    stars = Array.from({ length: starCount }, () => ({
      nx: (rand() - 0.5) * 2.6,
      ny: (rand() - 0.5) * 2.6,
      r: 0.35 + rand() * 0.9,
      tw: rand() * Math.PI * 2,
      warm: rand() > 0.84,
    }))
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
      if (w !== W || h !== H || ringRest.length === 0 || reduced !== builtReduced) {
        build(w, h, reduced)
      }

      const p = page === 'home' ? clamp01(progress) : 0.3
      const md = minDim
      const TWO_PI = Math.PI * 2

      // --- mouse parallax (eased toward the cursor; settles to neutral) ----
      let tgtX = 0
      let tgtY = 0
      if (mouse && mouse.active) {
        tgtX = (mouse.x / w - 0.5) * md * 0.04
        tgtY = (mouse.y / h - 0.5) * md * 0.04
      }
      const ease = reduced ? 1 : 0.07
      pOffX += (tgtX - pOffX) * ease
      pOffY += (tgtY - pOffY) * ease

      // Void centre: horizontally centred, a touch above the middle; drifts a
      // hair lower on descent. Parallax nudges it toward the cursor.
      const cx = w * 0.5 + pOffX
      const cy = h * (0.46 + p * 0.05) + pOffY

      // --- well parameters (scroll deepens the dip & tightens the core) ----
      const rh = md * (0.085 + p * 0.05) // event-horizon radius (px)
      const nHoriz = rh / md // horizon radius in normalized units
      const DIP = 0.16 + p * 0.16
      const CORE = 0.3 - p * 0.1
      const core2 = CORE * CORE
      const swirlBase = baseRot + (reduced ? 0.6 : timeSec * (0.12 + p * 0.16))
      const swirlAmt = 0.55 + p * 0.85

      // warp a rest radius inward by the Lorentzian dip; never inside horizon.
      const warpR = (rr: number) => {
        const r = rr - DIP / (1 + (rr * rr) / core2)
        return Math.max(nHoriz * 1.02, r)
      }
      // differential swirl angle added at a given rest radius
      const swirlAt = (rr: number) => swirlBase * swirlAmt * (core2 / (core2 + rr * rr))

      // ====================================================================
      // 1. BASE — near-black deep space, faintly cooler toward the bottom
      // ====================================================================
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, 'rgb(4, 4, 8)')
      bg.addColorStop(
        1,
        `rgb(${4 + Math.round(p * 3)}, ${5 + Math.round(p * 4)}, ${10 + Math.round(p * 8)})`,
      )
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // ====================================================================
      // 2. LENSED STARFIELD — sparse far stars bent outward around the void
      // ====================================================================
      // Light is pushed AWAY from the hole (strongest near the rim) and pools
      // into a faint Einstein ring, so the field reads as bending real space.
      const bendStar = (0.8 + p * 0.8) * nHoriz * nHoriz
      const einstein = nHoriz * 1.7
      ctx.globalCompositeOperation = 'lighter'
      for (const s of stars) {
        const sx = cx + s.nx * md
        const sy = cy + s.ny * md
        const dx = sx - cx
        const dy = sy - cy
        let dN = Math.hypot(dx, dy) / md
        if (dN < 0.0001) dN = 0.0001
        const push = Math.min(0.28, bendStar / dN)
        const dN2 = dN + push
        if (dN2 < nHoriz * 1.1) continue // swept into the void
        const k = dN2 / dN
        const lx = cx + dx * k
        const ly = cy + dy * k
        const ringT = Math.exp(-Math.abs(dN2 - einstein) / (nHoriz * 1.7))
        const tw = reduced ? 0.85 : 0.6 + 0.4 * Math.sin(timeSec * 1.5 + s.tw)
        const a = (0.1 + ringT * 0.45) * tw * 0.7
        if (a < 0.02) continue
        ctx.fillStyle = `rgba(${s.warm ? AMBER : BONE}, ${a})`
        ctx.beginPath()
        ctx.arc(lx, ly, s.r * (0.8 + ringT * 0.8), 0, TWO_PI)
        ctx.fill()
      }

      // ====================================================================
      // 3. RADIAL SPOKES — straight rest rays bent + swirled into the funnel
      // ====================================================================
      ctx.lineWidth = 1
      for (let k = 0; k < SPOKES; k++) {
        const a0 = (k / SPOKES) * TWO_PI
        ctx.beginPath()
        for (let s = 0; s < SAMPLES; s++) {
          const rr = spokeRest[s]!
          const wr = warpR(rr)
          const ang = a0 + swirlAt(rr)
          const px = cx + Math.cos(ang) * wr * md
          const py = cy + Math.sin(ang) * wr * md
          if (s === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.strokeStyle = `rgba(${COOL}, ${0.05 + p * 0.04})`
        ctx.stroke()
      }

      // ====================================================================
      // 4. CONCENTRIC RINGS — the rubber sheet; compress + brighten at the rim
      // ====================================================================
      for (let i = 0; i < RINGS; i++) {
        const rr = ringRest[i]!
        const wr = warpR(rr)
        const sw = swirlAt(rr)
        const rpx = wr * md

        // closeness: 1 right at the rim → 0 far out. Drives colour + weight.
        const close = clamp01(1 - (wr - nHoriz) / (0.55 + p * 0.15))
        const closeP = close * close

        for (let j = 0; j <= STEPS; j++) {
          const ang = (j / STEPS) * TWO_PI + sw
          ringX[j] = cx + Math.cos(ang) * rpx
          ringY[j] = cy + Math.sin(ang) * rpx
        }

        let col: string
        if (closeP > 0.45) col = AMBER
        else if (closeP > 0.18) col = AMBER_DEEP
        else col = i % 5 === 0 ? BONE : COOL

        const shimmer = reduced ? 1 : 0.86 + 0.14 * Math.sin(timeSec * 1.3 + i * 0.7)
        const a = (0.05 + closeP * (0.42 + p * 0.16)) * shimmer
        ctx.strokeStyle = `rgba(${col}, ${a})`
        ctx.lineWidth = 0.8 + closeP * (1.4 + p * 0.8)

        ctx.beginPath()
        ctx.moveTo(ringX[0]!, ringY[0]!)
        for (let j = 1; j <= STEPS; j++) ctx.lineTo(ringX[j]!, ringY[j]!)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'

      // ====================================================================
      // 5. EVENT HORIZON — dead-black void + soft gravity-darkened halo
      // ====================================================================
      const halo = ctx.createRadialGradient(cx, cy, rh * 0.85, cx, cy, rh * 2.4)
      halo.addColorStop(0, 'rgba(0, 0, 0, 0.92)')
      halo.addColorStop(0.55, 'rgba(0, 0, 0, 0.55)')
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, rh * 2.4, 0, TWO_PI)
      ctx.fill()

      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(cx, cy, rh, 0, TWO_PI)
      ctx.fill()

      // ====================================================================
      // 6. RIM — a clean amber ring on the void's edge (the pile-up crown)
      // ====================================================================
      ctx.globalCompositeOperation = 'lighter'
      const bloom = ctx.createRadialGradient(cx, cy, rh * 0.95, cx, cy, rh * 1.85)
      bloom.addColorStop(0, `rgba(${AMBER}, 0)`)
      bloom.addColorStop(0.4, `rgba(${AMBER}, ${0.1 + p * 0.1})`)
      bloom.addColorStop(1, `rgba(${AMBER}, 0)`)
      ctx.fillStyle = bloom
      ctx.beginPath()
      ctx.arc(cx, cy, rh * 1.85, 0, TWO_PI)
      ctx.fill()

      // a hair-thin bone underline crisps the horizon edge under the amber
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgba(${BONE}, ${0.22 + p * 0.1})`
      ctx.beginPath()
      ctx.arc(cx, cy, rh * 0.995, 0, TWO_PI)
      ctx.stroke()

      const rimShimmer = reduced ? 1 : 0.9 + 0.1 * Math.sin(timeSec * 2.4)
      ctx.lineWidth = Math.max(1.2, rh * 0.05)
      ctx.strokeStyle = `rgba(${AMBER}, ${(0.5 + p * 0.22) * rimShimmer})`
      ctx.beginPath()
      ctx.arc(cx, cy, rh * 1.02, 0, TWO_PI)
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'

      // ====================================================================
      // 7. VIGNETTE — keep page edges dark/low-contrast for overlaid text
      // ====================================================================
      const vg = ctx.createRadialGradient(
        w / 2,
        h / 2,
        md * 0.34,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.78,
      )
      vg.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vg.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)
    },
  }
}
