import { useEffect, useRef } from 'react'

/**
 * Boids flocking sim — ported from Bhavya's p5.js prototype to a
 * dependency-free canvas. Reynolds' three rules (align / cohere / separate)
 * plus a flee-from-cursor force. Pauses off-screen, caps DPR at 2, and
 * renders a single static frame under prefers-reduced-motion.
 */

const MAX_SPEED = 4
const MAX_FORCE = 0.2
const PERCEPTION = 50
const SEP_RADIUS = 28
const FLEE_RADIUS = 90

class Boid {
  x: number
  y: number
  vx: number
  vy: number
  ax = 0
  ay = 0

  constructor(w: number, h: number, rand: () => number) {
    this.x = rand() * w
    this.y = rand() * h
    const a = rand() * Math.PI * 2
    const m = 2 + rand() * 2
    this.vx = Math.cos(a) * m
    this.vy = Math.sin(a) * m
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

  draw(ctx: CanvasRenderingContext2D) {
    const a = Math.atan2(this.vy, this.vx)
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(a)
    ctx.beginPath()
    ctx.moveTo(7, 0)
    ctx.lineTo(-5, 4)
    ctx.lineTo(-5, -4)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
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

function BoidsSim() {
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

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(28, Math.min(90, Math.round((w * h) / 9000)))
      if (!boids.length) boids = Array.from({ length: count }, () => new Boid(w, h, rand))
    }

    const paint = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#ffb000'
      ctx.shadowColor = 'rgba(255,176,0,0.6)'
      ctx.shadowBlur = 6
      for (const b of boids) b.draw(ctx)
      ctx.shadowBlur = 0
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
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div className="boids" aria-hidden="true">
      <canvas ref={canvasRef} className="boids__canvas" />
      <span className="boids__tag">LIVE · move your cursor</span>
    </div>
  )
}

export default BoidsSim
