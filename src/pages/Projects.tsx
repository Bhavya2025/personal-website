import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import TransitSky from '../components/TransitSky'
import Manifest from '../sections/Manifest'
import Rover from '../components/Rover'
import Footer from '../components/Footer'
import { usePageReveals } from '../hooks/usePageReveals'
import { useTransitionNav } from '../components/transitionNav'
import { lenisStore } from '../hooks/useSmoothScroll'

/** All projects, as full dossiers. */
function Projects() {
  usePageReveals()
  const { navigateTo } = useTransitionNav()
  const location = useLocation()

  // Arriving via the terminal `run <project>` command: scroll to that card.
  useEffect(() => {
    const focus = (location.state as { focus?: string } | null)?.focus
    if (!focus) return
    const t = window.setTimeout(() => {
      const el = document.getElementById(`mission-${focus}`)
      if (!el) return
      const lenis = lenisStore.current
      if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.2 })
      else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('mission--focus')
      window.setTimeout(() => el.classList.remove('mission--focus'), 2600)
    }, 400)
    return () => window.clearTimeout(t)
  }, [location.state])

  return (
    <main>
      <TransitSky />
      <section className="page-head">
        <button
          type="button"
          className="btn page-head__back"
          onClick={() => navigateTo('/', 'swipe')}
          data-reveal
        >
          ← HOME
        </button>
      </section>

      <Manifest />

      <section className="manifest-end">
        <Rover />
      </section>

      <Footer />
    </main>
  )
}

export default Projects
