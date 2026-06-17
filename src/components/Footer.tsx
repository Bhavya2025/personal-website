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

  // Easter egg: the little retro computer boots the Dev OS — jump home + to the
  // top, then auto-trigger the hero photo (which runs the scan→terminal summon).
  const bootFromDesktop = () => {
    if (pathname !== '/') navigateTo('/', 'swipe')
    let tries = 0
    const fire = () => {
      const pfp = document.querySelector<HTMLButtonElement>('.hero__pfp-btn')
      if (pfp) {
        lenisStore.current?.scrollTo(0, { immediate: true })
        pfp.click()
        return
      }
      if (tries++ < 40) window.setTimeout(fire, 80)
    }
    window.setTimeout(fire, pathname === '/' ? 80 : 600)
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
        <button
          type="button"
          className="ground__boot"
          onClick={bootFromDesktop}
          aria-label="Boot the developer terminal"
          title="boot…"
        >
          <svg viewBox="0 0 46 40" width="40" height="35" aria-hidden="true" focusable="false">
            {/* CRT housing */}
            <rect x="6" y="2.5" width="34" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" />
            {/* glowing screen */}
            <rect className="ground__boot-screen" x="9" y="5.5" width="28" height="13.5" />
            {/* terminal prompt > _ */}
            <path d="M12.5 15.4 L15.6 12.5 L12.5 9.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="17.6" y="13.4" width="5" height="2" fill="currentColor" />
            {/* neck + base */}
            <rect x="20" y="24.5" width="6" height="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <rect x="14" y="27.5" width="18" height="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
            {/* keyboard */}
            <rect x="5" y="32" width="36" height="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <line x1="9" y1="34.7" x2="37" y2="34.7" stroke="currentColor" strokeWidth="1" opacity="0.55" />
          </svg>
        </button>
      </div>
    </footer>
  )
}

export default Footer
