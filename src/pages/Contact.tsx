import { useState } from 'react'
import BrandIcon from '../components/BrandIcon'
import { usePageReveals } from '../hooks/usePageReveals'
import { IDENTITY } from '../lib/missions'
import './contact.css'

/**
 * Contact — a calm, single-column instrument plate on the dark space theme.
 * Header + availability up top, email as the clear primary action, then a
 * compact channel row. Single column composition: nothing can collide.
 * Full-bleed, ends dark.
 */
function Contact() {
  usePageReveals()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(IDENTITY.email).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main>
      <section className="ctc" id="contact" aria-labelledby="ctc-title">
        <div className="ctc__frame">
          {/* corner ticks */}
          <span className="ctc__tick ctc__tick--tl" aria-hidden="true" />
          <span className="ctc__tick ctc__tick--tr" aria-hidden="true" />
          <span className="ctc__tick ctc__tick--bl" aria-hidden="true" />
          <span className="ctc__tick ctc__tick--br" aria-hidden="true" />

          {/* ---------- HEADER ---------- */}
          <header className="ctc__head" data-reveal="up">
            <div className="ctc__meta">
              <span className="ctc__eyebrow">CONTACT</span>
              <span className="ctc__rule" aria-hidden="true" />
              <span className="ctc__status">
                <span className="ctc__dot" aria-hidden="true" />
                OPEN FOR CO-OPS &amp; INTERNSHIPS
              </span>
            </div>

            <h1 className="ctc__title" id="ctc-title">
              LET&rsquo;S CONNECT
            </h1>

            <p className="ctc__blurb">
              I&rsquo;m looking for co-op and internship roles across software,
              math, and AI, and I like working with people I can learn from.
              Email is the best way to reach me, and I write back quickly.
            </p>

            <div className="ctc__head-cta">
              <a
                className="ctc__resume"
                href={IDENTITY.resume}
                target="_blank"
                rel="noreferrer"
              >
                <span className="ctc__resume-tag" aria-hidden="true">PDF</span>
                VIEW RESUME
                <span className="ctc__resume-go" aria-hidden="true">&#8599;</span>
              </a>
            </div>
          </header>

          {/* ---------- PRIMARY: email ---------- */}
          <div className="ctc__primary" data-reveal="up">
            <a className="ctc__primary-link" href={`mailto:${IDENTITY.email}`}>
              <span className="ctc__chan-label">EMAIL</span>
              <span className="ctc__email">{IDENTITY.email}</span>
            </a>
            <button
              type="button"
              className={`ctc__copy ${copied ? 'is-copied' : ''}`}
              onClick={handleCopy}
              aria-live="polite"
            >
              {copied ? 'COPIED ✓' : 'COPY ADDRESS'}
            </button>
          </div>

          {/* ---------- SECONDARY: channels ---------- */}
          <nav className="ctc__channels" aria-label="Profiles and links">
            <ul className="ctc__list">
              <li data-reveal="up">
                <a
                  className="ctc__row"
                  href={IDENTITY.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="ctc__row-icon" aria-hidden="true">
                    <BrandIcon name="github" size={18} />
                  </span>
                  <span className="ctc__row-name">GITHUB</span>
                  <span className="ctc__row-go" aria-hidden="true">
                    &#8599;
                  </span>
                </a>
              </li>
              <li data-reveal="up">
                <a
                  className="ctc__row"
                  href={IDENTITY.linkedin}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="ctc__row-icon" aria-hidden="true">
                    <BrandIcon name="linkedin" size={18} />
                  </span>
                  <span className="ctc__row-name">LINKEDIN</span>
                  <span className="ctc__row-go" aria-hidden="true">
                    &#8599;
                  </span>
                </a>
              </li>
              <li data-reveal="up">
                <a
                  className="ctc__row"
                  href={IDENTITY.medium}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span
                    className="ctc__row-icon ctc__row-icon--text"
                    aria-hidden="true"
                  >
                    M
                  </span>
                  <span className="ctc__row-name">MEDIUM</span>
                  <span className="ctc__row-go" aria-hidden="true">
                    &#8599;
                  </span>
                </a>
              </li>
            </ul>
          </nav>

          {/* ---------- IDENTITY ---------- */}
          <dl className="ctc__id" data-reveal="up">
            <div className="ctc__id-row">
              <dt>NAME</dt>
              <dd>Bhavya Kumar</dd>
            </div>
            <div className="ctc__id-row">
              <dt>BASE</dt>
              <dd>University of Waterloo</dd>
            </div>
            <div className="ctc__id-row">
              <dt>FIELD</dt>
              <dd>
                Applied Mathematics with Scientific Computing and Scientific
                Machine Learning
              </dd>
            </div>
          </dl>

          <div className="ctc__footnote" aria-hidden="true">
            <span>BHAVYA KUMAR</span>
            <span>WATERLOO, ON</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Contact
