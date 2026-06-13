import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Page-scoped [data-reveal] choreography. Each page calls this once;
 * the gsap.context is reverted on unmount so route changes never leak
 * ScrollTriggers.
 */
export function usePageReveals(): void {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        if (reduced) {
          gsap.set(el, { opacity: 1, x: 0, y: 0 })
          return
        }
        // data-reveal="left"/"right" slides in horizontally (timeline cards)
        const dir = el.getAttribute('data-reveal')
        const from =
          dir === 'left'
            ? { opacity: 0, x: -32 }
            : dir === 'right'
              ? { opacity: 0, x: 32 }
              : { opacity: 0, y: 28 }
        gsap.fromTo(el, from, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.55,
          ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })
    })

    // Archivo Black swaps in late and changes layout — re-measure once.
    document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})

    return () => ctx.revert()
  }, [])
}
