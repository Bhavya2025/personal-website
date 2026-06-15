import Section from '../components/Section'
import BrandIcon from '../components/BrandIcon'
import { SKILLS } from '../lib/resume'

/** Technical skills as logo chips. */
function Skills() {
  return (
    <Section index="02" title="SKILLS" caption="LANGUAGES · TOOLS · STACK" id="skills">
      <div className="skills">
        {SKILLS.map((group) => (
          <div className="skills__group" data-reveal key={group.label}>
            <h3 className="skills__label">{group.label}</h3>
            <ul className="skills__chips">
              {group.items.map((item) => (
                <li className="chip" key={item}>
                  <BrandIcon name={item} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default Skills
