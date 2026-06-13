import Section from '../components/Section'
import { ACHIEVEMENTS } from '../lib/resume'

function Achievements() {
  return (
    <Section index="04" code="" title="ACHIEVEMENTS" id="achievements">
      <ul className="records">
        {ACHIEVEMENTS.map((a) => (
          <li className="records__row" data-reveal key={a.tag}>
            <span className="records__tag">{a.tag}</span>
            <span className="records__text">{a.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export default Achievements
