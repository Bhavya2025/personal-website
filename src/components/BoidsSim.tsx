import { useEffect, useRef } from 'react'

/**
 * Boids flocking sim — ported from Bhavya's p5.js prototype to a
 * dependency-free canvas. Reynolds' three rules (align / cohere / separate)
 * plus a flee-from-cursor force. Pauses off-screen, caps DPR at 2, and
 * renders a single static frame under prefers-reduced-motion.
 */

const MAX_SPEED = 1.9
const MAX_FORCE = 0.1
const PERCEPTION = 56
const SEP_RADIUS = 26
const FLEE_RADIUS = 90

// Canada-goose colouring. Body is a pale buff/grey, wings + head/neck are near
// black (the iconic dark hood) with a white cheek "chinstrap" patch and a pale
// tail-band. A muted dusk-sky backdrop (on-brand with the site's slate-blue
// dusk) keeps the dark wings reading as real silhouettes instead of vanishing
// on a near-black card; a thin darker outline keeps features crisp on the sky.
const SKY_TOP = 'rgb(52, 64, 84)'
const SKY_BOT = 'rgb(112, 126, 150)'
const GOOSE_BODY = '#eef0ec' // pale breast / body highlight
const GOOSE_GREY = '#b9bdc4' // soft grey back/flank shade
const GOOSE_DARK = '#0b0d11' // black hood + wings + tail
const GOOSE_LINE = '#05070a' // thin outline so features read on the sky
const GOOSE_CHEEK = '#f4f6f3' // white cheek/chinstrap + tail band

// Below this drawn body length (px) we drop the finest details (cheek patch,
// flank shade, wingtip fingers) so the small home thumbnail stays crisp instead
// of turning to mush. ~4.4*s body half-length, so s>~1.1 keeps full detail.
const DETAIL_MIN = 5.2

class Boid {
  x: number
  y: number
  vx: number
  vy: number
  ax = 0
  ay = 0
  wingPhase: number

  constructor(w: number, h: number, rand: () => number) {
    this.x = rand() * w
    this.y = rand() * h
    const a = rand() * Math.PI * 2
    const m = 1 + rand()
    this.vx = Math.cos(a) * m
    this.vy = Math.sin(a) * m
    this.wingPhase = rand() * Math.PI * 2
  }

  flock(boids: Boid[], mx: number, my: number) {
    let ax = 0
    let ay = 0 // alignment
    let cx = 0
    let cy = 0 // cohesion
    let sx = 0
    let sy = 0 // separation
    let nAlign = 0
    let nCohere = 0
    let nSep = 0

    for (const o of boids) {
      if (o === this) continue
      const dx = this.x - o.x
      const dy = this.y - o.y
      const d = Math.hypot(dx, dy)
      if (d < PERCEPTION) {
        ax += o.vx
        ay += o.vy
        nAlign++
        cx += o.x
        cy += o.y
        nCohere++
      }
      if (d > 0 && d < SEP_RADIUS) {
        sx += dx / d
        sy += dy / d
        nSep++
      }
    }

    this.ax = 0
    this.ay = 0
    if (nAlign) this.steer(ax / nAlign, ay / nAlign)
    if (nCohere) this.steer(cx / nCohere - this.x, cy / nCohere - this.y)
    if (nSep) this.steer(sx / nSep, sy / nSep, 1.4)

    // flee the cursor
    if (mx >= 0) {
      const dx = this.x - mx
      const dy = this.y - my
      const d = Math.hypot(dx, dy)
      if (d > 0 && d < FLEE_RADIUS) this.steer(dx / d, dy / d, 2.2)
    }
  }

  /** Add a steering force toward a desired direction (Reynolds). */
  private steer(dirX: number, dirY: number, weight = 1) {
    const m = Math.hypot(dirX, dirY)
    if (m === 0) return
    let fx = (dirX / m) * MAX_SPEED - this.vx
    let fy = (dirY / m) * MAX_SPEED - this.vy
    const fm = Math.hypot(fx, fy)
    const cap = MAX_FORCE * weight
    if (fm > cap) {
      fx = (fx / fm) * cap
      fy = (fy / fm) * cap
    }
    this.ax += fx
    this.ay += fy
  }

