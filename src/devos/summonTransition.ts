import { gsap } from 'gsap'

/**
 * The "summon" transition: click the circular pfp and it digitizes into the
 * Dev OS terminal. Edge-detect scan (the photo becomes a glowing wireframe of
 * the subject) → CRT collapse to a hot line → dark beat where openDevOS fires →
 * power-on into the live shell.
 *
 * CRITICAL: this runs OUTSIDE the React tree. openDevOS() unmounts the entire
 * GUI, so the overlay is appended to <body> and driven by a raw GSAP timeline;
 * an in-tree overlay would be destroyed mid-animation. The overlay sits at
 * z-index 10000 — ABOVE DevOS (.devos is 9999) — and crossfades out at the end
 * to reveal the already-booting terminal underneath.
 */

let busy = false

const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
const dpr = () => Math.min(window.devicePixelRatio || 1, 2)

export function summonDevOS(img: HTMLImageElement | null, openDevOS: () => void) {
  if (busy) return
  // No decoded image to scan → just open the terminal plainly.
  if (!img || !img.complete || !img.naturalWidth) {
    openDevOS()
    return
  }
  busy = true
  if (reduced()) {
    reducedSummon(openDevOS)
    return
  }
  fullSummon(img, openDevOS)
}

/* ---- reduced motion: no scan, no flash, just a dark dissolve ---- */
function reducedSummon(openDevOS: () => void) {
  const veil = div({
    position: 'fixed',
    inset: '0',
    background: '#030303',
    opacity: '0',
    zIndex: '10000',
    pointerEvents: 'none',
  })
  document.body.appendChild(veil)
  gsap.to(veil, {
    opacity: 1,
    duration: 0.2,
    ease: 'power1.out',
    onComplete: () => {
      openDevOS()
      gsap.to(veil, {
        opacity: 0,
        duration: 0.18,
        delay: 0.06,
        ease: 'power1.in',
        onComplete: () => {
          veil.remove()
          busy = false
        },
      })
    },
  })
}

