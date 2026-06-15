import { gsap } from 'gsap'

/**
 * The "summon" transition: click the circular pfp (or the "> launch terminal"
 * button) and the whole GUI gets hacked and collapses into the Dev OS terminal.
 *
 * The signature centrepiece is unchanged: the photo digitizes into a glowing
 * amber Sobel wireframe under a raking scan bar. On top of that we now hack the
 * REST of the page: a full-viewport scan bar sweeps down, and as it passes real
 * page elements (headings, cards, buttons, nav, chips) they flash an amber
 * outline/glow — "everything is being digitized" — while a randomized,
 * staggered set of visible text nodes glitches into scrambled amber glyphs with
 * RGB/position jitter, builds to a peak, then collapses into the terminal.
 *
 * CRITICAL: this runs OUTSIDE the React tree. openDevOS() unmounts the entire
 * GUI, so the overlay is appended to <body> and driven by a raw GSAP timeline;
 * an in-tree overlay would be destroyed mid-animation. The overlay sits at
 * z-index 10000 — ABOVE DevOS (.devos is 9999) — and crossfades out at the end
 * to reveal the already-booting terminal underneath.
 *
 * Every DOM mutation made on the LIVE page (added classes, inline styles,
 * scrambled text) is tracked and fully restored before the GUI unmounts. No
 * leaks: see `cleanup()` and the restore arrays.
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

  const vw = window.innerWidth
  const vh = window.innerHeight

  // Pre-warm the lazy chunk now so the boot screen never flashes a fallback.
  void import('./DevOS').catch(() => {})

  // Precompute the photo buffer (A) and the edge-detected wireframe (B) once.
  const { A, B } = buildBuffers(img, 220)

  // ---- collect live-page targets to "hack" (outline pulse + text glitch) ----
  // Done up-front while the GUI is still mounted; all mutations are restored in
  // cleanup() before openDevOS() tears the tree down.
  const outlineTargets = collectOutlineTargets()
  const glitchTargets = collectGlitchTargets(40)
  const restore = setupGlitch(glitchTargets)

  // ---- overlay DOM (body-appended, above DevOS) ----
  const ov = div({ position: 'fixed', inset: '0', zIndex: '10000', pointerEvents: 'none' })
  const screen = div({ position: 'fixed', inset: '0', background: '#030303', opacity: '0' })

  // full-viewport sweep bar that "digitizes" the page as it passes
  const sweep = div({
    position: 'fixed',
    left: '0',
    top: '0',
    width: '100vw',
    height: '0px',
    opacity: '0',
    transform: 'translateY(-40px)',
  })
  sweep.className = 'devos-sweep'

  const cv = document.createElement('canvas')
  const d = dpr()
  cv.width = Math.round(vw * d)
  cv.height = Math.round(vh * d)
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

  ov.append(screen, sweep, cv, ...ticks)
  document.body.appendChild(ov)

  // ---- per-frame canvas render (photo digitize, P1–P3 only) ----
  const innL = L + ins
  const innT = T + ins
  const innD = diam - 2 * ins
  const p = { scanT: 0, glitch: 0, flare: 0, frozen: false }

  const render = () => {
    if (p.frozen) return
    ctx.clearRect(0, 0, vw, vh)
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
    ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2)
    ctx.lineWidth = 1
    ctx.strokeStyle = blend('#e8e4d8', '#ffb000', p.scanT)
    ctx.stroke()
  }

  // hide the real pfp and paint our copy in its place (zero pop)
  img.style.visibility = 'hidden'
  render()

  // ---- viewport sweep: outline-pulse page elements as the bar passes ----
  // We drive a virtual scan line (sweepY) and trip each target once its top
  // edge is crossed, adding a short-lived class that the CSS animates.
  const sweepState = { y: -40 }
  let armed = true
  const tripped = new Set<Element>()
  const driveSweep = () => {
    const y = sweepState.y
    sweep.style.transform = `translateY(${y}px)`
    if (!armed) return
    for (const el of outlineTargets) {
      if (tripped.has(el)) continue
      const b = el.getBoundingClientRect()
      if (b.top <= y && b.bottom > 0) {
        tripped.add(el)
        el.classList.add('devos-digitize')
      }
    }
  }

  const cleanup = () => {
    ov.remove()
    img.style.visibility = ''
    document.documentElement.classList.remove('devos-boot')
    // restore every live-page mutation (defensive: GUI may already be gone)
    for (const el of outlineTargets) el.classList.remove('devos-digitize')
    restore()
    busy = false
  }

  gsap.set(cv, { transformOrigin: `${cx}px ${cy}px` })

  const tl = gsap.timeline({
    onUpdate: () => {
      render()
      driveSweep()
    },
    onComplete: cleanup,
  })

  // P1 — target lock on the photo
  tl.to(screen, { opacity: 0.42, duration: 0.2, ease: 'power1.out' }, 0)
  tl.fromTo(
    ticks,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.2, stagger: 0.03, ease: 'power3.out' },
    0,
  )

  // P2 — photo scan + digitize (glitch over the eye band) — UNCHANGED look
  tl.to(p, { scanT: 1, duration: 0.56, ease: 'sine.in' }, 0.2)
  tl.to(p, { glitch: 1, duration: 0.05, yoyo: true, repeat: 1, ease: 'none' }, 0.42)

  // P2b — the HACK spreads to the whole page: a viewport-wide scan bar rakes
  // top→bottom, tripping an amber outline/glow pulse on real page elements.
  tl.to(sweep, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 0.26)
  tl.fromTo(
    sweepState,
    { y: -40 },
    { y: vh + 40, duration: 0.95, ease: 'power1.inOut' },
    0.26,
  )
  tl.to(sweep, { opacity: 0, duration: 0.18, ease: 'power1.in' }, 1.04)

  // P3 — GUI failure: randomized text glitch builds up across the page.
  // Each target scrambles in a staggered, randomized window (see runGlitch).
  runGlitch(glitchTargets, tl, 0.34)

  // wireframe settle (ticks off)
  tl.to(ticks, { opacity: 0, duration: 0.14, ease: 'power1.in' }, 1.0)

  // P4 — the hacked GUI collapses: freeze the wireframe, stop new outline
  // trips, sink the screen to black, and FADE the pfp wireframe out (a smooth
  // fade, not an instant cut) in sync with the page going dark + text settling.
  tl.add(() => {
    armed = false // stop tripping new outlines
    p.frozen = true
  }, 1.2)
  tl.to(screen, { opacity: 1, duration: 0.55, ease: 'power2.in' }, 1.2)
  tl.to(cv, { opacity: 0, duration: 0.55, ease: 'power2.in' }, 1.2)

  // P5 — under the dark: restore the live page (un-glitch text + outline
  // classes) BEFORE the GUI unmounts, boot the terminal hidden, then lift the
  // veil to reveal it.
  tl.add(() => {
    for (const el of outlineTargets) el.classList.remove('devos-digitize')
    restore()
    openDevOS()
  }, 1.9)
  tl.to(screen, { opacity: 0, duration: 0.42, ease: 'power1.out' }, 1.96)
}

/* ============================================================================
 * Live-page "hack": outline-pulse + randomized text glitch
 * ========================================================================== */

