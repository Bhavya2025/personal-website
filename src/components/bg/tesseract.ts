/**
 * TESSERACT — a wireframe 4D hypercube turning in deep space.
 *
 * Math
 * ----
 * • 16 vertices: every (±1, ±1, ±1, ±1). 32 edges: vertex pairs that differ in
 *   exactly one of the four coordinates (one bit of the 4-bit index).
 * • Rotation lives in 4D. A 4D rotation is a rotation in a 2-plane; we compose a
 *   few of them — XW + YZ as the hypnotic "inner" double-spin (this is what makes
 *   a tesseract look like it's turning inside-out), plus a gentle XY/ZW drift so
 *   the whole figure also tumbles in our 3-space.
 * • Projection is two perspective divides: 4D→3D divides by a viewer distance
 *   minus w (the cells nearest in the 4th dimension swell), then 3D→2D divides by
 *   a camera distance minus z. The per-vertex 2D scale doubles as the depth cue:
 *   nearer vertices draw brighter and thicker.
 * • Morph: occasionally the cube eases (smoothstep) toward a 16-cell
 *   (cross-polytope — the 4D dual, 8 vertices = the ±unit axes) and back. Edges
 *   that have no counterpart fade out, so it reads as a true polytope shift, not
 *   a blob.
 *
 * Scroll (home): descending speeds the inner spin and pushes the figure deeper
 *   into 4D (raises the w-bias) so it folds harder the further you fall; it also
 *   sinks toward screen-centre and dims slightly to stay behind the lower copy.
 * Mouse: adds parallax — the cursor tilts the 3-space orientation (yaw/pitch)
 *   and feeds a touch of XW rotation, so the hypercube leans toward the pointer
 *   and eases back when the cursor stops.
 *
 * Reduced motion: one calm, static three-quarter frame. No spin, no morph, no
 *   starfield twinkle, no per-frame allocation.
 */

import type { BgPainter, BgPage, BgMouse } from '../bgVariants'
import { mulberry32, PALETTE } from '../../lib/palette'

const AMBER = '255, 176, 0'
const BONE = '232, 228, 216'
const COOL = '120, 170, 255'

type Edge = readonly [number, number]
/** Projected vertex: screen x/y, plus a 0..1 depth (1 = nearest) for cueing. */
interface PV {
  x: number
  y: number
  depth: number
}

interface Star {
  x: number
  y: number
  r: number
  tw: number
  amber: boolean
}

/* ---- the two polytopes ------------------------------------------------- */

/** Tesseract: 16 corners at (±1,±1,±1,±1). */
function hypercubeVerts(): number[][] {
  const v: number[][] = []
  for (let i = 0; i < 16; i++) {
    v.push([
      i & 1 ? 1 : -1,
      i & 2 ? 1 : -1,
      i & 4 ? 1 : -1,
      i & 8 ? 1 : -1,
    ])
  }
  return v
}

/** Tesseract edges: indices differing in exactly one bit. */
function hypercubeEdges(): Edge[] {
  const e: Edge[] = []
  for (let i = 0; i < 16; i++) {
    for (let b = 0; b < 4; b++) {
      const j = i ^ (1 << b)
      if (j > i) e.push([i, j])
    }
  }
  return e
}

/**
 * 16-cell (cross-polytope), expressed over the SAME 16 indices so we can morph
 * vertex-for-vertex. Its 8 real vertices are the ±unit axes; we map each cube
 * corner onto the nearest axis vertex (sign of its dominant coord pattern), so
 * the cube's corners collapse pairwise onto the 8 axis points as it morphs.
 */
function crossVerts(): number[][] {
  const R = 1.45 // a touch larger so the dual reads clearly
  const axis = [
    [R, 0, 0, 0],
    [-R, 0, 0, 0],
    [0, R, 0, 0],
    [0, -R, 0, 0],
    [0, 0, R, 0],
    [0, 0, -R, 0],
    [0, 0, 0, R],
    [0, 0, 0, -R],
  ]
  const v: number[][] = []
  for (let i = 0; i < 16; i++) v.push(axis[i % 8]!.slice())
  return v
}

/* ---- 4D rotation helpers (rotate a vector in one coordinate plane) ------ */

function rot(v: number[], a: number, b: number, ang: number): void {
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  const va = v[a]!
  const vb = v[b]!
  v[a] = va * c - vb * s
  v[b] = va * s + vb * c
}

