import Section from '../components/Section'
import { EDUCATION, EXPERIENCE } from '../lib/resume'

/** Education + experience — the serious stuff, front and center. */
function Background() {
  return (
    <Section index="01" code="" title="BACKGROUND" id="background">
      <div className="background">
        <article className="edu" data-reveal>
          <header className="edu__head">
            <div>
              <h3 className="edu__school">{EDUCATION.school}</h3>
              <p className="edu__degree">{EDUCATION.degree}</p>
              <p className="edu__major">{EDUCATION.major}</p>
            </div>
            <div className="edu__when">
              <span>{EDUCATION.period}</span>
              <span>{EDUCATION.location}</span>
            </div>
          </header>
          <p className="edu__award">★ {EDUCATION.award}</p>
          <ul className="edu__courses" aria-label="Relevant coursework">
            {EDUCATION.coursework.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </article>

        <div className="xp">
          {EXPERIENCE.map((e) => (
            <article className="xp__entry" data-reveal key={e.org}>
              <header className="xp__head">
                <h3 className="xp__org">{e.org}</h3>
                <span className="xp__period">{e.period}</span>
              </header>
              <p className="xp__role">{e.role}</p>
              <p className="xp__summary">{e.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  )
}

export default Background
