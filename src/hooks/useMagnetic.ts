import { useEffect } from 'react'
import gsap from 'gsap'

/**
 * Magnetic pull on .btn elements within `selector` scope — desktop only.
 * Buttons drift toward the pointer while hovered, snap back elastically.
 */
export function useMagnetic(): void {
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    const controller = new AbortController()
    const { signal } = controller
    const strength = 0.3
    const tweens = new WeakMap<
      HTMLElement,
      { x: (v: number) => void; y: (v: number) => void }
    >()

    const getTweens = (el: HTMLElement) => {
      let t = tweens.get(el)
      if (!t) {
        t = {
          x: gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' }),
        }
        tweens.set(el, t)
      }
      return t
    }

    document.addEventListener(
      'pointermove',
      (e) => {
        const t = e.target
        if (!(t instanceof Element)) return
        const btn = t.closest<HTMLElement>('.btn')
        if (!btn) return
        const r = btn.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        const q = getTweens(btn)
        q.x(dx * strength)
        q.y(dy * strength)
      },
      { passive: true, signal },
    )

    document.addEventListener(
      'pointerout',
      (e) => {
        const t = e.target
        if (!(t instanceof Element)) return
        const btn = t.closest<HTMLElement>('.btn')
        if (!btn) return
        if (e.relatedTarget instanceof Node && btn.contains(e.relatedTarget)) return
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
      },
      { signal },
    )

    return () => controller.abort()
  }, [])
}
