/**
 * DomBlackhole — a cursor-following "DOM black hole" easter egg.
 *
 * A true-black disc with a thin amber rim that LAG-follows the pointer and bends
 * the whole scene around itself like a gravitational lens — the background
 * canvas AND every page element curve/wrap toward it, and the closest elements
 * are briefly "swallowed" (pulled in + faded). Everything is restored exactly
 * when the hole moves on, and torn down fully when toggled off. Non-destructive:
 * no DOM node is ever removed.
 *
 * THE LENS (why it curves instead of doing a boxy pinch)
 *   feDisplacementMap moves each pixel by  scale*(R-0.5)  in x and  scale*(G-0.5)
 *   in y. A grayscale radial gradient sets R==G, giving a constant DIAGONAL push
 *   (the old "boxy" bug). Instead we bake a real VECTOR field: at lens offset
 *   (u,v), R encodes the X-component and G the Y-component of a RADIAL
 *   displacement (plus a tangential swirl), so straight lines genuinely curve
 *   into arcs around the centre. The field is 0 at the centre, peaks toward the
 *   rim, and fades back to neutral (128,128) at the edge so there's no seam; a
 *   feFlood neutral backdrop keeps everything OUTSIDE the lens un-warped.
 *
 * WHY PER-ELEMENT FILTERS
 *   A CSS filter on an HTML element uses that element's own top-left as the
 *   filter's coordinate origin, so one shared filter can't place the lens
 *   correctly on elements sitting at different scroll offsets. We therefore give
 *   each warped element its OWN filter and position its feImage in that element's
 *   local space each frame. We filter the elements directly (never an ancestor),
 *   so the fixed `.sky` background keeps its fixed positioning while still being
 *   warped. Only elements the lens currently overlaps are filtered (cheap).
 */

import { useEffect, useRef } from 'react'
import { buildLensMap } from './lensField'

// ---- tunables -------------------------------------------------------------
const LERP = 0.1 // hole easing toward the cursor
const HOLE_R = 30 // px visual radius of the black disc
const LENS_R = 230 // px radius of the warp lens
const MAP_SIZE = LENS_R * 2 // on-screen lens size (px) the feImage is drawn at
const LENS_TEX = 384 // displacement-map texture resolution (px)
const DISP_SCALE = 72 // feDisplacementMap scale (px) — ~0.14 × on-screen lens size
const STRENGTH = 0.9 // radial field strength (0..1 before scale)
const SWIRL = 0.32 // tangential swirl strength
const RADIAL_SIGN: 1 | -1 = -1 // -1 = suck inward (wrap into the hole), +1 = bulge out
const PEAK = 0.72 // normalized radius where the bend peaks
const INFLUENCE = 200 // px radius for the swallow effect
const SWALLOW_PULL = 0.4 // how far swallowed elements slide toward the hole
const RESCAN_MS = 600
const AMBER = '#ffb000'

// fixed overlays + our own nodes — never warp/swallow these
const EXCLUDE = '.grain, .hud, .bgsw, [data-dbh]'
const SWALLOW_SEL = 'h1, h2, h3, p, li, figure, img, button, a, .card, [data-reveal]'

const SVGNS = 'http://www.w3.org/2000/svg'

interface Warped {
  el: HTMLElement
  prevFilter: string
  filter: SVGFilterElement
  feImage: SVGFEImageElement
  feDisp: SVGFEDisplacementMapElement
  applied: boolean
}

interface Cached {
  el: HTMLElement
  transform: string
  opacity: string
  transition: string
  willChange: string
}