/* ---- the full cinematic path ---- */
function fullSummon(img: HTMLImageElement, openDevOS: () => void) {
  const rect = img.getBoundingClientRect()
  const L = rect.left
  const T = rect.top
  const diam = rect.width
  const cx = L + diam / 2
  const cy = T + diam / 2
  const r = diam / 2
  const ins = 3 // matches the pfp's 3px border so the swap is seamless

  // Pre-warm the lazy chunk now so the boot screen never flashes a fallback.
  void import('./DevOS').catch(() => {})

  // Precompute the photo buffer (A) and the edge-detected wireframe (B) once.
  const { A, B } = buildBuffers(img, 220)

  // ---- overlay DOM (body-appended, above DevOS) ----
  const ov = div({ position: 'fixed', inset: '0', zIndex: '10000', pointerEvents: 'none' })
  const screen = div({ position: 'fixed', inset: '0', background: '#030303', opacity: '0' })

  const cv = document.createElement('canvas')
  const d = dpr()
  cv.width = Math.round(window.innerWidth * d)
  cv.height = Math.round(window.innerHeight * d)
  Object.assign(cv.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    display: 'block',
  } as Partial<CSSStyleDeclaration>)
  const ctx = cv.getContext('2d')!
  ctx.setTransform(d, 0, 0, d, 0, 0)

  const ticks = makeTicks(L, T, diam)

  const bar = div({
    position: 'fixed',
    left: '0',
    width: '100vw',
    height: '3px',
    top: `${cy}px`,
    transform: 'scaleX(0)',
    opacity: '0',
    background:
      'linear-gradient(90deg, transparent, #ffb000 18%, #ffffff 50%, #ffb000 82%, transparent)',
  })
  const sweep = div({
    position: 'fixed',
    left: '0',
    width: '100vw',
    height: '2px',
    top: '-5%',
    opacity: '0',
    background: '#46d27a',
    boxShadow: '0 0 8px #46d27a',
  })
  const flash = div({ position: 'fixed', inset: '0', background: '#ffcc00', opacity: '0' })

  ov.append(screen, cv, ...ticks, bar, sweep, flash)
  document.body.appendChild(ov)

  // ---- per-frame canvas render (P1–P3 only) ----
  const innL = L + ins
  const innT = T + ins
  const innD = diam - 2 * ins
  const p = { scanT: 0, glitch: 0, flare: 0, frozen: false }

  const render = () => {
    if (p.frozen) return
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()

    // base photo
    ctx.drawImage(A, innL, innT, innD, innD)

    // wireframe above the scan boundary
    const by = T + p.scanT * diam
    if (p.scanT > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(L, T, diam, by - T)
      ctx.clip()
      ctx.drawImage(B, innL, innT, innD, innD)
      if (p.glitch > 0) {
        // channel-split jitter as the scan crosses the eyes
        const dx = 5 * p.glitch
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = 0.6
        ctx.drawImage(B, innL + dx, innT, innD, innD)
        ctx.drawImage(B, innL - dx, innT, innD, innD)
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.restore()
    }

    // the scan bar itself
    if (p.scanT > 0 && p.scanT < 1) {
      const g = ctx.createLinearGradient(0, by - 14, 0, by + 14)
      g.addColorStop(0, 'rgba(255,176,0,0)')
      g.addColorStop(0.5, 'rgba(255,244,200,0.95)')
      g.addColorStop(1, 'rgba(255,176,0,0)')
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = g
      ctx.fillRect(L, by - 14, diam, 28)
      ctx.globalCompositeOperation = 'source-over'
    }

    // capture flare
    if (p.flare > 0) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = `rgba(255,204,0,${p.flare})`
      ctx.fillRect(L, T, diam, diam)
      ctx.globalCompositeOperation = 'source-over'
    }
    ctx.restore()

    // ring: bone border bleeding to amber as it digitizes
    ctx.beginPath()
    ctx.arc(cx, cy, r - ins / 2, 0, Math.PI * 2)
    ctx.lineWidth = ins
    ctx.strokeStyle = blend('#e8e4d8', '#ffb000', p.scanT)
    ctx.stroke()
  }

  // hide the real pfp and paint our copy in its place (zero pop)
  img.style.visibility = 'hidden'
  render()

  const cleanup = () => {
    ov.remove()
    img.style.visibility = ''
    busy = false
  }

  gsap.set(cv, { transformOrigin: `${cx}px ${cy}px` })

  const tl = gsap.timeline({ onUpdate: render, onComplete: cleanup })

  // P1 — target lock
  tl.to(screen, { opacity: 0.45, duration: 0.2, ease: 'power1.out' }, 0)
  tl.fromTo(
    ticks,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.2, stagger: 0.03, ease: 'power3.out' },
    0,
  )

  // P2 — scan + digitize (glitch over the eye band)
  tl.to(p, { scanT: 1, duration: 0.56, ease: 'sine.in' }, 0.2)
  tl.to(p, { glitch: 1, duration: 0.05, yoyo: true, repeat: 1, ease: 'none' }, 0.42)

  // P3 — wireframe settle / capture freeze
  tl.to(p, { flare: 0.45, duration: 0.07, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.76)
  tl.to(ticks, { opacity: 0, duration: 0.12, ease: 'power1.in' }, 0.78)

  // P4 — CRT collapse (tube switch-off)
  tl.add(() => {
    p.frozen = true
  }, 0.9)
  tl.set(bar, { opacity: 1, top: cy }, 0.9)
  tl.to(bar, { scaleX: 1, duration: 0.14, ease: 'expo.out' }, 0.9)
  tl.to(bar, { boxShadow: '0 0 36px 3px rgba(255,204,0,0.9)', duration: 0.24 }, 0.9)
  tl.to(cv, { scaleY: 0.04, opacity: 0, duration: 0.24, ease: 'expo.in' }, 0.9)
  tl.to(screen, { opacity: 1, duration: 0.18, ease: 'power1.in' }, 0.9)

  // P5 — dark hold; fire openDevOS so the lazy mount hides in the black
  tl.to(bar, { opacity: 0.8, duration: 0.1 }, 1.14)
  tl.add(() => openDevOS(), 1.18)

  // P6 — power-on unfold + crossfade to the live terminal underneath
  tl.to(bar, { opacity: 1, duration: 0.04 }, 1.24)
  tl.to(flash, { opacity: 0.16, duration: 0.1, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 1.24)
  tl.fromTo(
    sweep,
    { top: '-5%', opacity: 0.9 },
    { top: '105%', opacity: 0, duration: 0.26, ease: 'power1.out' },
    1.28,
  )
  tl.to(bar, { scaleY: 24, opacity: 0, duration: 0.24, ease: 'expo.out' }, 1.28)
  tl.to(ov, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 1.34)
}

/* ---- offscreen buffers: photo (A) + auto-leveled Sobel wireframe (B) ---- */
function buildBuffers(img: HTMLImageElement, s: number) {
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  const side = Math.min(nw, nh)
  const sx = (nw - side) / 2
  const sy = (nh - side) / 2

  const A = document.createElement('canvas')
  A.width = s
  A.height = s
  const actx = A.getContext('2d')!
  actx.drawImage(img, sx, sy, side, side, 0, 0, s, s)

  const data = actx.getImageData(0, 0, s, s).data

  // grayscale + auto-level (the subject sits against dark engines → stretch)
  const gray = new Float32Array(s * s)
  let mn = 255
  let mx = 0
  for (let i = 0; i < s * s; i++) {
    const y = 0.299 * data[i * 4]! + 0.587 * data[i * 4 + 1]! + 0.114 * data[i * 4 + 2]!
    gray[i] = y
    if (y < mn) mn = y
    if (y > mx) mx = y
  }
  const range = Math.max(1, mx - mn)
  for (let i = 0; i < s * s; i++) gray[i] = ((gray[i]! - mn) / range) * 255

  // Sobel 3x3 → amber edges
  const edges = document.createElement('canvas')
  edges.width = s
  edges.height = s
  const ectx = edges.getContext('2d')!
  const out = ectx.createImageData(s, s)
  const od = out.data
  const thr = 48
  const at = (x: number, y: number) => gray[y * s + x]!
  for (let y = 1; y < s - 1; y++) {
    for (let x = 1; x < s - 1; x++) {
      const gx =
        at(x - 1, y - 1) +
        2 * at(x - 1, y) +
        at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1))
      const gy =
        at(x - 1, y - 1) +
        2 * at(x, y - 1) +
        at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1))
      const mag = Math.sqrt(gx * gx + gy * gy)
      if (mag > thr) {
        const o = (y * s + x) * 4
        od[o] = 255
        od[o + 1] = 204
        od[o + 2] = 0
        od[o + 3] = Math.min(255, mag * 1.2)
      }
    }
  }
  ectx.putImageData(out, 0, 0)

  // B = dark terminal bg + glow-baked edges
  const B = document.createElement('canvas')
  B.width = s
  B.height = s
  const bctx = B.getContext('2d')!
  bctx.fillStyle = '#030303'
  bctx.fillRect(0, 0, s, s)
  bctx.shadowColor = 'rgba(255,204,0,0.85)'
  bctx.shadowBlur = 3
  bctx.drawImage(edges, 0, 0)
  bctx.drawImage(edges, 0, 0)
  bctx.shadowBlur = 0

  return { A, B }
}

