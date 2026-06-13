import { IDENTITY } from '../lib/missions'
import { EDUCATION } from '../lib/resume'
import BrandIcon from '../components/BrandIcon'
import { lenisStore } from '../hooks/useSmoothScroll'
import pfp from '../assets/pfp.jpg'

function Hero() {
  const toContact = () =>
    lenisStore.current?.scrollTo('#contact', { offset: -70, duration: 1.2 })

  return (
    <section className="hero" id="top">
      <p className="hero__eyebrow" data-reveal>
        <a href={EDUCATION.majorUrl} target="_blank" rel="noreferrer">
          Applied Mathematics
        </a>
        <span aria-hidden="true"> · </span>
        <a href={EDUCATION.schoolUrl} target="_blank" rel="noreferrer">
          University of Waterloo
        </a>
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
          <button type="button" className="btn btn--solid" onClick={toContact}>
            CONTACT ↓
          </button>
        </nav>
      </div>
    </section>
  )
}

export default Hero
