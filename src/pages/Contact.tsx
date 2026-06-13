import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Section from '../components/Section'
import BrandIcon from '../components/BrandIcon'
import { IDENTITY } from '../lib/missions'
import { usePageReveals } from '../hooks/usePageReveals'

/** Burst of tiny letters flying out from a point. */
function burstLetters(container: HTMLElement, originX: number, originY: number) {
  for (let i = 0; i < 12; i++) {
    const span = document.createElement('span')
    span.className = 'letterburst'
    span.textContent = '✉︎'
    container.appendChild(span)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6
    const dist = 90 + Math.random() * 160
    gsap.fromTo(
      span,
      { x: originX, y: originY, opacity: 1, scale: 0.6 + Math.random() * 0.8, rotation: 0 },
      {
        x: originX + Math.cos(angle) * dist,
        y: originY + Math.sin(angle) * dist - 40,
        rotation: (Math.random() - 0.5) * 240,
        opacity: 0,
        scale: 0.4,
        duration: 0.9 + Math.random() * 0.5,
        ease: 'power2.out',
        onComplete: () => span.remove(),
      },
    )
  }
}

/* Pigeon geometry: feet sit ~52 units down in the 90×70 viewBox. */
const PIGEON_W = 90
const PIGEON_FEET_Y = 52
const NEST_W = 76

const PAPER_SVG =
  '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M6 2h9l5 5v15H6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15 2v5h5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'

type PigeonMode = 'flying' | 'nest' | 'perch' | 'cursor'

/**
 * Contact page. A resident pigeon splits its time between the perches
 * (~70%) and its nest on the title (~30%). Before heading home it pecks
 * the perch's icon loose and flies off with it in its beak. Feathers
 * come loose on every takeoff and landing.
 */
