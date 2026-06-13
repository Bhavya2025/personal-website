import { IDENTITY } from '../lib/missions'
import BrandIcon from '../components/BrandIcon'
import pfp from '../assets/pfp.jpg'

function Hero() {
  return (
    <section className="hero" id="top">
      <p className="hero__eyebrow" data-reveal>
        {IDENTITY.school}
      </p>
      <div className="hero__idrow" data-reveal>
        <h1 className="hero__name">
          <span className="hero__name-row">BHAVYA</span>
          <span className="hero__name-row hero__name-row--accent">KUMAR</span>
        </h1>
        <img
          className="hero__pfp"
          src={pfp}
          alt="Bhavya Kumar, in front of two radial aircraft engines"
          width="200"
          height="200"
        />
      </div>
      <div className="hero__sub" data-reveal>
        <p className="hero__line">{IDENTITY.line}</p>
        <nav className="hero__links" aria-label="Primary">
          <a className="btn" href={IDENTITY.resume} target="_blank" rel="noreferrer">
            RESUME <span aria-hidden="true">↗</span>
          </a>
          <a className="btn" href={IDENTITY.github} target="_blank" rel="noreferrer">
            <BrandIcon name="github" /> GITHUB <span aria-hidden="true">↗</span>
          </a>
          <a className="btn" href={IDENTITY.linkedin} target="_blank" rel="noreferrer">
            <BrandIcon name="linkedin" /> LINKEDIN <span aria-hidden="true">↗</span>
          </a>
          <a className="btn btn--solid" href={`mailto:${IDENTITY.email}`}>
            CONTACT
          </a>
        </nav>
      </div>
    </section>
  )
}

export default Hero
