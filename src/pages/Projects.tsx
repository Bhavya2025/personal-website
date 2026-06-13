import TransitSky from '../components/TransitSky'
import Manifest from '../sections/Manifest'
import Rover from '../components/Rover'
import { usePageReveals } from '../hooks/usePageReveals'
import { useTransitionNav } from '../components/transitionNav'

/** All projects, as full dossiers. */
function Projects() {
  usePageReveals()
  const { navigateTo } = useTransitionNav()

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
          ← ABOUT ME
        </button>
      </section>

      <Manifest />

      <section className="manifest-end">
        <Rover />
      </section>
    </main>
  )
}

export default Projects
