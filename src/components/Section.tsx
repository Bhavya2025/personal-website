import type { ReactNode } from 'react'

interface SectionProps {
  index: string
  code: string
  title: string
  children: ReactNode
  id?: string
  /** 'dark' when the section sits on the bright daylight sky */
  tone?: 'light' | 'dark'
}

/** Shared section shell: numbered header row + ruled separator. */
function Section({ index, code, title, children, id, tone = 'light' }: SectionProps) {
  return (
    <section className={`section ${tone === 'dark' ? 'section--dark' : ''}`} id={id}>
      <div className="section__head" data-reveal>
        <span className="section__index">{index}</span>
        {code ? <span className="section__code">{code}</span> : null}
        <h2 className="section__title">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default Section
