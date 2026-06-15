import { useLocation } from 'react-router-dom'
import { useTransitionNav } from './transitionNav'
import { lenisStore } from '../hooks/useSmoothScroll'
import { IDENTITY } from '../lib/missions'

/** Shared site footer — dark instrument-panel strip with nav + copyright. */
function Footer() {
  const { navigateTo } = useTransitionNav()
  const { pathname } = useLocation()

  const go = (path: string) => {
    if (pathname === path) {
      lenisStore.current?.scrollTo(0, { duration: 1.1 })
    } else {
      navigateTo(path, 'swipe')
    }
  }

  return (
    <footer className="ground">
      <div className="ground__inner">
        <div className="ground__brand">
          <span className="ground__wordmark">BHAVYA KUMAR</span>
          <span className="ground__tag">
            Applied Mathematics · University of Waterloo
          </span>
          <a className="ground__email" href={`mailto:${IDENTITY.email}`}>
            {IDENTITY.email}
          </a>
        </div>

        <div className="ground__cols">
          <nav className="ground__col" aria-label="Pages">
            <h4 className="ground__heading">EXPLORE</h4>
            <button type="button" onClick={() => go('/')}>HOME</button>
            <button type="button" onClick={() => go('/projects')}>PROJECTS</button>
            <button type="button" onClick={() => go('/contact')}>CONTACT</button>
          </nav>
          <nav className="ground__col" aria-label="Elsewhere">
            <h4 className="ground__heading">ELSEWHERE</h4>
            <a href={IDENTITY.github} target="_blank" rel="noreferrer">
              GITHUB <span aria-hidden="true">↗</span>
            </a>
            <a href={IDENTITY.linkedin} target="_blank" rel="noreferrer">
              LINKEDIN <span aria-hidden="true">↗</span>
            </a>
            <a href={IDENTITY.medium} target="_blank" rel="noreferrer">
              MEDIUM <span aria-hidden="true">↗</span>
            </a>
            <a href={IDENTITY.resume} target="_blank" rel="noreferrer">
              RESUME <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>
      </div>

      <div className="ground__meta">
        <span className="ground__copyright">
          © {new Date().getFullYear()} BHAVYA KUMAR
        </span>
      </div>
    </footer>
  )
}

export default Footer