export default function DomBlackhole({ active }: { active: boolean }): React.JSX.Element | null {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!active) return
    const host = hostRef.current
    if (!host) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ----- pointer + eased hole position ----------------------------------
    let px = window.innerWidth / 2
    let py = window.innerHeight / 2
    let hx = px
    let hy = py
    const onPointer = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    // ----- visible hole disc ----------------------------------------------
    const disc = document.createElement('div')
    disc.setAttribute('data-dbh', 'disc')
    disc.setAttribute('aria-hidden', 'true')
    Object.assign(disc.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: `${HOLE_R * 2}px`,
      height: `${HOLE_R * 2}px`,
      pointerEvents: 'none',
      zIndex: '9998',
      borderRadius: '50%',
      background:
        'radial-gradient(circle at 50% 50%, #000 0%, #000 56%, ' +
        `${AMBER} 59%, ${AMBER} 62%, rgba(255,176,0,0) 70%)`,
      boxShadow: '0 0 30px 12px rgba(255,176,0,0.18), 0 0 80px 36px rgba(0,0,0,0.6)',
      transform: `translate3d(${hx - HOLE_R}px, ${hy - HOLE_R}px, 0)`,
      transition: reduced ? 'opacity 200ms ease' : 'none',
      opacity: '0',
    } satisfies Partial<CSSStyleDeclaration>)
    host.appendChild(disc)
    requestAnimationFrame(() => {
      disc.style.opacity = '1'
    })

    // ----- shared SVG defs + the lens map ---------------------------------
    const mapData = buildLensMap({
      size: LENS_TEX,
      strength: STRENGTH,
      swirl: SWIRL,
      radialSign: RADIAL_SIGN,
      peak: PEAK,
    })
    const svg = document.createElementNS(SVGNS, 'svg')
    svg.setAttribute('data-dbh', 'svg')
    svg.setAttribute('aria-hidden', 'true')
    Object.assign(svg.style, {
      position: 'fixed',
      width: '0',
      height: '0',
      pointerEvents: 'none',
    } satisfies Partial<CSSStyleDeclaration>)
    const defs = document.createElementNS(SVGNS, 'defs')
    svg.appendChild(defs)
    host.appendChild(svg)

    // Build a dedicated filter for one element (so its lens is positioned in the
    // element's own coordinate space). Only created when reduced-motion is off.
    let filterSeq = 0
    const buildFilterFor = (el: HTMLElement): Warped => {
      const id = `dbh-warp-${filterSeq++}`
      const filter = document.createElementNS(SVGNS, 'filter')
      filter.setAttribute('id', id)
      filter.setAttribute('x', '-50%')
      filter.setAttribute('y', '-50%')
      filter.setAttribute('width', '200%')
      filter.setAttribute('height', '200%')
      filter.setAttribute('color-interpolation-filters', 'sRGB')

      const feImage = document.createElementNS(SVGNS, 'feImage')
      feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', mapData)
      feImage.setAttribute('href', mapData)
      feImage.setAttribute('width', String(MAP_SIZE))
      feImage.setAttribute('height', String(MAP_SIZE))
      feImage.setAttribute('preserveAspectRatio', 'xMidYMid meet')
      feImage.setAttribute('result', 'lensRaw')

      const feFlood = document.createElementNS(SVGNS, 'feFlood')
      feFlood.setAttribute('flood-color', 'rgb(128,128,128)')
      feFlood.setAttribute('result', 'flat')

      const feComp = document.createElementNS(SVGNS, 'feComposite')
      feComp.setAttribute('in', 'lensRaw')
      feComp.setAttribute('in2', 'flat')
      feComp.setAttribute('operator', 'over')
      feComp.setAttribute('result', 'map')

      const feDisp = document.createElementNS(SVGNS, 'feDisplacementMap')
      feDisp.setAttribute('in', 'SourceGraphic')
      feDisp.setAttribute('in2', 'map')
      feDisp.setAttribute('scale', '0')
      feDisp.setAttribute('xChannelSelector', 'R')
      feDisp.setAttribute('yChannelSelector', 'G')

      filter.appendChild(feImage)
      filter.appendChild(feFlood)
      filter.appendChild(feComp)
      filter.appendChild(feDisp)
      defs.appendChild(filter)
      return { el, prevFilter: el.style.filter, filter, feImage, feDisp, applied: false }
    }

    // Warp targets: the bg canvas + the direct content children of <main>.
    const warped: Warped[] = []
    if (!reduced) {
      const targets: HTMLElement[] = []
      const sky = document.querySelector<HTMLElement>('.sky')
      if (sky) targets.push(sky)
      const main = document.querySelector('main')
      if (main) {
        for (const child of Array.from(main.children)) {
          if (!(child instanceof HTMLElement)) continue
          if (child === sky || child.matches(EXCLUDE)) continue
          targets.push(child)
        }
      }
      for (const el of targets) warped.push(buildFilterFor(el))
    }

    // ----- swallow bookkeeping --------------------------------------------
    const cache = new Map<HTMLElement, Cached>()
    let candidates: HTMLElement[] = []
    const collect = () => {
      const next: HTMLElement[] = []
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(SWALLOW_SEL))) {
        if (el.closest(EXCLUDE)) continue
        next.push(el)
      }
      candidates = next
    }
    collect()
    let lastScan = performance.now()

    const cacheOnce = (el: HTMLElement) => {
      if (cache.has(el)) return
      cache.set(el, {
        el,
        transform: el.style.transform,
        opacity: el.style.opacity,
        transition: el.style.transition,
        willChange: el.style.willChange,
      })
    }
    const restore = (c: Cached) => {
      c.el.style.transform = c.transform
      c.el.style.opacity = c.opacity
      c.el.style.transition = c.transition
      c.el.style.willChange = c.willChange
    }

    // ----- main loop -------------------------------------------------------
    let raf = 0
    const touched = new Set<HTMLElement>()

    const tick = () => {
      hx += (px - hx) * (reduced ? 1 : LERP)
      hy += (py - hy) * (reduced ? 1 : LERP)
      disc.style.transform = `translate3d(${hx - HOLE_R}px, ${hy - HOLE_R}px, 0)`

      if (!reduced) {
        // WARP: only the elements the lens currently overlaps stay filtered.
        for (const wapd of warped) {
          const r = wapd.el.getBoundingClientRect()
          const overlaps =
            r.width > 0 &&
            r.height > 0 &&
            r.left < hx + LENS_R &&
            r.right > hx - LENS_R &&
            r.top < hy + LENS_R &&
            r.bottom > hy - LENS_R
          if (overlaps) {
            // position the lens in the element's local coordinate space
            wapd.feImage.setAttribute('x', String(hx - r.left - LENS_R))
            wapd.feImage.setAttribute('y', String(hy - r.top - LENS_R))
            wapd.feDisp.setAttribute('scale', String(DISP_SCALE))
            if (!wapd.applied) {
              wapd.el.style.filter = `url(#${wapd.filter.id})`
              wapd.applied = true
            }
          } else if (wapd.applied) {
            wapd.el.style.filter = wapd.prevFilter
            wapd.applied = false
          }
        }

        // SWALLOW: pull + fade the closest content elements (non-destructive).
        const now = performance.now()
        if (now - lastScan > RESCAN_MS) {
          collect()
          lastScan = now
        }
        const reads: { el: HTMLElement; cx: number; cy: number; d: number }[] = []
        for (const el of candidates) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 && r.height === 0) continue
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          const d = Math.hypot(cx - hx, cy - hy)
          if (d < INFLUENCE) reads.push({ el, cx, cy, d })
        }
        const nowTouched = new Set<HTMLElement>()
        for (const { el, cx, cy, d } of reads) {
          const t = 1 - d / INFLUENCE
          const ease = t * t
          const tx = (hx - cx) * SWALLOW_PULL * ease
          const ty = (hy - cy) * SWALLOW_PULL * ease
          const scale = 1 - 0.7 * ease
          const opacity = 1 - 0.92 * ease
          cacheOnce(el)
          el.style.willChange = 'transform, opacity'
          el.style.transition = 'transform 120ms linear, opacity 120ms linear'
          el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
          el.style.opacity = String(Math.max(0.05, opacity))
          nowTouched.add(el)
        }
        for (const el of touched) {
          if (!nowTouched.has(el)) {
            const c = cache.get(el)
            if (c) {
              restore(c)
              cache.delete(el)
            }
          }
        }
        touched.clear()
        for (const el of nowTouched) touched.add(el)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // ----- teardown --------------------------------------------------------
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      for (const c of cache.values()) restore(c)
      cache.clear()
      touched.clear()
      for (const w of warped) {
        if (w.applied) w.el.style.filter = w.prevFilter
      }
      disc.remove()
      svg.remove()
    }
  }, [active])

  if (!active) return null
  return (
    <div
      ref={hostRef}
      data-dbh="host"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997 }}
    />
  )
}
