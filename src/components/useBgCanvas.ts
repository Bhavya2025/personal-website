/**
 * TEMPORARY (preview) — shared canvas driver for the background variants.
 *
 * Both SkyCanvas (home) and TransitSky (projects) use this so the wiring lives
 * once: DPR-capped sizing, a single scrubbed ScrollTrigger writing progress, a
 * gsap.ticker paint loop, prefers-reduced-motion branch, StrictMode-safe
 * teardown, and LIVE variant switching via the bgStore subscription (it just
 * rebuilds the painter in place — no remount).
 *
 * When a winner is picked, fold the chosen painter back into the two canvas
 * components directly and delete this hook + bgStore + bgVariants + BgSwitcher.
 */

import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { bgStore, subscribeBgVariant } from './bgStore'
import { makePainter, type BgPage, type BgPainter } from './bgVariants'

gsap.registerPlugin(ScrollTrigger)

const DPR_CAP = 2

export function useBgCanvas(canvasRef: RefObject<HTMLCanvasElement | null>, page: BgPage): void {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const progress = { value: 0 }
    let w = 0
    let h = 0
    let needsPaint = true

    // pointer (viewport px = canvas px since the canvas is full-viewport fixed);
    // some variants use it to repel/attract. `active` decays so the field
    // settles back when the cursor goes still.
    const mouse = { x: -1, y: -1, active: false }
    let lastMove = -10
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      lastMove = gsap.ticker.time
      mouse.active = true
    }
    if (!reduced) window.addEventListener('pointermove', onMove, { passive: true })

    let painter: BgPainter = makePainter(bgStore.current, ctx, page)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      painter.resize(w, h, reduced)
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

    // Live variant switch: rebuild the painter against the current ctx/page and
    // give it the current size, then force a repaint.
    const unsub = subscribeBgVariant((v) => {
      painter = makePainter(v, ctx, page)
      painter.resize(w, h, reduced)
      needsPaint = true
    })

    if (reduced) {
      // Static frame: only repaint when scroll/resize/variant changes.
      let lastP = -1
      const tick = () => {
        if (!needsPaint && lastP === progress.value) return
        lastP = progress.value
        needsPaint = false
        painter.paint(w, h, 0, progress.value, true)
      }
      gsap.ticker.add(tick)
      return () => {
        gsap.ticker.remove(tick)
        unsub()
        trigger.kill()
        window.removeEventListener('resize', resize)
        window.removeEventListener('pointermove', onMove)
      }
    }

    const tick = (time: number) => {
      void needsPaint
      // the cursor's influence fades ~0.4s after it stops moving
      mouse.active = time - lastMove < 0.4
      painter.paint(w, h, time, progress.value, false, mouse)
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      unsub()
      trigger.kill()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [canvasRef, page])
}
