import Section from '../components/Section'
import { IDENTITY } from '../lib/missions'

function Comms() {
  return (
    <Section index="05" code="" title="CONTACT" id="contact" tone="dark">
      <div className="comms" data-reveal>
        <a className="comms__primary" href={`mailto:${IDENTITY.email}`}>
          {IDENTITY.email}
        </a>
        <div className="comms__links">
          <a className="btn" href={IDENTITY.github} target="_blank" rel="noreferrer">
            GITHUB <span aria-hidden="true">↗</span>
          </a>
          <a className="btn" href={IDENTITY.linkedin} target="_blank" rel="noreferrer">
            LINKEDIN <span aria-hidden="true">↗</span>
          </a>
          <a className="btn" href={IDENTITY.resume} target="_blank" rel="noreferrer">
            RESUME <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </Section>
  )
}

export default Comms