/* ---- little DOM/colour helpers ---- */
function div(styles: Partial<CSSStyleDeclaration>): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, styles)
  return el
}

function makeTicks(L: number, T: number, diam: number): HTMLDivElement[] {
  const tk = 16
  const g = 7 // gap outside the photo
  const base: Partial<CSSStyleDeclaration> = {
    position: 'fixed',
    width: `${tk}px`,
    height: `${tk}px`,
    borderColor: '#ffb000',
    borderStyle: 'solid',
    borderWidth: '0',
  }
  const corners: Array<[number, number, string]> = [
    [T - g, L - g, 'tl'],
    [T - g, L + diam + g - tk, 'tr'],
    [T + diam + g - tk, L - g, 'bl'],
    [T + diam + g - tk, L + diam + g - tk, 'br'],
  ]
  return corners.map(([top, left, kind]) => {
    const el = div({ ...base, top: `${top}px`, left: `${left}px` })
    if (kind.includes('t')) el.style.borderTopWidth = '2px'
    if (kind.includes('b')) el.style.borderBottomWidth = '2px'
    if (kind.includes('l')) el.style.borderLeftWidth = '2px'
    if (kind.includes('r')) el.style.borderRightWidth = '2px'
    return el
  })
}

function blend(c1: string, c2: string, t: number): string {
  const a = hex(c1)
  const b = hex(c2)
  const m = (i: number) => Math.round(a[i]! + (b[i]! - a[i]!) * t)
  return `rgb(${m(0)}, ${m(1)}, ${m(2)})`
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