/** Visible block-ish elements to flash an amber outline on as the sweep passes. */
function collectOutlineTargets(): Element[] {
  const sel = [
    '.hero__name-row',
    '.hero__line',
    '.hero__eyebrow',
    '.btn',
    '.hud__link',
    '.section__title',
    '.brief-card',
    '.skills__group',
    '.records__row',
    '.chip',
    '.skill-chip',
    '[data-reveal]',
  ].join(',')
  const out: Element[] = []
  const seen = new Set<Element>()
  document.querySelectorAll(sel).forEach((el) => {
    if (seen.has(el)) return
    if (!isOnScreen(el)) return
    seen.add(el)
    out.push(el)
  })
  // cap to keep the per-frame trip scan cheap
  return out.slice(0, 80)
}

type GlitchTarget = {
  el: HTMLElement
  original: string
  scramblePool: string
}

/** Sample a few dozen visible text-bearing elements to scramble. */
function collectGlitchTargets(max: number): GlitchTarget[] {
  const sel = [
    '.hero__name-row',
    '.hero__line',
    '.hero__eyebrow',
    '.btn',
    '.hud__link',
    '.section__title',
    '.section__index',
    '.brief-card h3',
    '.brief-card p',
    '.skills__label',
    '.skill-chip',
    '.records__row',
    'h1',
    'h2',
    'h3',
    'p',
    'a',
    'li',
  ].join(',')

  const cands: HTMLElement[] = []
  const seen = new Set<HTMLElement>()
  document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
    if (seen.has(el)) return
    // only LEAF-ish text: a single text child, short-ish, visible, on screen
    if (el.childElementCount > 0) return
    const txt = el.textContent ?? ''
    const t = txt.trim()
    if (t.length < 2 || t.length > 60) return
    if (!isOnScreen(el)) return
    seen.add(el)
    cands.push(el)
  })

  // randomized sample so it differs every run
  shuffle(cands)
  const pick = cands.slice(0, max)
  const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@*<>/\\|=+-_'
  return pick.map((el) => ({
    el,
    original: el.textContent ?? '',
    scramblePool: pool,
  }))
}