export function makeTesseract(ctx: CanvasRenderingContext2D, page: BgPage): BgPainter {
  const rand = mulberry32(page === 'home' ? 23 : 64)

  const cubeV = hypercubeVerts()
  const crossV = crossVerts()
  const edges = hypercubeEdges()
  // working buffers — reused every frame, never reallocated
  const N = cubeV.length
  const work: number[][] = Array.from({ length: N }, () => [0, 0, 0, 0])
  const proj: PV[] = Array.from({ length: N }, () => ({ x: 0, y: 0, depth: 0 }))

  // eased orientation state (mouse parallax settles back to centre)
  let yaw = 0
  let pitch = 0
  let xwBoost = 0

  // edge draw order, reused each frame (depth-sorted far→near, no per-frame alloc)
  const order: number[] = edges.map((_, i) => i)
  const edgeDepth: number[] = new Array(edges.length).fill(0)

  let stars: Star[] = []
  let W = 0
  let H = 0

  const buildStars = (w: number, h: number, reduced: boolean) => {
    W = w
    H = h
    const n = reduced ? 40 : Math.min(110, Math.round((w * h) / 16000))
    stars = Array.from({ length: n }, () => ({
      x: rand(),
      y: rand(),
      r: 0.3 + rand() * 0.9,
      tw: rand() * Math.PI * 2,
      amber: rand() > 0.86,
    }))
  }

  // smoothstep
  const ss = (t: number) => {
    const k = t < 0 ? 0 : t > 1 ? 1 : t
    return k * k * (3 - 2 * k)
  }

  return {
    resize(w, h, reduced) {
      buildStars(w, h, reduced)
    },

    paint(w, h, t, progress, reduced, mouse?: BgMouse) {
      if (w !== W || h !== H) buildStars(w, h, reduced)
      const p = page === 'home' ? progress : 0

      /* ---- background: near-black ink, faint vertical lift on descent ---- */
      const topB = 5 + p * 5
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, `rgb(${Math.round(topB)}, ${Math.round(topB)}, ${Math.round(topB + 4)})`)
      g.addColorStop(1, 'rgb(3, 3, 6)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      /* ---- starfield (cheap depth behind the figure) ---- */
      for (const s of stars) {
        const tw = reduced ? 0.7 : 0.55 + 0.45 * Math.sin(t * 1.3 + s.tw)
        ctx.globalAlpha = tw * (s.amber ? 0.5 : 0.4)
        ctx.fillStyle = s.amber ? PALETTE.amber : PALETTE.bone
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      /* ---- morph factor: dwell as a cube, brief eased trips to the 16-cell ---- */
      // period ~26s; morphed for a small slice of it (skip entirely if reduced)
      let morph = 0
      if (!reduced) {
        const cyc = (t / 26) % 1
        if (cyc > 0.62 && cyc < 0.82) morph = ss((cyc - 0.62) / 0.1) // ease in
        else if (cyc >= 0.82 && cyc < 0.92) morph = 1 - ss((cyc - 0.82) / 0.1) // ease out
      }

      /* ---- rotation angles ---- */
      // inner double-spin (the inside-out look); scroll quickens it on home
      const spin = reduced ? 0 : t
      const aXW = reduced ? 0.62 : spin * (0.34 + p * 0.5) + xwBoost
      const aYZ = reduced ? -0.4 : spin * (0.27 + p * 0.32)
      const aZW = reduced ? 0.0 : spin * 0.11
      // outer tumble in our 3-space (kept slow); the static frame uses fixed
      // three-quarter angles so it still reads as a 4-cube, not a flat square
      const aXY = reduced ? 0.5 : spin * 0.05

      /* ---- mouse parallax → eased yaw/pitch/xw lean ---- */
      const tgtYaw = mouse && mouse.active ? (mouse.x / w - 0.5) * 0.9 : 0
      const tgtPitch = mouse && mouse.active ? (mouse.y / h - 0.5) * 0.7 : 0
      const tgtXW = mouse && mouse.active ? (mouse.x / w - 0.5) * 0.6 : 0
      const k = reduced ? 1 : 0.06
      yaw += (tgtYaw - yaw) * k
      pitch += (tgtPitch - pitch) * k
      xwBoost += (tgtXW - xwBoost) * k

      /* ---- transform every vertex: morph → 4D rotate → 4D→3D → 3D→2D ---- */
      const cx = w / 2
      // figure sinks toward centre as you descend on home; centred elsewhere
      const cyFrac = page === 'home' ? 0.46 + p * 0.06 : 0.5
      const cy = h * cyFrac
      // keep it modest — lots of dark space around it
      const scale = Math.min(w, h) * 0.165
      const w4Dist = 2.6 - p * 0.5 // smaller ⇒ deeper into 4D ⇒ folds harder
      const z3Dist = 4.2

      const cyaw = Math.cos(yaw)
      const syaw = Math.sin(yaw)
      const cpit = Math.cos(pitch)
      const spit = Math.sin(pitch)

      for (let i = 0; i < N; i++) {
        const ci = cubeV[i]!
        const xi = crossV[i]!
        const v = work[i]!
        // interpolate cube → cross
        v[0] = ci[0]! + (xi[0]! - ci[0]!) * morph
        v[1] = ci[1]! + (xi[1]! - ci[1]!) * morph
        v[2] = ci[2]! + (xi[2]! - ci[2]!) * morph
        v[3] = ci[3]! + (xi[3]! - ci[3]!) * morph

        // 4D rotations
        rot(v, 0, 3, aXW) // X–W
        rot(v, 1, 2, aYZ) // Y–Z
        rot(v, 2, 3, aZW) // Z–W
        rot(v, 0, 1, aXY) // X–Y

        // 4D → 3D perspective (divide by distance along w)
        const wf = 1 / (w4Dist - v[3]!)
        let x = v[0]! * wf * w4Dist
        let y = v[1]! * wf * w4Dist
        let z = v[2]! * wf * w4Dist

        // mouse-eased 3-space tilt (yaw about Y, then pitch about X)
        const x1 = x * cyaw + z * syaw
        const z1 = -x * syaw + z * cyaw
        const y2 = y * cpit - z1 * spit
        const z2 = y * spit + z1 * cpit
        x = x1
        y = y2
        z = z2

        // 3D → 2D perspective
        const zf = 1 / (z3Dist - z)
        const pv = proj[i]!
        pv.x = cx + x * zf * z3Dist * scale
        pv.y = cy + y * zf * z3Dist * scale
        // depth cue 0..1 from the projected scale (nearer ⇒ bigger zf)
        pv.depth = Math.min(1, Math.max(0, (zf * z3Dist - 0.7) / 0.9))
      }

      /* ---- amber core glow where the figure sits ---- */
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 2.1)
      glow.addColorStop(0, `rgba(${AMBER}, ${0.07 + (reduced ? 0 : 0.025 * Math.sin(t * 0.8))})`)
      glow.addColorStop(1, `rgba(${AMBER}, 0)`)
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      /* ---- edges, depth-sorted far→near so near ones overlay ---- */
      // reuse pre-allocated buffers: compute mean depth, sort indices in place
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i]!
        edgeDepth[i] = (proj[e[0]]!.depth + proj[e[1]]!.depth) * 0.5
      }
      order.sort((a, b) => edgeDepth[a]! - edgeDepth[b]!)

      ctx.lineCap = 'round'
      for (const oi of order) {
        const e = edges[oi]!
        const a = proj[e[0]]!
        const b = proj[e[1]]!
        const dep = edgeDepth[oi]!
        // morphing edges whose endpoints collapsed together vanish gracefully
        const elen = Math.hypot(a.x - b.x, a.y - b.y)
        let pres = 1
        if (morph > 0.001) {
          // when nearly fully a 16-cell, only short axis-spanning edges survive;
          // fade any edge that has shrunk toward a point
          pres = Math.min(1, elen / (scale * 0.5))
          pres = 1 - morph * (1 - pres)
        }
        if (pres < 0.02) continue

        const bright = 0.18 + dep * 0.62
        const lw = (0.6 + dep * 1.4) * (page === 'home' ? 1 - p * 0.18 : 1)
        ctx.lineWidth = lw
        // near edges amber, far edges cool-steel — instrument depth read
        const col = dep > 0.55 ? AMBER : COOL
        ctx.strokeStyle = `rgba(${col}, ${bright * pres})`
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      ctx.lineCap = 'butt'

      /* ---- vertices: small bone dots, nearest ones flare amber ---- */
      for (let i = 0; i < N; i++) {
        const pv = proj[i]!
        const dep = pv.depth
        if (dep > 0.72) {
          ctx.fillStyle = `rgba(${AMBER}, ${0.6 + dep * 0.35})`
          ctx.shadowColor = `rgba(${AMBER}, 0.8)`
          ctx.shadowBlur = 8 + dep * 6
        } else {
          ctx.fillStyle = `rgba(${BONE}, ${0.3 + dep * 0.4})`
        }
        ctx.beginPath()
        ctx.arc(pv.x, pv.y, 0.9 + dep * 1.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      /* ---- dark vignette so bone/amber copy stays readable on top ---- */
      const vg = ctx.createRadialGradient(
        cx,
        cy,
        Math.min(w, h) * 0.32,
        cx,
        cy,
        Math.max(w, h) * 0.78,
      )
      vg.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vg.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)
    },
  }
}
