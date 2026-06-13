import { useLocation } from 'react-router-dom'
import { useTransitionNav } from './transitionNav'
import { lenisStore } from '../hooks/useSmoothScroll'
import { IDENTITY } from '../lib/missions'
import { EDUCATION } from '../lib/resume'

/** Shared site footer — the green earth strip with nav + copyright. */
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
      <div className="ground__cols">
        <div className="ground__col ground__col--brand">
          <p className="ground__brand">BHAVYA KUMAR</p>
          <p className="ground__tag">
            <a href={EDUCATION.majorUrl} target="_blank" rel="noreferrer">
              {EDUCATION.major}
            </a>
            <br />
            <a href={EDUCATION.schoolUrl} target="_blank" rel="noreferrer">
              {EDUCATION.school}
            </a>
          </p>
        </div>
        <nav className="ground__col" aria-label="Pages">
          <h4 className="ground__heading">EXPLORE</h4>
          <button type="button" onClick={() => go('/')}>HOME</button>
          <button type="button" onClick={() => go('/projects')}>PROJECTS</button>
          <button type="button" onClick={() => go('/contact')}>CONTACT</button>
        </nav>
        <nav className="ground__col" aria-label="Elsewhere">
          <h4 className="ground__heading">ELSEWHERE</h4>
          <a href={IDENTITY.github} target="_blank" rel="noreferrer">GITHUB</a>
          <a href={IDENTITY.linkedin} target="_blank" rel="noreferrer">LINKEDIN</a>
          <a href={IDENTITY.medium} target="_blank" rel="noreferrer">MEDIUM</a>
          <a href={IDENTITY.resume} target="_blank" rel="noreferrer">RESUME</a>
        </nav>
      </div>
      <div className="ground__meta">
        <span>© {new Date().getFullYear()} BHAVYA KUMAR · ALL RIGHTS RESERVED</span>
      </div>
    </footer>
  )
}

export default Footer
