import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sampleSky, mulberry32, PALETTE } from '../lib/palette'

gsap.registerPlugin(ScrollTrigger)

interface Star {
  x: number
  y: number
  r: number
  tw: number
}

interface CloudBlob {
  x: number
  y: number
  rx: number
  ry: number
}

interface CloudBand {
  /** descent progress where the band lives (fades in/out around it) */
  at: number
  speed: number
  alpha: number
  blobs: CloudBlob[]
}

const STAR_COUNT = 130
const DPR_CAP = 2

function makeStars(seed: number): Star[] {
  const rand = mulberry32(seed)
  return Array.from({ length: STAR_COUNT }, () => ({
    x: rand(),
    y: rand(),
    r: 0.3 + rand() * 0.7,
    tw: rand() * Math.PI * 2,
  }))
}

function makeBands(seed: number): CloudBand[] {
  const rand = mulberry32(seed)
  const band = (at: number, speed: number, alpha: number, n: number): CloudBand => ({
    at,
    speed,
    alpha,
    blobs: Array.from({ length: n }, () => ({
      x: rand() * 1.4 - 0.2,
      y: rand(),
      rx: 0.08 + rand() * 0.16,
      ry: 0.015 + rand() * 0.03,
    })),
  })
  return [band(0.55, 14, 0.05, 9), band(0.72, 26, 0.08, 11), band(0.88, 42, 0.06, 8)]
}

/**
 * The descent spine: a fixed full-viewport canvas behind everything.
 * One scrubbed ScrollTrigger writes progress; one gsap.ticker callback
 * repaints only when something changed. prefers-reduced-motion gets a
 * static frame.
 */
function SkyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stars = makeStars(7)
    const bands = makeBands(42)
    const progress = { value: 0 }
    let needsPaint = true
    let lastPainted = -1
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      needsPaint = true
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      scrub: true,
      onUpdate: (self) => {
        progress.value = self.progress
        needsPaint = true
      },
    })

    const paint = (timeSec: number) => {
      const p = progress.value

      // sky gradient
      const sky = sampleSky(p)
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, sky.top)
      grad.addColorStop(0.55, sky.mid)
      grad.addColorStop(1, sky.bottom)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // stars: bright in space, gone by the stratosphere
      const starAlpha = Math.max(0, 1 - p * 1.8)
      if (starAlpha > 0.01) {
        ctx.save()
        for (const s of stars) {
          const twinkle = reduced ? 1 : 0.7 + 0.3 * Math.sin(timeSec * 1.5 + s.tw)
          ctx.globalAlpha = starAlpha * twinkle * 0.75
          ctx.fillStyle = s.r > 0.92 ? PALETTE.amber : PALETTE.bone
          // stars drift up slightly as you descend (parallax)
          const sy = (s.y - p * 0.35 + 1) % 1
          ctx.beginPath()
          ctx.arc(s.x * w, sy * h, s.r, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // atmosphere horizon glow rises with descent
      const glowStrength = Math.sin(Math.min(1, p * 1.4) * Math.PI) * 0.35
      if (glowStrength > 0.01) {
        const gy = h * (1.15 - p * 0.25)
        const glow = ctx.createRadialGradient(w / 2, gy, 0, w / 2, gy, h * 0.9)
        glow.addColorStop(0, `rgba(120, 170, 255, ${glowStrength})`)
        glow.addColorStop(1, 'rgba(120, 170, 255, 0)')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, w, h)
      }

      // cloud bands: each lives around its `at` progress
      for (const band of bands) {
        const dist = Math.abs(p - band.at)
        const alpha = Math.max(0, 1 - dist * 6) * band.alpha
        if (alpha <= 0.004) continue
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = PALETTE.bone
        const drift = reduced ? 0 : (timeSec * band.speed) % (w * 1.4)
        for (const blob of band.blobs) {
          // vertical position slides through the viewport as you pass the band
          const by = (0.5 + (band.at - p) * 4) * h + blob.y * h * 0.3
          if (by < -60 || by > h + 60) continue
          const bx = ((blob.x * w + drift) % (w * 1.4)) - w * 0.2
          ctx.beginPath()
          ctx.ellipse(bx, by, blob.rx * w, blob.ry * h, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // soft daylight haze near the ground
      const hazeStrength = Math.max(0, (p - 0.9) / 0.1) * 0.5
      if (hazeStrength > 0.01) {
        const fl = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.6)
        fl.addColorStop(0, `rgba(255, 255, 255, ${hazeStrength * 0.35})`)
        fl.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = fl
        ctx.fillRect(0, 0, w, h)
      }
    }

    if (reduced) {
      // static frame, repainted only on scroll/resize
      const tick = () => {
        if (!needsPaint && lastPainted === progress.value) return
        lastPainted = progress.value
        needsPaint = false
        paint(0)
      }
      gsap.ticker.add(tick)
      return () => {
        gsap.ticker.remove(tick)
        trigger.kill()
        window.removeEventListener('resize', resize)
      }
    }

    const tick = (time: number) => {
      // stars twinkle + clouds drift → always repaint while visible;
      // cheap (one gradient + ~200 arcs)
      void needsPaint
      paint(time)
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      trigger.kill()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas className="sky" ref={canvasRef} aria-hidden="true" />
}

export default SkyCanvas