/** Apply the glitch base class + record originals; returns a restore fn. */
function setupGlitch(targets: GlitchTarget[]): () => void {
  for (const t of targets) t.el.classList.add('devos-glitch')
  let done = false
  return () => {
    if (done) return
    done = true
    for (const t of targets) {
      t.el.classList.remove('devos-glitch', 'devos-glitch--on')
      t.el.style.removeProperty('--gx')
      t.el.style.removeProperty('--gy')
      t.el.style.removeProperty('--gop')
      // restore text exactly (it may have been scrambled char-by-char)
      if (t.el.textContent !== t.original) t.el.textContent = t.original
    }
  }
}

/**
 * Drive the text glitch from the master timeline. Each target gets its own
 * randomized window inside [start, start+span]: position/opacity jitter via CSS
 * vars + a stepped character-scramble that resolves back toward the original,
 * then a final hard restore so the morph shows clean amber glyphs. Build-up is
 * front-loaded; everything is restored well before the GUI unmounts.
 */
function runGlitch(
  targets: GlitchTarget[],
  tl: gsap.core.Timeline,
  start: number,
) {
  const span = 1.0 // window over which targets enter the glitch
  for (const t of targets) {
    const at = start + Math.random() * span
    const dur = 0.5 + Math.random() * 0.5
    const jx = 1.5 + Math.random() * 4 // px
    const jy = 1 + Math.random() * 3
    const el = t.el

    // turn the visual glitch (color/shadow flicker) on
    tl.add(() => el.classList.add('devos-glitch--on'), at)

    // jitter the CSS vars every frame so it reads as instability. The ease
    // only paces the playhead; the actual shake is the per-frame randomness
    // below (settling as j.v → 1). Kept to core eases — RoughEase isn't
    // registered in this GSAP build.
    const j = { v: 0 }
    tl.to(
      j,
      {
        v: 1,
        duration: dur,
        ease: 'power1.inOut',
        onUpdate: () => {
          const k = (Math.random() - 0.5) * 2
          el.style.setProperty('--gx', `${k * jx * (1 - j.v * 0.4)}px`)
          el.style.setProperty('--gy', `${k * jy * (1 - j.v * 0.4)}px`)
          el.style.setProperty('--gop', `${0.55 + Math.random() * 0.45}`)
        },
      },
      at,
    )

    // character scramble that resolves toward the original
    const orig = t.original
    const prog = { v: 0 }
    tl.to(
      prog,
      {
        v: 1,
        duration: dur,
        ease: 'steps(10)',
        onUpdate: () => {
          el.textContent = scramble(orig, prog.v, t.scramblePool)
        },
      },
      at,
    )

    // hard land: clean text + zeroed jitter (still amber via .devos-boot/morph)
    tl.add(() => {
      el.textContent = orig
      el.style.setProperty('--gx', '0px')
      el.style.setProperty('--gy', '0px')
      el.style.setProperty('--gop', '1')
    }, at + dur)
  }
}

/** Replace a fraction (1 - progress) of chars with random glyphs. */
function scramble(s: string, progress: number, pool: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!
    if (ch === ' ' || ch === '\n') {
      out += ch
      continue
    }
    // resolve left-to-right: earlier chars settle first
    const settled = i / Math.max(1, s.length - 1) <= progress
    if (settled || Math.random() < progress) out += ch
    else out += pool[(Math.random() * pool.length) | 0]
  }
  return out
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
  bctx.shadowColor = 'rgba(255,204,0,0.6)'
  bctx.shadowBlur = 1
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

function isOnScreen(el: Element): boolean {
  const b = el.getBoundingClientRect()
  return (
    b.width > 0 &&
    b.height > 0 &&
    b.bottom > 0 &&
    b.top < window.innerHeight &&
    b.right > 0 &&
    b.left < window.innerWidth
  )
}

function shuffle<T>(a: T[]): void {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
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
