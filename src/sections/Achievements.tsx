import Section from '../components/Section'
import { ACHIEVEMENTS } from '../lib/resume'

function Achievements() {
  return (
    <Section index="04" title="ACHIEVEMENTS" caption="AWARDS · RECOGNITION" id="achievements">
      <ul className="records">
        {ACHIEVEMENTS.map((a) =>
          a.href ? (
            <li key={a.tag}>
              <a
                className="records__row records__row--link"
                href={a.href}
                target="_blank"
                rel="noreferrer"
                data-reveal
              >
                <span className="records__tag">{a.tag}</span>
                <span className="records__text">
                  {a.text} <span aria-hidden="true">↗</span>
                </span>
              </a>
            </li>
          ) : (
            <li className="records__row" data-reveal key={a.tag}>
              <span className="records__tag">{a.tag}</span>
              <span className="records__text">{a.text}</span>
            </li>
          ),
        )}
      </ul>
    </Section>
  )
}

export default Achievements
