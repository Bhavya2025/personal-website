import Birds from '../components/Birds'
import { useTransitionNav } from '../components/transitionNav'
import { lenisStore } from '../hooks/useSmoothScroll'
import { IDENTITY } from '../lib/missions'

/**
 * Touchdown: daylight sky with drifting birds, and the footer as a strip
 * of earth — section links, pages, elsewhere, copyright.
 */
function Surface() {
  const { navigateTo } = useTransitionNav()

  const scrollTo = (target: string) =>
    lenisStore.current?.scrollTo(target, { offset: -80, duration: 1.1 })
  const scrollTop = () => lenisStore.current?.scrollTo(0, { duration: 1.2 })

  const SECTIONS: { label: string; target: string }[] = [
    { label: 'BACKGROUND', target: '#background' },
    { label: 'SKILLS', target: '#skills' },
    { label: 'PROJECTS', target: '#projects' },
    { label: 'ACHIEVEMENTS', target: '#achievements' },
    { label: 'CONTACT', target: '#contact' },
  ]

  return (
    <section className="surface" id="surface">
      <Birds />
      <footer className="ground">
        <div className="ground__cols">
          <div className="ground__col ground__col--brand">
            <p className="ground__brand">BHAVYA KUMAR</p>
            <p className="ground__tag">{IDENTITY.school}</p>
          </div>

          <nav className="ground__col" aria-label="Sections">
            <h4 className="ground__heading">ON THIS PAGE</h4>
            <button type="button" onClick={scrollTop}>ABOUT ME</button>
            {SECTIONS.map((s) => (
              <button type="button" key={s.target} onClick={() => scrollTo(s.target)}>
                {s.label}
              </button>
            ))}
          </nav>

          <nav className="ground__col" aria-label="Pages">
            <h4 className="ground__heading">PAGES</h4>
            <button type="button" onClick={() => navigateTo('/projects', 'swipe')}>
              ALL PROJECTS
            </button>
            <button type="button" onClick={() => navigateTo('/contact', 'swipe')}>
              CONTACT ME
            </button>
          </nav>

          <nav className="ground__col" aria-label="Elsewhere">
            <h4 className="ground__heading">ELSEWHERE</h4>
            <a href={IDENTITY.github} target="_blank" rel="noreferrer">GITHUB</a>
            <a href={IDENTITY.linkedin} target="_blank" rel="noreferrer">LINKEDIN</a>
            <a href={IDENTITY.resume} target="_blank" rel="noreferrer">RESUME</a>
            <a href={`mailto:${IDENTITY.email}`}>EMAIL</a>
          </nav>
        </div>

        <div className="ground__meta">
          <span>© {new Date().getFullYear()} BHAVYA KUMAR · ALL RIGHTS RESERVED</span>
        </div>
      </footer>
    </section>
  )
}

export default Surface
