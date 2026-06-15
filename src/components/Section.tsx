import type { ReactNode } from 'react'

interface SectionProps {
  /** Two-digit section marker shown in the header (e.g. "01"). Optional. */
  index?: string
  /** Retained for callers/anchors; no longer rendered (decorative codes dropped). */
  code?: string
  title: string
  /** Optional short mono caption shown to the right of the title rule. */
  caption?: string
  children: ReactNode
  id?: string
  /** 'dark' when the section sits on the bright daylight sky */
  tone?: 'light' | 'dark'
}

/** Shared section shell: instrument-panel header row + content. */
function Section({ index, title, caption, children, id, tone = 'light' }: SectionProps) {
  return (
    <section className={`section ${tone === 'dark' ? 'section--dark' : ''}`} id={id}>
      <div className="section__head" data-reveal>
        <div className="section__heading">
          {index ? (
            <span className="section__index" aria-hidden="true">
              {index}
            </span>
          ) : null}
          <h2 className="section__title">{title}</h2>
        </div>
        <span className="section__rule" aria-hidden="true" />
        {caption ? <span className="section__caption">{caption}</span> : null}
      </div>
      {children}
    </section>
  )
}

export default Section
