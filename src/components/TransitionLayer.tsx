import { useCallback, useMemo, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenisStore } from '../hooks/useSmoothScroll'
import { TransitionContext, type TransitionEffect } from './transitionNav'

/**
 * Full-viewport overlay that covers the screen, swaps the route underneath,
 * then reveals. Effects: 'swipe' (horizontal wipe), 'launch' (vertical
 * blast-off wipe), 'tear' (the rocket's exhaust rips the screen open from
 * the center — beam rise is timed to the rocket's ascent), 'fade'.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const overlayRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const tearRef = useRef<HTMLDivElement>(null)
  const flameRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const embersRef = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)

  const navigateTo = useCallback(
    (path: string, effect: TransitionEffect = 'fade') => {
      if (busyRef.current) return
      const overlay = overlayRef.current
      if (!overlay) {
        navigate(path)
        return
      }
      busyRef.current = true

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const swapRoute = () => {
        navigate(path)
        lenisStore.current?.scrollTo(0, { immediate: true })
        window.scrollTo(0, 0)
        ScrollTrigger.refresh()
      }

      const tearParts = [
        tearRef.current,
        flameRef.current,
        leftRef.current,
        rightRef.current,
        flashRef.current,
        ...(embersRef.current ? Array.from(embersRef.current.children) : []),
      ]

      const done = () => {
        gsap.set([overlay, ...tearParts].filter(Boolean), { clearProps: 'all' })
        overlay.classList.remove('is-active', 'is-tear')
        busyRef.current = false
      }

      overlay.classList.add('is-active')
      if (labelRef.current) {
        labelRef.current.textContent =
          effect === 'launch' || effect === 'tear'
            ? 'IGNITION'
            : `ROUTE → ${path.replace('/', '').toUpperCase() || 'HOME'}`
      }

      if (reduced) {
        gsap
          .timeline()
          .set(overlay, { opacity: 0, xPercent: 0, yPercent: 0 })
          .to(overlay, { opacity: 1, duration: 0.15 })
          .add(swapRoute)
          .to(overlay, { opacity: 0, duration: 0.15, delay: 0.1 })
          .add(done)
        return
      }

      const tl = gsap.timeline({ onComplete: done })

      if (effect === 'swipe') {
        tl.set(overlay, { xPercent: 100, yPercent: 0, opacity: 1 })
          .to(overlay, { xPercent: 0, duration: 0.45, ease: 'power3.in' })
          .add(swapRoute)
          .to(overlay, { xPercent: -100, duration: 0.55, ease: 'power3.out', delay: 0.15 })
      } else if (effect === 'launch') {
        tl.set(overlay, { yPercent: 100, xPercent: 0, opacity: 1 })
          .to(overlay, { yPercent: 0, duration: 0.5, ease: 'power4.in' })
          .add(swapRoute)
          .to(overlay, { yPercent: -100, duration: 0.6, ease: 'power3.out', delay: 0.2 })
      } else if (effect === 'tear') {
        const tear = tearRef.current
        const flame = flameRef.current
        const left = leftRef.current
        const right = rightRef.current
        const flash = flashRef.current
        const embers = embersRef.current
          ? Array.from(embersRef.current.children)
          : []
        overlay.classList.add('is-tear')

        // high-speed ride back to the top while the screen tears
        lenisStore.current?.scrollTo(0, { duration: 0.5, lock: true })

        tl.set(overlay, { opacity: 1, xPercent: 0, yPercent: 0 })
          .set(flame, { scaleY: 0, opacity: 1, transformOrigin: '50% 100%' })
          .set([left, right], { scaleX: 0, rotation: 0 })
          .set(flash, { opacity: 0 })
          // the beam climbs WITH the rocket — same duration + ease as lift-off
          .to(flame, { scaleY: 1, duration: 0.5, ease: 'power4.in' })
          .fromTo(
            tear,
            { x: -4 },
            { x: 4, duration: 0.03, repeat: 9, yoyo: true, ease: 'none' },
            '<0.15',
          )
          .set(tear, { x: 0 })
          // the tear widens outward, edges twisting slightly
          .to(left, { scaleX: 1, rotation: -0.6, duration: 0.28, ease: 'power2.in' }, '-=0.16')
          .to(right, { scaleX: 1, rotation: 0.6, duration: 0.28, ease: 'power2.in' }, '<')
          // white-hot flash + embers at full cover
          .to(flash, { opacity: 0.9, duration: 0.05 }, '>-0.03')
          .add(() => {
            for (const e of embers) {
              const dir = Math.random() < 0.5 ? -1 : 1
              gsap.fromTo(
                e,
                {
                  x: 0,
                  y: (0.1 + Math.random() * 0.8) * window.innerHeight,
                  opacity: 1,
                  scale: 0.6 + Math.random(),
                },
                {
                  x: dir * (60 + Math.random() * 200),
                  y: `+=${20 + Math.random() * 60}`,
                  opacity: 0,
                  duration: 0.45 + Math.random() * 0.25,
                  ease: 'power2.out',
                },
              )
            }
          }, '<')
          .add(swapRoute, '<')
          .to(flash, { opacity: 0, duration: 0.18 })
          // the halves peel back to the seam, one leading the other
          .to(left, { scaleX: 0, rotation: 0, duration: 0.42, ease: 'power3.inOut', delay: 0.08 }, '<')
          .to(right, { scaleX: 0, rotation: 0, duration: 0.42, ease: 'power3.inOut' }, '<0.06')
          // the flame snuffs upward, chasing the rocket
          .set(flame, { transformOrigin: '50% 0%' }, '<')
          .to(flame, { scaleY: 0, opacity: 0, duration: 0.25 }, '<0.1')
      } else {
        tl.set(overlay, { opacity: 0, xPercent: 0, yPercent: 0 })
          .to(overlay, { opacity: 1, duration: 0.25 })
          .add(swapRoute)
          .to(overlay, { opacity: 0, duration: 0.3, delay: 0.15 })
      }
    },
    [navigate],
  )

  const value = useMemo(() => ({ navigateTo }), [navigateTo])

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div className="transition-overlay" ref={overlayRef} aria-hidden="true">
        <span className="transition-overlay__label" ref={labelRef} />
        <div className="tear" ref={tearRef}>
          <div className="tear__half tear__half--left" ref={leftRef} />
          <div className="tear__half tear__half--right" ref={rightRef} />
          <div className="tear__flame" ref={flameRef} />
          <div className="tear__flash" ref={flashRef} />
          <div className="tear__embers" ref={embersRef} aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  )
}
