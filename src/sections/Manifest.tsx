import Section from '../components/Section'
import BoidsSim from '../components/BoidsSim'
import BrandIcon from '../components/BrandIcon'
import { MISSIONS } from '../lib/missions'
import { useTransitionNav } from '../components/transitionNav'

const STATUS_CLASS: Record<string, string> = {
  DEPLOYED: 'is-ok',
  HARDWARE: 'is-ok',
  'AWAITING DATA': 'is-dim',
  PLANNED: 'is-dim',
}

/** Home "selected work" — a compact timeline of the built projects. The full
 * dossiers live on /projects (rendered there directly). */
function Manifest() {
  const { navigateTo } = useTransitionNav()
  const built = MISSIONS.filter((m) => m.status !== 'PLANNED')
  const planned = MISSIONS.filter((m) => m.status === 'PLANNED')

  const nextUp = planned.length ? (
    <p className="next-up" data-reveal>
      <span className="next-up__label">NEXT UP</span>
      <span className="next-up__items">{planned.map((m) => m.name).join('  ·  ')}</span>
    </p>
  ) : null

  return (
    <Section index="03" title="PROJECTS" caption="SELECTED WORK" id="projects">
      <ol className="tl">
        {built.map((m) => (
          <li className="tl__row" key={m.id}>
            <span className="tl__node" aria-hidden="true" />
            <button
              type="button"
              className="brief-card"
              data-reveal
              aria-label={`Open ${m.name} project details`}
              onClick={() => navigateTo(`/projects?focus=${m.id}`, 'swipe')}
            >
              {m.demo === 'boids' ? (
                <span className="brief-card__thumb-wrap brief-card__thumb-wrap--sim" aria-hidden="true">
                  <BoidsSim interactive={false} />
                </span>
              ) : m.image ? (
                <span className="brief-card__thumb-wrap" aria-hidden="true">
                  <img
                    className="brief-card__thumb"
                    src={m.image.src}
                    alt=""
                    loading="lazy"
                  />
                </span>
              ) : null}
              <span className="brief-card__body">
                <span className="brief-card__head">
                  <span className="brief-card__name">{m.name}</span>
                  <span className="brief-card__meta">
                    <span className="brief-card__year">{m.year}</span>
                    <span className={`brief-card__status ${STATUS_CLASS[m.status] ?? ''}`}>
                      ● {m.status}
                    </span>
                  </span>
                </span>
                <span className="brief-card__line">{m.designation}</span>
                <span className="brief-card__stack" aria-hidden="true">
                  {m.stack.map((s) => (
                    <span className="brief-card__tag" key={s}>
                      <BrandIcon name={s} size={12} />
                      {s}
                    </span>
                  ))}
                </span>
              </span>
              <span className="brief-card__cue" aria-hidden="true">
                OPEN <span className="brief-card__arrow">→</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {nextUp}
      <div className="missions__more" data-reveal>
        <button
          type="button"
          className="btn btn--solid"
          onClick={() => navigateTo('/projects', 'swipe')}
        >
          ALL PROJECTS <span aria-hidden="true">→</span>
        </button>
      </div>
    </Section>
  )
}

export default Manifest
