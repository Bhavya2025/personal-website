import type { Mission } from '../lib/missions'
import BoidsSim from './BoidsSim'

/** Status pill colour intent (serious labels, no mission cosplay). */
const STATUS_CLASS: Record<Mission['status'], string> = {
  DEPLOYED: 'is-ok',
  HARDWARE: 'is-ok',
  'AWAITING DATA': 'is-dim',
  PLANNED: 'is-dim',
}

/** Human-readable status text shown to recruiters. */
const STATUS_LABEL: Record<Mission['status'], string> = {
  DEPLOYED: 'LIVE',
  HARDWARE: 'BUILT',
  'AWAITING DATA': 'ARCHIVED',
  PLANNED: 'PLANNED',
}

/** Plain group labels. */
const GROUP_LABEL: Record<Mission['group'], string> = {
  SOFTWARE: 'SOFTWARE',
  HARDWARE: 'HARDWARE',
  GAMES: 'GAME',
  PLANNED: 'PLANNED',
}

interface MissionCardProps {
  mission: Mission
  /** 1-based position in the list, shown as a quiet index in the meta rail. */
  index?: number
}

/** A full project dossier on /projects: meta rail + content body. */
function MissionCard({ mission: m, index = 0 }: MissionCardProps) {
  const idx = String(index).padStart(2, '0')

  return (
    <li className="dossier" id={`mission-${m.id}`} data-reveal>
      <div className="dossier__rail">
        <span className="dossier__index">{idx}</span>
        <span className="dossier__year">{m.year}</span>
        <span className="dossier__yearlabel">Year</span>
        <span className="dossier__group">{GROUP_LABEL[m.group]}</span>
        <span className={`dossier__status ${STATUS_CLASS[m.status]}`}>
          {STATUS_LABEL[m.status]}
        </span>
      </div>

      <div className="dossier__body">
        <h3 className="dossier__name">{m.name}</h3>
        <p className="dossier__designation">{m.designation}</p>

        {m.demo === 'boids' ? (
          <BoidsSim />
        ) : m.demo === 'itch' && m.link ? (
          <div className="dossier__media">
            <span className="dossier__media-tag">Playable</span>
            <iframe
              src="https://itch.io/embed-upload/4062803?color=0a0a0a"
              className="dossier__itch-frame"
              title={m.name}
              allow="autoplay; fullscreen; gamepad"
              allowFullScreen
            />
          </div>
        ) : m.image ? (
          <div className="dossier__media">
            <img
              className="dossier__img"
              src={m.image.src}
              alt={m.image.alt}
              loading="lazy"
            />
          </div>
        ) : null}

        <ul className="dossier__brief">
          {m.brief.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        <div className="dossier__foot">
          <ul className="dossier__stack" aria-label="Tech stack">
            {m.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <div className="dossier__actions">
            {m.pending ? (
              <span className="dossier__pending">pending: {m.pending}</span>
            ) : null}
            {m.link ? (
              <a
                className="btn dossier__link"
                href={m.link.href}
                target="_blank"
                rel="noreferrer"
              >
                {m.link.label} <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}

export default MissionCard