function Contact() {
  usePageReveals()
  const stageRef = useRef<HTMLDivElement>(null)
  const pigeonRef = useRef<SVGSVGElement>(null)
  const torsoRef = useRef<SVGGElement>(null)
  const wingRef = useRef<SVGPathElement>(null)
  const headRef = useRef<SVGGElement>(null)
  const legARef = useRef<SVGLineElement>(null)
  const legBRef = useRef<SVGLineElement>(null)
  const nestRef = useRef<SVGSVGElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(pointer: fine)').matches
    const stage = stageRef.current
    const pigeon = pigeonRef.current
    const torso = torsoRef.current
    const wing = wingRef.current
    const head = headRef.current
    const legA = legARef.current
    const legB = legBRef.current
    const nest = nestRef.current
    if (!stage || !pigeon || !torso || !wing || !head || !legA || !legB || !nest) return

    const nestPos = () => {
      const title = stage.querySelector('.section__title')
      const s = stage.getBoundingClientRect()
      if (!title) return { x: s.width * 0.6, y: 180 }
      const t = title.getBoundingClientRect()
      return {
        x: Math.max(0, t.right - s.left - NEST_W - 30),
        y: t.top - s.top - 20,
      }
    }

    const placeNest = () => {
      const n = nestPos()
      gsap.set(nest, { x: n.x, y: n.y, opacity: 1 })
      return n
    }

    const nestPerch = () => {
      const n = placeNest()
      return { x: n.x + NEST_W / 2 - PIGEON_W / 2, y: n.y + 12 - PIGEON_FEET_Y }
    }

    if (reduced) {
      const raf = requestAnimationFrame(() => {
        const p = nestPerch()
        gsap.set(pigeon, { x: p.x, y: p.y, opacity: 1 })
        gsap.set(wing, { rotation: 8, transformOrigin: '30% 20%' })
        gsap.set(torso, { y: 5 })
        gsap.set([legA, legB], { scaleY: 0.2, transformOrigin: '50% 0%' })
      })
      return () => cancelAnimationFrame(raf)
    }

    const controller = new AbortController()
    const { signal } = controller
    const mode: { current: PigeonMode } = { current: 'flying' }
    const delayed: gsap.core.Tween[] = []
    const trophies: HTMLElement[] = []
    let behaviorTl: gsap.core.Timeline | null = null
    let currentPerchEl: HTMLElement | null = null
    let pointerIn = false
    let lastPointer = { x: 0, y: 0 }
    let cursorPerchAt = { x: 0, y: 0 }
    let idleCall: gsap.core.Tween | null = null

    const flap = gsap.fromTo(
      wing,
      { rotation: -22, transformOrigin: '30% 20%' },
      {
        rotation: 24,
        duration: 0.18,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        paused: true,
      },
    )

    /* --- poses --- */

    const standPose = () => {
      gsap.to(torso, { y: 0, duration: 0.25 })
      gsap.to([legA, legB], { scaleY: 1, rotation: 0, transformOrigin: '50% 0%', duration: 0.25 })
    }

    /** Loaf: body settles down over folded legs. */
    const loafPose = () => {
      gsap.to(torso, { y: 5, duration: 0.5, ease: 'power2.out' })
      gsap.to([legA, legB], { scaleY: 0.2, transformOrigin: '50% 0%', duration: 0.5 })
    }

    /** On the cursor there's only room for one foot — the other dangles. */
    const cursorPose = () => {
      gsap.to(torso, { y: 3, duration: 0.35, ease: 'power2.out' })
      gsap.to(legA, { scaleY: 1, rotation: 0, duration: 0.3 })
      gsap.to(legB, { rotation: -50, scaleY: 0.8, transformOrigin: '50% 0%', duration: 0.35 })
    }

    /* --- feathers --- */

    const spawnFeathers = (x: number, y: number, n = 3) => {
      for (let i = 0; i < n; i++) {
        const f = document.createElement('span')
        f.className = 'feather'
        stage.appendChild(f)
        const sway = (Math.random() - 0.5) * 30
        gsap.set(f, {
          x: x + 20 + Math.random() * 40,
          y: y + 10 + Math.random() * 20,
          opacity: 0.9,
          rotation: Math.random() * 60,
        })
        gsap
          .timeline({ onComplete: () => f.remove() })
          .to(f, { y: `+=${60 + Math.random() * 70}`, duration: 1.8 + Math.random(), ease: 'power1.in' })
          .to(f, { x: `+=${sway}`, duration: 0.5, repeat: 3, yoyo: true, ease: 'sine.inOut' }, '<')
          .to(f, { rotation: `+=${120 + Math.random() * 120}`, duration: 2.2 }, '<')
          .to(f, { opacity: 0, duration: 0.5 }, '-=0.5')
      }
    }

    /* --- idle behaviors --- */

    const killBehaviors = () => {
      behaviorTl?.kill()
      behaviorTl = null
      gsap.set(head, { rotation: 0, y: 0 })
    }

    const groom = (after: () => void) => {
      behaviorTl = gsap
        .timeline({ onComplete: after })
        .to(head, { rotation: -95, transformOrigin: '15% 85%', duration: 0.45, ease: 'power2.inOut' })
        .to(head, { rotation: -80, duration: 0.16, repeat: 3, yoyo: true, ease: 'sine.inOut' })
        .to(head, { rotation: 0, duration: 0.4, ease: 'power2.out', delay: 0.2 })
    }

    const look = (after: () => void) => {
      behaviorTl = gsap
        .timeline({ onComplete: after })
        .to(head, { rotation: -14, y: -2, transformOrigin: '15% 85%', duration: 0.3, ease: 'sine.inOut' })
        .to(head, { rotation: 11, duration: 0.35, delay: 0.4, ease: 'sine.inOut' })
        .to(head, { rotation: 0, y: 0, duration: 0.3, delay: 0.35, ease: 'sine.out' })
    }

    const shuffle = (after: () => void) => {
      const dx = (Math.random() - 0.5) * 18
      behaviorTl = gsap
        .timeline({ onComplete: after })
        .to(pigeon, { x: `+=${dx / 2}`, y: '-=2', duration: 0.16, ease: 'sine.out' })
        .to(pigeon, { x: `+=${dx / 2}`, y: '+=2', duration: 0.16, ease: 'sine.in' })
    }

    const rest = (after: () => void) => {
      loafPose()
      behaviorTl = gsap.timeline().to({}, { duration: 2.5 + Math.random() * 2 })
      behaviorTl.eventCallback('onComplete', () => {
        if (mode.current === 'nest' || mode.current === 'perch') standPose()
        after()
      })
    }

    const scheduleIdle = () => {
      delayed.push(
        gsap.delayedCall(1.6 + Math.random() * 2, () => {
          if (mode.current === 'flying') return
          const pool =
            mode.current === 'cursor' ? [look, groom] : [groom, look, shuffle, rest]
          const behavior = pool[Math.floor(Math.random() * pool.length)]!
          behavior(scheduleIdle)
        }),
      )
    }

    /* --- perch targets & loot --- */

    const perchEls = () =>
      Array.from(stage.querySelectorAll<HTMLElement>('[data-perch]'))

    /** Feet position to stand on an element's visual top edge. */
    const perchPoint = (el: HTMLElement) => {
      const s = stage.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      let top = b.top
      if (el.hasAttribute('data-perch-text')) {
        // land on the glyphs, not the line box (big display text has leading)
        const cs = getComputedStyle(el)
        const fs = parseFloat(cs.fontSize)
        const lh = parseFloat(cs.lineHeight) || fs * 1.2
        top += Math.max(0, (lh - fs * 0.74) / 2)
      }
      return {
        x: b.left - s.left + b.width / 2 - PIGEON_W / 2,
        y: top - s.top - PIGEON_FEET_Y - 2,
      }
    }

    /** Where the loot visually lives inside a perch (icon, '@', or center). */
    const lootSourceRect = (el: HTMLElement) => {
      const svg = el.querySelector('svg')
      if (svg) return svg.getBoundingClientRect()
      if (el.getAttribute('data-steal') === '@') {
        const textNode = el.firstChild
        const idx = el.textContent?.indexOf('@') ?? -1
        if (textNode && idx >= 0) {
          const range = document.createRange()
          range.setStart(textNode, idx)
          range.setEnd(textNode, idx + 1)
          const r = range.getBoundingClientRect()
          if (r.width > 0) return r
        }
      }
      return el.getBoundingClientRect()
    }

    const makeLoot = (sourceEl: HTMLElement): HTMLElement | null => {
      const kind = sourceEl.getAttribute('data-steal')
      if (!kind) return null
      const loot = document.createElement('span')
      loot.className = 'contact__loot'
      if (kind === 'svg') {
        const svg = sourceEl.querySelector('svg')
        if (svg) loot.appendChild(svg.cloneNode(true))
        else loot.textContent = '✉︎'
      } else if (kind === 'paper') {
        loot.innerHTML = PAPER_SVG
      } else {
        loot.textContent = kind
      }
      stage.appendChild(loot)
      return loot
    }

    const beakPos = (px: number, py: number, facingRight: boolean) => ({
      x: px + (facingRight ? 58 : PIGEON_W - 58 - 14),
      y: py + 18,
    })

    /* --- flight --- */

    const flyTo = (
      target: { x: number; y: number },
      arrive: () => void,
      loot: HTMLElement | null = null,
      lootToNest = false,
    ) => {
      mode.current = 'flying'
      killBehaviors()
      idleCall?.kill()
      standPose()
      flap.play()

      const fromX = (gsap.getProperty(pigeon, 'x') as number) || 0
      const fromY = (gsap.getProperty(pigeon, 'y') as number) || 0
      const facingRight = target.x >= fromX
      gsap.set(pigeon, { scaleX: facingRight ? 1 : -1, opacity: 1 })
      spawnFeathers(fromX, fromY, 2)

      const dist = Math.hypot(target.x - fromX, target.y - fromY)
      const dur = Math.min(2.2, Math.max(1.1, dist / 300))
      // low arcs, clamped so the bird never leaves the page
      const arcH = 26 + Math.min(34, dist * 0.08)
      const peakY = Math.max(6, Math.min(fromY, target.y) - arcH)

      const tl = gsap.timeline({
        onComplete: () => {
          flap.pause()
          gsap.set(wing, { rotation: 8 })
          gsap.to(pigeon, { rotation: 0, duration: 0.2 })
          gsap.fromTo(pigeon, { y: target.y - 3 }, { y: target.y, duration: 0.3, ease: 'bounce.out' })
          spawnFeathers(target.x, target.y, 2)
          if (loot) {
            if (lootToNest) {
              const n = nestPos()
              trophies.push(loot)
              gsap.to(loot, {
                x: n.x + 18 + Math.random() * 30,
                y: n.y + 2,
                rotation: (Math.random() - 0.5) * 40,
                duration: 0.45,
                ease: 'bounce.out',
              })
              if (trophies.length > 3) {
                const old = trophies.shift()
                if (old) gsap.to(old, { opacity: 0, duration: 0.6, onComplete: () => old.remove() })
              }
            } else {
              gsap.to(loot, { opacity: 0, duration: 0.4, onComplete: () => loot.remove() })
            }
          }
          arrive()
          scheduleIdle()
        },
      })

      // body tilts along the flight path: nose up on the climb, down on the dive
      // (rotation values mirror automatically with scaleX flips)
      tl.to(pigeon, { x: target.x, duration: dur, ease: 'sine.inOut' })
        .to(pigeon, { y: peakY, duration: dur * 0.5, ease: 'sine.out' }, '<')
        .to(pigeon, { rotation: -18, duration: dur * 0.4, ease: 'sine.out' }, '<')
        .to(pigeon, { y: target.y, duration: dur * 0.5, ease: 'sine.in' }, `>${dur * 0.1}`)
        .to(pigeon, { rotation: 14, duration: dur * 0.45, ease: 'sine.inOut' }, '<')

      if (loot) {
        const peakBeak = beakPos(0, 0, facingRight)
        tl.to(loot, { x: target.x + peakBeak.x, duration: dur, ease: 'sine.inOut' }, 0)
          .to(loot, { y: peakY + peakBeak.y, duration: dur * 0.5, ease: 'sine.out' }, 0)
          .to(loot, { y: target.y + peakBeak.y, duration: dur * 0.5, ease: 'sine.in' }, dur * 0.6)
      }
    }

    /** Peck the perch's icon loose, then fly home with it. */
    const stealThenNest = (perchEl: HTMLElement) => {
      mode.current = 'flying' // lock out wander/cursor during the heist
      killBehaviors()
      idleCall?.kill()

      const s = stage.getBoundingClientRect()
      const iconR = lootSourceRect(perchEl)
      const px = (gsap.getProperty(pigeon, 'x') as number) || 0
      const py = (gsap.getProperty(pigeon, 'y') as number) || 0
      const facingRight = (gsap.getProperty(pigeon, 'scaleX') as number) >= 0
      let loot: HTMLElement | null = null

      gsap
        .timeline()
        // crouch and aim the beak down at the icon
        .to(torso, { y: 4, duration: 0.2, ease: 'power2.out' })
        .to(head, { rotation: 62, transformOrigin: '15% 85%', duration: 0.25, ease: 'power2.in' }, '<')
        // dig: three sharp jabs
        .to(head, { rotation: 44, duration: 0.11, repeat: 5, yoyo: true, ease: 'power1.inOut' })
        .to(pigeon, { y: '+=1.5', duration: 0.11, repeat: 5, yoyo: true, ease: 'power1.inOut' }, '<')
        // it pops loose — straight to the beak
        .add(() => {
          loot = makeLoot(perchEl)
          if (loot) {
            gsap.set(loot, { x: iconR.left - s.left, y: iconR.top - s.top, opacity: 1 })
            const b = beakPos(px, py, facingRight)
            gsap.to(loot, { x: b.x, y: b.y + 14, duration: 0.22, ease: 'power2.out' })
          }
        })
        .to(head, { rotation: 0, duration: 0.28, ease: 'power2.out', delay: 0.1 })
        .to(torso, { y: 0, duration: 0.2 }, '<')
        .add(() => {
          currentPerchEl = null
          flyTo(
            nestPerch(),
            () => {
              mode.current = 'nest'
              loafPose()
            },
            loot,
            true,
          )
        }, '+=0.12')
    }

    const goNest = (stealFrom: HTMLElement | null = null) => {
      if (stealFrom && stealFrom.getAttribute('data-steal')) {
        stealThenNest(stealFrom)
        return
      }
      currentPerchEl = null
      flyTo(nestPerch(), () => {
        mode.current = 'nest'
        loafPose()
      })
    }

    const goPerch = (el: HTMLElement) => {
      currentPerchEl = el
      flyTo(perchPoint(el), () => {
        mode.current = 'perch'
      })
    }

    const goCursor = () => {
      const s = stage.getBoundingClientRect()
      cursorPerchAt = { ...lastPointer }
      currentPerchEl = null
      flyTo(
        {
          x: lastPointer.x - s.left - PIGEON_W / 2 + 5,
          y: lastPointer.y - s.top - PIGEON_FEET_Y,
        },
        () => {
          mode.current = 'cursor'
          cursorPose()
        },
      )
    }

    /* --- wander: ~70% perches/cursor, ~30% nest --- */

    const wander = () => {
      delayed.push(
        gsap.delayedCall(3.5 + Math.random() * 3, () => {
          if (mode.current === 'flying' || mode.current === 'cursor') {
            wander()
            return
          }
          if (mode.current !== 'nest' && Math.random() < 0.3) {
            goNest(currentPerchEl)
          } else {
            const options = perchEls().filter((el) => el !== currentPerchEl)
            const pick = options[Math.floor(Math.random() * options.length)]
            if (pick) goPerch(pick)
          }
          wander()
        }),
      )
    }

    /* --- pointer: idle cursor becomes a perch --- */

    if (fine) {
      stage.addEventListener(
        'pointermove',
        (e) => {
          lastPointer = { x: e.clientX, y: e.clientY }
          if (mode.current === 'cursor') {
            const moved = Math.hypot(e.clientX - cursorPerchAt.x, e.clientY - cursorPerchAt.y)
            if (moved > 18) goNest()
            return
          }
          idleCall?.kill()
          idleCall = gsap.delayedCall(2.4, () => {
            if ((mode.current === 'nest' || mode.current === 'perch') && pointerIn) goCursor()
          })
        },
        { passive: true, signal },
      )
      stage.addEventListener('pointerenter', () => (pointerIn = true), { signal })
      stage.addEventListener(
        'pointerleave',
        () => {
          pointerIn = false
          idleCall?.kill()
          if (mode.current === 'cursor') goNest()
        },
        { signal },
      )
    }

    // settle in: fly from off-screen left into the nest
    gsap.set(pigeon, { x: -140, y: 140, opacity: 0 })
    document.fonts.ready.then(() => placeNest()).catch(() => {})
    window.addEventListener('resize', () => placeNest(), { passive: true, signal })
    delayed.push(gsap.delayedCall(0.9, () => goNest()))
    wander()

    return () => {
      controller.abort()
      delayed.forEach((d) => d.kill())
      idleCall?.kill()
      behaviorTl?.kill()
      flap.kill()
      trophies.forEach((t) => t.remove())
      stage.querySelectorAll('.feather, .contact__loot').forEach((el) => el.remove())
      gsap.killTweensOf([pigeon, torso, head, wing, legA, legB, nest])
    }
  }, [])

  const handleCopy = () => {
    navigator.clipboard?.writeText(IDENTITY.email).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
    const stage = stageRef.current
    const btn = document.querySelector('.contact__copy')
    if (stage && btn) {
      const s = stage.getBoundingClientRect()
      const b = btn.getBoundingClientRect()
      burstLetters(stage, b.left - s.left + b.width / 2, b.top - s.top)
    }
  }

  const handleMailClick = () => {
    const stage = stageRef.current
    const link = document.querySelector('.contact__email')
    if (stage && link) {
      const s = stage.getBoundingClientRect()
      const l = link.getBoundingClientRect()
      burstLetters(stage, l.left - s.left + l.width / 2, l.top - s.top)
    }
  }

  return (
    <main>
      <div className="contact" ref={stageRef}>
        {/* the nest, on the title */}
        <svg
          className="contact__nest"
          ref={nestRef}
          viewBox="0 0 76 34"
          width="76"
          height="34"
          aria-hidden="true"
        >
          <ellipse cx="38" cy="16" rx="34" ry="11" fill="#4a3520" />
          <ellipse cx="38" cy="13" rx="26" ry="7" fill="#241a0e" />
          <g stroke="#6b4d2c" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M6 18 C16 26 30 29 44 27" />
            <path d="M70 16 C62 25 46 29 32 26" />
            <path d="M10 12 C22 8 38 7 52 9" />
            <path d="M66 11 C56 7 42 6 28 8" />
          </g>
          <g stroke="#8a6a3e" strokeWidth="1.2" fill="none" strokeLinecap="round">
            <path d="M14 21 C26 26 48 26 62 20" />
            <path d="M20 10 C32 6 50 7 60 12" />
          </g>
        </svg>

        {/* the resident pigeon */}
        <svg
          className="contact__pigeon"
          ref={pigeonRef}
          viewBox="0 0 90 70"
          width="90"
          height="70"
          aria-hidden="true"
        >
          {/* legs (poseable) */}
          <line ref={legARef} x1="40" y1="41" x2="40" y2="51" stroke="var(--amber-deep)" strokeWidth="1.6" />
          <line ref={legBRef} x1="46" y1="41" x2="45" y2="51" stroke="var(--amber-deep)" strokeWidth="1.6" />
          {/* torso: everything that settles when loafing */}
          <g ref={torsoRef}>
            <path d="M10 30 L24 26 L24 36 Z" fill="var(--bone-dim)" />
            <ellipse cx="38" cy="32" rx="16" ry="10" fill="var(--bone)" />
            <g ref={headRef}>
              <circle cx="55" cy="24" r="7" fill="var(--bone)" />
              {/* a proper round black eye, with a glint */}
              <circle cx="57.2" cy="21.8" r="2.2" fill="var(--ink)" />
              <circle cx="58" cy="21" r="0.7" fill="var(--bone)" />
              {/* pointed beak */}
              <path d="M61.5 23 L69.5 25.5 L61.5 28 Z" fill="var(--amber)" />
            </g>
            <path d="M34 30 C26 22 18 20 12 22 C20 28 26 32 34 34 Z" fill="var(--bone-dim)" opacity="0.7" />
            <path
              ref={wingRef}
              d="M36 28 C30 14 20 8 10 8 C18 20 26 28 36 34 Z"
              fill="#c9c4b6"
              stroke="var(--ink)"
              strokeWidth="0.6"
            />
          </g>
        </svg>

        <Section index="01" code="" title="CONTACT ME" id="contact-page">
          <div className="contact__body">
            <a
              className="contact__email"
              href={`mailto:${IDENTITY.email}`}
              onClick={handleMailClick}
              data-reveal
              data-perch
              data-perch-text
              data-steal="@"
            >
              {IDENTITY.email}
            </a>

            <div className="contact__actions" data-reveal>
              <button
                type="button"
                className="btn contact__copy"
                onClick={handleCopy}
                data-perch
                data-steal="✉︎"
              >
                {copied ? 'COPIED ✓' : 'COPY ADDRESS'}
              </button>
              <a
                className="btn"
                href={IDENTITY.github}
                target="_blank"
                rel="noreferrer"
                data-perch
                data-steal="svg"
              >
                <BrandIcon name="github" /> GITHUB <span aria-hidden="true">↗</span>
              </a>
              <a
                className="btn"
                href={IDENTITY.linkedin}
                target="_blank"
                rel="noreferrer"
                data-perch
                data-steal="svg"
              >
                <BrandIcon name="linkedin" /> LINKEDIN <span aria-hidden="true">↗</span>
              </a>
              <a
                className="btn"
                href={IDENTITY.resume}
                target="_blank"
                rel="noreferrer"
                data-perch
                data-steal="paper"
              >
                RESUME <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}

export default Contact
