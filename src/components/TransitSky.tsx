import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mulberry32, PALETTE } from '../lib/palette'

gsap.registerPlugin(ScrollTrigger)

const DPR_CAP = 2

/** Lerp between two rgb triples. */
function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(
    a[1] + (b[1] - a[1]) * t,
  )}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`
}

/** Projects-page backdrop: a quiet starfield. */
function TransitSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rand = mulberry32(99)
    const stars = Array.from({ length: 150 }, () => ({
      x: rand(),
      y: rand(),
      r: 0.3 + rand() * 0.7,
      tw: rand() * Math.PI * 2,
    }))
    const progress = { value: 0 }
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
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
      },
    })

    const SPACE: [number, number, number] = [2, 2, 6]
    const DEEP: [number, number, number] = [5, 6, 14]

    const paint = (timeSec: number) => {
      const p = progress.value

      // base: black transit space, deepening slightly with the journey
      ctx.fillStyle = mix(SPACE, DEEP, Math.max(0, (p - 0.6) / 0.4))
      ctx.fillRect(0, 0, w, h)

      // stars all the way through transit
      ctx.save()
      for (const s of stars) {
        const twinkle = reduced ? 1 : 0.7 + 0.3 * Math.sin(timeSec * 1.5 + s.tw)
        ctx.globalAlpha = 0.8 * twinkle
        ctx.fillStyle = s.r > 0.92 ? PALETTE.amber : PALETTE.bone
        ctx.beginPath()
        ctx.arc(s.x * w, ((s.y - p * 0.25 + 1) % 1) * h, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

    }

    const tick = (time: number) => paint(reduced ? 0 : time)
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      trigger.kill()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas className="sky" ref={canvasRef} aria-hidden="true" />
}

export default TransitSky
