import type { Mission } from '../lib/missions'

const STATUS_CLASS: Record<Mission['status'], string> = {
  DEPLOYED: 'is-ok',
  HARDWARE: 'is-ok',
  'AWAITING DATA': 'is-dim',
  PLANNED: 'is-warn',
}

function MissionCard({ mission: m }: { mission: Mission }) {
  return (
    <li className="mission" data-reveal>
      <div className="mission__meta">
        <span className="mission__id">{m.id}</span>
        <span className="mission__year">{m.year}</span>
        <span className={`mission__status ${STATUS_CLASS[m.status]}`}>
          ● {m.status}
        </span>
      </div>
      <h3 className="mission__name">{m.name}</h3>
      <p className="mission__designation">{m.designation}</p>
      {m.image ? (
        <img
          className="mission__img"
          src={m.image.src}
          alt={m.image.alt}
          loading="lazy"
        />
      ) : null}
      <ul className="mission__brief">
        {m.brief.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <div className="mission__foot">
        <ul className="mission__stack" aria-label="Tech stack">
          {m.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {m.link ? (
          <a className="btn" href={m.link.href} target="_blank" rel="noreferrer">
            {m.link.label} <span aria-hidden="true">↗</span>
          </a>
        ) : null}
        {m.pending ? (
          <span className="mission__pending">⬜ pending: {m.pending}</span>
        ) : null}
      </div>
    </li>
  )
}

export default MissionCard
