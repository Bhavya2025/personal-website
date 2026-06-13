import { useLocation } from 'react-router-dom'
import { useTransitionNav } from './transitionNav'

/** Fixed top bar: wordmark + page nav. */
function Hud() {
  const { navigateTo } = useTransitionNav()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header className="hud">
      <button
        type="button"
        className="hud__id"
        onClick={() => !isHome && navigateTo('/', 'swipe')}
      >
        <span className="hud__dot" aria-hidden="true" />
        BHAVYA KUMAR
      </button>

      <nav className="hud__nav" aria-label="Pages">
        <button
          type="button"
          className={`hud__link ${isHome ? 'is-current' : ''}`}
          onClick={() => !isHome && navigateTo('/', 'swipe')}
        >
          ABOUT ME
        </button>
        <button
          type="button"
          className={`hud__link ${pathname === '/projects' ? 'is-current' : ''}`}
          onClick={() => pathname !== '/projects' && navigateTo('/projects', 'swipe')}
        >
          PROJECTS
        </button>
        <button
          type="button"
          className={`hud__link ${pathname === '/contact' ? 'is-current' : ''}`}
          onClick={() => pathname !== '/contact' && navigateTo('/contact', 'swipe')}
        >
          CONTACT
        </button>
      </nav>
    </header>
  )
}

export default Hud
