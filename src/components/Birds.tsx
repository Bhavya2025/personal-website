import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface DriftBird {
  x: number
  baseY: number
  size: number
  speed: number
  dir: 1 | -1
  bobAmp: number
  bobFreq: number
  flapFreq: number
  phase: number
}

const DPR_CAP = 2

/**
 * Simple ambient birds: each spawns off-screen left or right at a random
 * height/size/speed, glides across with a gentle bob and wing flap, and
 * respawns from a random side. No flocking — just sky life.
 */
function Birds() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.matchMedia('(max-width: 720px)').matches
    const COUNT = mobile ? 6 : 10

    let w = 0
    let h = 0
    let visible = false

    const spawn = (offscreen: boolean): DriftBird => {
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1
      const size = 0.6 + Math.random() * 1.0
      return {
        // start anywhere when seeding; from off-screen on respawn
        x: offscreen
          ? dir === 1
            ? -30 - Math.random() * w * 0.5
            : w + 30 + Math.random() * w * 0.5
          : Math.random() * w,
        baseY: (0.06 + Math.random() * 0.42) * h,
        size,
        speed: (26 + Math.random() * 40) * (0.7 + size * 0.4),
        dir,
        bobAmp: 3 + Math.random() * 7,
        bobFreq: 0.8 + Math.random() * 1.2,
        flapFreq: 6 + Math.random() * 5,
        phase: Math.random() * Math.PI * 2,
      }
    }

    let birds: DriftBird[] = []

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (birds.length === 0) {
        birds = Array.from({ length: COUNT }, () => spawn(false))
      }
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false
      },
      { threshold: 0.05 },
    )
    observer.observe(canvas)

    const drawBird = (b: DriftBird, timeSec: number) => {
      const y = b.baseY + Math.sin(timeSec * b.bobFreq + b.phase) * b.bobAmp
      const flap = reduced ? 0.2 : Math.sin(timeSec * b.flapFreq + b.phase) * 0.45
      const len = 5 * b.size
      ctx.globalAlpha = 0.45 + Math.min(b.size, 1.1) * 0.4
      ctx.lineWidth = 1.3 * b.size
      ctx.beginPath()
      // gull silhouette: two wing strokes from the body point
      ctx.moveTo(b.x - len, y + Math.sin(2.6 + flap) * len * 0.7)
      ctx.quadraticCurveTo(b.x - len * 0.3, y - len * 0.25, b.x, y)
      ctx.quadraticCurveTo(b.x + len * 0.3, y - len * 0.25, b.x + len, y + Math.sin(2.6 + flap) * len * 0.7)
      ctx.stroke()
    }

    const tick = (time: number, deltaMS: number) => {
      if (!visible) return
      const dt = Math.min(deltaMS / 1000, 0.05)
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(16, 24, 38, 0.9)'
      ctx.lineCap = 'round'
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i]!
        if (!reduced) b.x += b.dir * b.speed * dt
        if ((b.dir === 1 && b.x > w + 40) || (b.dir === -1 && b.x < -40)) {
          birds[i] = spawn(true)
          continue
        }
        drawBird(b, reduced ? 0 : time)
      }
      ctx.globalAlpha = 1
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      observer.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas className="surface__birds" ref={canvasRef} aria-hidden="true" />
}

export default Birds
