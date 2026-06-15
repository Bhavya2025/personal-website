import { useRef } from 'react'
import { IDENTITY } from '../lib/missions'
import { EDUCATION } from '../lib/resume'
import BrandIcon from '../components/BrandIcon'
import { useTransitionNav } from '../components/transitionNav'
import { useDevOSNav } from '../devos/devosNav'
import pfp from '../assets/pfp.jpg'

function Hero() {
  const { navigateTo } = useTransitionNav()
  const { summon } = useDevOSNav()
  const pfpRef = useRef<HTMLImageElement>(null)

  // Both the photo and the button run the same cinematic: scan the portrait,
  // morph the page into the terminal, then open it.
  const launch = () => summon(pfpRef.current)

  return (
    <section className="hero" id="top">
      <div className="hero__main">
        <div className="hero__col">
          <p className="hero__eyebrow" data-reveal>
            <a href={EDUCATION.majorUrl} target="_blank" rel="noreferrer">
              Applied Mathematics
            </a>
            <span className="hero__eyebrow-sep" aria-hidden="true" />
            <a href={EDUCATION.schoolUrl} target="_blank" rel="noreferrer">
              University of Waterloo
            </a>
          </p>

          <h1 className="hero__name" data-reveal>
            <span className="hero__name-row">BHAVYA</span>
            <span className="hero__name-row">KUMAR</span>
          </h1>

          <nav className="hero__links" aria-label="Primary" data-reveal>
            <a className="btn btn--solid" href={IDENTITY.resume} target="_blank" rel="noreferrer">
              RESUME <span aria-hidden="true">↗</span>
            </a>
            <a className="btn" href={IDENTITY.github} target="_blank" rel="noreferrer">
              <BrandIcon name="github" /> GITHUB <span aria-hidden="true">↗</span>
            </a>
            <a className="btn" href={IDENTITY.linkedin} target="_blank" rel="noreferrer">
              <BrandIcon name="linkedin" /> LINKEDIN <span aria-hidden="true">↗</span>
            </a>
            <button
              type="button"
              className="btn"
              onClick={() => navigateTo('/contact', 'swipe')}
            >
              CONTACT <span aria-hidden="true">↗</span>
            </button>
          </nav>

          <p className="hero__status" data-reveal>
            <span className="hero__status-dot" aria-hidden="true" />
            <span>
              Open to <strong>co-op &amp; internship</strong> roles
            </span>
          </p>
        </div>

        <div className="hero__aside" data-reveal>
          <button
            type="button"
            className="hero__pfp-btn"
            aria-label="Boot the developer terminal"
            onClick={launch}
          >
            <span className="hero__pfp-frame" aria-hidden="true" />
            <img
              ref={pfpRef}
              className="hero__pfp"
              src={pfp}
              alt="Bhavya Kumar, in front of two radial aircraft engines"
              width="200"
              height="200"
            />
            <span className="hero__pfp-hint" aria-hidden="true">
              ⌖ ENTER OS
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero
