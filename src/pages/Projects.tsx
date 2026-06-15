import './projects.css'
import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import TransitSky from '../components/TransitSky'
import MissionCard from '../components/MissionCard'
import Footer from '../components/Footer'
import { MISSIONS } from '../lib/missions'
import { usePageReveals } from '../hooks/usePageReveals'
import { lenisStore } from '../hooks/useSmoothScroll'

/** All projects, as full dossiers. */
function Projects() {
  usePageReveals()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const built = MISSIONS.filter((m) => m.status !== 'PLANNED')
  const planned = MISSIONS.filter((m) => m.status === 'PLANNED')

  // Arriving via the terminal `run <project>` command (new tab → ?focus=ID,
  // or in-app → location.state): scroll to that card and pulse it.
  useEffect(() => {
    const focus =
      (location.state as { focus?: string } | null)?.focus ??
      searchParams.get('focus') ??
      undefined
    if (!focus) return
    const t = window.setTimeout(() => {
      const el = document.getElementById(`mission-${focus}`)
      if (!el) return
      const lenis = lenisStore.current
      if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.2 })
      else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('dossier--focus')
      window.setTimeout(() => el.classList.remove('dossier--focus'), 2600)
    }, 400)
    return () => window.clearTimeout(t)
  }, [location.state, searchParams])

  return (
    <main>
      <TransitSky />

      <section className="projects-head">
        <div className="projects-head__bar" data-reveal>
          <div className="projects-head__titlewrap">
            <span className="projects-head__eyebrow">Selected work</span>
            <h1 className="projects-head__title">PROJECTS</h1>
          </div>
          <span className="projects-head__rule" aria-hidden="true" />
        </div>
      </section>

      <ul className="dossiers">
        {built.map((m, i) => (
          <MissionCard mission={m} index={i + 1} key={m.id} />
        ))}
      </ul>

      {planned.length ? (
        <p className="next-up" data-reveal>
          <span className="next-up__label">Next up</span>
          <span className="next-up__items">
            {planned.map((m) => m.name).join('  ·  ')}
          </span>
        </p>
      ) : null}

      <Footer />
    </main>
  )
}

export default Projects
