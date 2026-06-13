import Section from '../components/Section'
import MissionCard from '../components/MissionCard'
import BrandIcon from '../components/BrandIcon'
import { MISSIONS } from '../lib/missions'
import { useTransitionNav } from '../components/transitionNav'

const STATUS_CLASS: Record<string, string> = {
  DEPLOYED: 'is-ok',
  HARDWARE: 'is-ok',
  'AWAITING DATA': 'is-dim',
  PLANNED: 'is-dim',
}

interface ManifestProps {
  /** Timeline of compact cards (home page). Full dossiers otherwise. */
  brief?: boolean
}

/** Projects — a flight-path timeline on home, full mission files on /projects. */
function Manifest({ brief }: ManifestProps) {
  const { navigateTo } = useTransitionNav()

  if (!brief) {
    return (
      <Section index="01" code="" title="PROJECTS" id="projects">
        <ul className="missions">
          {MISSIONS.map((m) => (
            <MissionCard mission={m} key={m.id} />
          ))}
        </ul>
      </Section>
    )
  }

  return (
    <Section index="03" code="" title="PROJECTS" id="projects">
      <ol className="tl">
        {MISSIONS.map((m, i) => (
          <li
            className={`tl__item ${m.status === 'PLANNED' ? 'tl__item--planned' : ''}`}
            key={m.id}
          >
            <span className="tl__node" aria-hidden="true" />
            <article
              className="brief-card"
              data-reveal={i % 2 === 0 ? 'left' : 'right'}
            >
              {m.image ? (
                <img
                  className="brief-card__img"
                  src={m.image.src}
                  alt={m.image.alt}
                  loading="lazy"
                />
              ) : null}
              <div className="brief-card__meta">
                <span className="brief-card__id">{m.id}</span>
                <span className={`brief-card__status ${STATUS_CLASS[m.status] ?? ''}`}>
                  ● {m.status}
                </span>
              </div>
              <h3 className="brief-card__name">{m.name}</h3>
              <p className="brief-card__line">{m.designation}</p>
              <ul className="brief-card__stack" aria-label="Tech stack">
                {m.stack.map((s) => (
                  <li key={s}>
                    <BrandIcon name={s} size={12} />
                    {s}
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ol>
      <div className="missions__more" data-reveal>
        <button
          type="button"
          className="btn btn--solid"
          onClick={() => navigateTo('/projects', 'swipe')}
        >
          FULL MISSION FILES <span aria-hidden="true">→</span>
        </button>
      </div>
    </Section>
  )
}

export default Manifest
