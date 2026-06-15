/**
 * TEMPORARY (preview) — WebGL2 backdrop for the real-GLSL background variants.
 *
 * Mounted by SkyCanvas / TransitSky only when the active variant is a GL one
 * (bgStore.isGlVariant). Owns: a fixed full-viewport canvas, a WebGL2 context,
 * DPR-capped + per-scene-quality sizing, a single scrubbed ScrollTrigger
 * (home) feeding uProgress, cursor → iMouse, a gsap.ticker render loop, a
 * prefers-reduced-motion branch (frozen frame, repaint only on scroll/resize/
 * variant), and StrictMode-safe teardown. Live variant switching rebuilds the
 * scene program in place.
 *
 * Delete with the rest of the bg-preview system once a background is chosen.
 */

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { bgStore, isGlVariant, subscribeBgVariant } from './bgStore'
import { makeGlScene, type GlScene } from './gl/glScenes'
import type { BgPage } from './bgVariants'

gsap.registerPlugin(ScrollTrigger)

const DPR_CAP = 2
const FROZEN_TIME = 6.0 // a pleasant static frame for reduced-motion

function GlSky({ page }: { page: BgPage }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
    if (!gl) {
      // WebGL2 unsupported — leave a calm dark canvas rather than erroring.
      const ctx2d = canvas.getContext('2d')
      if (ctx2d) {
        ctx2d.fillStyle = '#050509'
        ctx2d.fillRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let bw = 0
    let bh = 0
    const progress = { value: page === 'home' ? 0 : 0.3 }
    let dirty = true

    // cursor in CSS px (flipped to buffer/bottom-up at render time)
    const mouse = { x: -1, y: -1 }
    let lastMove = -10

    let scene: GlScene = makeGlScene(gl, bgStore.current, page)

    const qualityFor = (): number => (bgStore.current === 'synthwave' ? 0.66 : 1)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP) * qualityFor()
      w = window.innerWidth
      h = window.innerHeight
      bw = Math.max(1, Math.round(w * dpr))
      bh = Math.max(1, Math.round(h * dpr))
      canvas.width = bw
      canvas.height = bh
      dirty = true
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      lastMove = gsap.ticker.time
      dirty = true
    }
    if (!reduced) window.addEventListener('pointermove', onMove, { passive: true })

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      scrub: true,
      onUpdate: (self) => {
        if (page === 'home') {
          progress.value = self.progress
          dirty = true
        }
      },
    })

    const unsub = subscribeBgVariant((v) => {
      if (!isGlVariant(v)) return // parent (SkyCanvas) will unmount us
      scene.dispose()
      scene = makeGlScene(gl, v, page)
      resize() // re-apply per-scene quality
      dirty = true
    })

    let last = gsap.ticker.time
    const renderFrame = (time: number, animate: boolean) => {
      const dt = Math.min(0.05, Math.max(0, time - last))
      last = time
      const active = !reduced && time - lastMove < 0.4
      const mx = active ? (mouse.x / Math.max(1, w)) * bw : 0
      const my = active ? (1 - mouse.y / Math.max(1, h)) * bh : 0 // bottom-up
      scene.render({
        w: bw,
        h: bh,
        timeSec: animate ? time : FROZEN_TIME,
        dtSec: animate ? dt : 0,
        progress: progress.value,
        reduced,
        mouseX: mx,
        mouseY: my,
        mouseDown: active,
      })
    }

    if (reduced) {
      // Repaint only when something actually changed (scroll/resize/variant).
      const tick = (time: number) => {
        if (!dirty) return
        dirty = false
        renderFrame(time, false)
      }
      gsap.ticker.add(tick)
      return () => {
        gsap.ticker.remove(tick)
        unsub()
        trigger.kill()
        window.removeEventListener('resize', resize)
        scene.dispose()
      }
    }

    const tick = (time: number) => renderFrame(time, true)
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      unsub()
      trigger.kill()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      scene.dispose()
    }
  }, [page])

  return <canvas className="sky" ref={canvasRef} aria-hidden="true" />
}

export default GlSky