  update(w: number, h: number) {
    this.vx += this.ax
    this.vy += this.ay
    const m = Math.hypot(this.vx, this.vy)
    if (m > MAX_SPEED) {
      this.vx = (this.vx / m) * MAX_SPEED
      this.vy = (this.vy / m) * MAX_SPEED
    }
    this.x += this.vx
    this.y += this.vy
    // wrap edges
    if (this.x > w) this.x = 0
    else if (this.x < 0) this.x = w
    if (this.y > h) this.y = 0
    else if (this.y < 0) this.y = h
  }

  /** Top-down Canada goose with flapping wings; `t` (s) drives the wing-beat,
   * `s` scales the whole bird. Wings beat slightly out of phase so they don't
   * look mechanical — sometimes one wing leads the other.
   *
   * Anatomy (nose points +x, travel direction):
   *   - tapered tail (dark wedge) at the back
   *   - pale buff body, soft grey flanks
   *   - long forward neck → defined head with a stubby bill
   *   - black hood over head+neck with a white cheek "chinstrap" patch
   *   - swept-back wings with a hard leading edge + wingtip "fingers"
   * Finest details (cheek patch, flank shade, fingers) gate on size so the
   * little home thumbnail reads clean instead of muddy. */
  draw(ctx: CanvasRenderingContext2D, t: number, s: number) {
    const ang = Math.atan2(this.vy, this.vx)
    const beat = 6 + Math.hypot(this.vx, this.vy) * 1.5 // faster geese flap faster
    const flapL = 0.5 + 0.5 * Math.sin(t * beat + this.wingPhase)
    const flapR = 0.5 + 0.5 * Math.sin(t * beat + this.wingPhase + 0.7)
    const fine = s >= DETAIL_MIN / 4.4 // true at card scale, false on the thumbnail

    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(ang)

    // tapered dark tail wedge trailing behind the body
    ctx.fillStyle = GOOSE_DARK
    ctx.beginPath()
    ctx.moveTo(-3.2 * s, -1.3 * s)
    ctx.lineTo(-6.4 * s, 0)
    ctx.lineTo(-3.2 * s, 1.3 * s)
    ctx.closePath()
    ctx.fill()

    // wings (drawn under the body so the body sits on top of the wing roots)
    this.wing(ctx, s, 1, flapL, fine)
    this.wing(ctx, s, -1, flapR, fine)

    // body — pale buff ellipse along travel, slightly fuller at the chest
    ctx.fillStyle = GOOSE_BODY
    ctx.beginPath()
    ctx.ellipse(0.4 * s, 0, 4.4 * s, 1.9 * s, 0, 0, Math.PI * 2)
    ctx.fill()

    // soft grey flank/back shade laid over the rear half of the body
    if (fine) {
      ctx.fillStyle = GOOSE_GREY
      ctx.beginPath()
      ctx.ellipse(-1.4 * s, 0, 2.9 * s, 1.6 * s, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // long forward neck → defined head with a stubby bill (the dark hood)
    ctx.fillStyle = GOOSE_DARK
    ctx.beginPath()
    ctx.ellipse(4.6 * s, 0, 2.4 * s, 0.85 * s, 0, 0, Math.PI * 2) // neck
    ctx.fill()
    ctx.beginPath()
    ctx.arc(6.9 * s, 0, 1.15 * s, 0, Math.PI * 2) // head
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(7.9 * s, -0.5 * s) // bill
    ctx.lineTo(8.9 * s, 0)
    ctx.lineTo(7.9 * s, 0.5 * s)
    ctx.closePath()
    ctx.fill()

    // white cheek "chinstrap" — the iconic Canada-goose tell. Two small patches
    // hugging the head, one per side (top-down you see both cheeks).
    if (fine) {
      ctx.fillStyle = GOOSE_CHEEK
      ctx.beginPath()
      ctx.ellipse(7.1 * s, -0.85 * s, 0.62 * s, 0.42 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(7.1 * s, 0.85 * s, 0.62 * s, 0.42 * s, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  /** One swept wing; `flap` 0 (folded back) → 1 (spread on the down-stroke).
   * `fine` adds a paler trailing edge + wingtip "finger" notches when there's
   * enough scale to see them. Built from a hard leading edge (shoulder→tip) and
   * a curved trailing edge back to the root, so it reads as a real wing. */
  private wing(
    ctx: CanvasRenderingContext2D,
    s: number,
    side: number,
    flap: number,
    fine: boolean,
  ) {
    const out = (3 + flap * 5.6) * s // span out to the side
    const back = (4.8 - flap * 2.6) * s // how far the tip trails back
    const tipX = -back
    const tipY = side * out

    // wing membrane: straight leading edge out to the tip, curved trailing edge
    // back to the rear root
    ctx.fillStyle = GOOSE_DARK
    ctx.beginPath()
    ctx.moveTo(2.4 * s, side * 0.8 * s) // shoulder (leading root)
    ctx.lineTo(tipX, tipY) // hard leading edge → wingtip
    if (fine) {
      // splayed primary "fingers" at the tip — three little notches
      ctx.lineTo(tipX - 0.5 * s, tipY - side * 0.55 * s)
      ctx.lineTo(tipX + 0.6 * s, tipY - side * 0.7 * s)
      ctx.lineTo(tipX + 0.2 * s, tipY - side * 1.3 * s)
      ctx.lineTo(tipX + 1.6 * s, tipY - side * 1.4 * s)
    }
    ctx.quadraticCurveTo(0.2 * s, side * out * 0.45, -3.6 * s, side * 0.6 * s) // trailing edge → rear root
    ctx.closePath()
    ctx.globalAlpha = 0.94
    ctx.fill()

    // thin highlighted leading edge so the wing's front reads on the dark sky
    if (fine) {
      ctx.strokeStyle = GOOSE_LINE
      ctx.lineWidth = 0.4 * s
      ctx.beginPath()
      ctx.moveTo(2.4 * s, side * 0.8 * s)
      ctx.lineTo(tipX, tipY)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
}

// Seeded PRNG (mulberry32) so the initial layout is stable across mounts.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** `interactive=false` (home thumbnail): no cursor-flee, no caption — just the
 * flock drifting on its own. */
function BoidsSim({ interactive = true }: { interactive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const mouse = { x: -1, y: -1 }

    const rand = mulberry32(0x9e3779b9)
    let boids: Boid[] = []
    // geese are bigger than the old triangles → bigger in the full card,
    // small in the home thumbnail so they don't crowd the little box.
    const gscale = interactive ? 1.15 : 0.62

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // fewer, calmer geese — and fewer still in the small home thumbnail
      const count = interactive
        ? Math.max(20, Math.min(54, Math.round((w * h) / 13000)))
        : Math.max(7, Math.min(14, Math.round((w * h) / 4200)))
      if (!boids.length) boids = Array.from({ length: count }, () => new Boid(w, h, rand))
    }

    const paint = () => {
      const t = performance.now() / 1000
      ctx.clearRect(0, 0, w, h)
      // muted dusk sky so the white/black geese read as silhouettes
      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, SKY_TOP)
      sky.addColorStop(1, SKY_BOT)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)
      for (const b of boids) b.draw(ctx, t, gscale)
    }

    const step = () => {
      for (const b of boids) b.flock(boids, mouse.x, mouse.y)
      for (const b of boids) b.update(w, h)
      paint()
    }

    resize()

    if (reduced) {
      paint() // single static frame, no animation
      return
    }

    let running = false
    let raf = 0
    const loop = () => {
      step()
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // only animate while the card is on screen
    const io = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { threshold: 0.05 },
    )
    io.observe(canvas)

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -1
      mouse.y = -1
    }
    // cursor-flee only when interactive (the home thumbnail just drifts)
    if (interactive) {
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerleave', onLeave)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [interactive])

  return (
    <div className={`boids ${interactive ? '' : 'boids--mini'}`} aria-hidden="true">
      <canvas ref={canvasRef} className="boids__canvas" />
      {interactive ? <span className="boids__tag">LIVE · move your cursor</span> : null}
    </div>
  )
}

export default BoidsSim
