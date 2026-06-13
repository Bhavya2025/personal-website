import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** App-wide Lenis instance — HUD nav & transitions use this to scroll. */
export const lenisStore: { current: Lenis | null } = { current: null }

/**
 * Lenis ↔ GSAP ScrollTrigger bridge (the documented integration:
 * Lenis feeds ScrollTrigger updates, GSAP's ticker drives Lenis).
 * Mount once in the app shell — survives route changes.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.12 })
    lenisStore.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisStore.current = null
    }
  }, [])
}
