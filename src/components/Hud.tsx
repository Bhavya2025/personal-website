import { useLocation } from 'react-router-dom'
import { useTransitionNav } from './transitionNav'

/** Minimal top nav — centered, just the two pages. */
function Hud() {
  const { navigateTo } = useTransitionNav()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header className="hud">
      <nav className="hud__nav" aria-label="Pages">
        <button
          type="button"
          className={`hud__link ${isHome ? 'is-current' : ''}`}
          onClick={() => !isHome && navigateTo('/', 'swipe')}
        >
          HOME
        </button>
        <span className="hud__sep" aria-hidden="true">·</span>
        <button
          type="button"
          className={`hud__link ${pathname === '/projects' ? 'is-current' : ''}`}
          onClick={() => pathname !== '/projects' && navigateTo('/projects', 'swipe')}
        >
          PROJECTS
        </button>
      </nav>
    </header>
  )
}

export default Hud
