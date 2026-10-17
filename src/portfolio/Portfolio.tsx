import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useParams } from 'react-router-dom'
import { IDENTITY } from '../lib/missions'
import { EDUCATION, EXPERIENCE } from '../lib/resume'
import { PROJECTS, SELECTED_PROJECTS } from './data'
import type { PortfolioProject } from './data'
import './portfolio.css'

function Arrow() {
  return <span aria-hidden="true" className="link-arrow">↗</span>
}

function OutsideLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}<Arrow /></a>
}

function SiteHeader() {
  const { pathname, hash } = useLocation()
  return <header className="site-header">
    <Link to="/" className="site-brand" aria-label="Bhavya Kumar, home">
      <svg width="35" height="35" viewBox="0 0 45 45" aria-hidden="true"><path d="M8 8v29h11c12 0 12-15 0-15H8M28 8v29m12-21L28 28l12 9" fill="none" stroke="currentColor" strokeWidth="2.3" /></svg>
      <span>Bhavya Kumar</span>
    </Link>
    <nav aria-label="Main navigation">
      <Link to="/#experience" aria-current={pathname === '/' && hash === '#experience' ? 'location' : undefined}>Experience</Link>
      <NavLink to="/projects/taskly">Taskly</NavLink>
      <NavLink to="/contact">Contact</NavLink>
    </nav>
  </header>
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname, hash, key } = useLocation()
  useEffect(() => {
    const project = PROJECTS.find(item => pathname === `/projects/${item.slug}`)
    document.title = pathname === '/' ? 'Bhavya Kumar — Software & Applied Mathematics' : project ? `${project.title} — Bhavya Kumar` : pathname === '/contact' ? 'Contact — Bhavya Kumar' : 'Page not found — Bhavya Kumar'
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = `https://bhavyakumar.ca${pathname}`
    const frame = requestAnimationFrame(() => {
      const target = hash ? document.getElementById(hash.slice(1)) : null
      if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'instant' })
      const focusTarget = target ?? document.getElementById('main')
      if (focusTarget) {
        focusTarget.tabIndex = -1
        focusTarget.focus({ preventScroll: true })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash, key])
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <div className="site-shell">
      <SiteHeader />
      {children}
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Bhavya Kumar</span>
        <div><OutsideLink href="https://github.com/Bhavya2025/personal-website">Site source</OutsideLink><a href="#main">Back to top ↑</a></div>
      </footer>
    </div>
  </>
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="section-heading">{children}</h2>
}

function ProjectLinks({ project }: { project: PortfolioProject }) {
  return <div className="project-links">
    {project.link && <OutsideLink href={project.link.href}>Open live app</OutsideLink>}
    {project.repo && <OutsideLink href={project.repo.href}>Source code</OutsideLink>}
  </div>
}

function ProjectVisual({ project }: { project: PortfolioProject }) {
  const [failed, setFailed] = useState(false)
  if (!project.image) return null
  return <figure className="project-image">
    {failed ? <div className="image-fallback" role="status"><strong>Screenshot unavailable</strong><p>{project.image.alt}. The project description, source code, and live app are still available.</p></div> : <img src={project.image.src} alt={project.image.alt} width={1280} height={631} loading="lazy" onError={() => setFailed(true)} />}
    <figcaption><span>Taskly’s board interface</span>{!failed && <OutsideLink href={project.image.src}>View full-size screenshot</OutsideLink>}</figcaption>
  </figure>
}

function ContactEnding() {
  return <section className="contact-ending" aria-labelledby="contact-title">
    <h2 id="contact-title">Get in touch</h2>
    <p>I’m interested in software engineering co-op and internship roles, with a flexible start date.</p>
    <a className="contact-address" href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}<Arrow /></a>
  </section>
}

export function HomePage() {
  return <main id="main" tabIndex={-1}>
    <header className="intro">
      <p className="eyebrow">Software engineering · Applied mathematics</p>
      <h1>Bhavya Kumar</h1>
      <p className="intro-role">Software engineering intern at ToadEx.<br />Applied mathematics student at the University of Waterloo.</p>
      <p className="intro-text">I work on Python middleware for restaurant kiosks. My personal project, Taskly, explores task management, undo/redo, and natural-language commands.</p>
      <p className="availability">Available for internships year-round; I can adjust my study schedule.</p>
      <div className="intro-links"><a href={`mailto:${IDENTITY.email}`}>Email me <Arrow /></a><OutsideLink href={IDENTITY.github}>GitHub</OutsideLink><OutsideLink href={IDENTITY.linkedin}>LinkedIn</OutsideLink></div>
    </header>
    <section className="page-section" id="experience">
      <SectionHeading>Experience</SectionHeading>
      {EXPERIENCE.map(entry => <article className="experience-entry" key={entry.org}>
        <div className="entry-heading"><div><h3>{entry.org}</h3><p className="experience-role">{entry.role}</p></div><p className="entry-period">{entry.period}</p></div>
        <p>{entry.summary}</p>
        {entry.bullets && <ul className="contributions">{entry.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>}
      </article>)}
    </section>
    <section className="page-section" id="work">
      <SectionHeading>Personal project</SectionHeading>
      {SELECTED_PROJECTS.map(project => <article className="work-entry" id={`project-${project.id}`} key={project.id}>
        <div className="entry-heading"><h3>Taskly</h3><span className="entry-period">Web application · {project.year}</span></div>
        <p className="work-overview">{project.overview}</p>
        <p>{project.detail}</p>
        <p className="project-takeaway"><strong>The engineering problem:</strong> manual edits and AI commands need to update the same board without bypassing undo history.</p>
        <p className="technology-note">React · Supabase · Groq API · Vercel</p>
        <div className="work-actions"><Link to="/projects/taskly" className="case-study-link">Read the engineering case study <span aria-hidden="true">→</span></Link><ProjectLinks project={project} /></div>
        <ProjectVisual project={project} />
      </article>)}
    </section>
    <section className="page-section about-section" id="about">
      <SectionHeading>Education</SectionHeading>
      <h3>{EDUCATION.school}</h3><p>{EDUCATION.degree}</p><p>{EDUCATION.major}</p>
      <p className="entry-period">{EDUCATION.period}</p><p className="education-award">{EDUCATION.award}</p>
    </section>
    <ContactEnding />
  </main>
}

function CommandFlow() {
  return <figure className="command-example">
    <figcaption>Illustrative command · a board with a “Write tests” task and a “Done” column</figcaption>
    <blockquote>“Move Write tests to Done.”</blockquote>
    <ol className="command-flow">
      <li><strong>Parse</strong><span>Request a structured move-task action from the model.</span></li>
      <li><strong>Resolve</strong><span>Match the task and column names to board IDs.</span></li>
      <li><strong>Commit</strong><span>Apply the move through the board’s shared update path.</span></li>
    </ol>
    <p>The move enters undo history; authenticated board changes schedule a cloud save after a 500 ms pause. This explains the code path, rather than showing a live model response.</p>
  </figure>
}

export function ProjectPage() {
  const { slug } = useParams()
  const project = PROJECTS.find(item => item.slug === slug)
  if (!project) return <NotFoundPage />
  return <main id="main" tabIndex={-1}>
    <header className="project-intro">
      <Link to="/#work" className="back-link">← Back to home</Link>
      <p className="eyebrow">Personal project · Web application · {project.year}</p>
      <h1>{project.title}</h1>
      <p className="project-lead">{project.overview}</p><p>{project.detail}</p>
      <ProjectLinks project={project} />
    </header>
    <dl className="project-spec"><div><dt>Built with</dt><dd>React, Supabase, Groq API, Vercel</dd></div><div><dt>Scope</dt><dd>Personal application with a public demo and source repository.</dd></div></dl>
    <section className="case-section"><h2>The problem</h2><p>A task board can be edited by dragging a card, using a form, or asking an assistant. Each route needs to update the same state and preserve a way to undo the change. I built Taskly around that shared update path.</p></section>
    <CommandFlow />
    <div className="implementation-notes">{project.sections.map(section => <section className="case-section" key={section.title}><h2>{section.title}</h2><p>{section.text}</p>{section.evidence && <OutsideLink href={section.evidence.href}>{section.evidence.label}</OutsideLink>}</section>)}</div>
    <ProjectVisual key={project.id} project={project} />
    <section className="case-section project-boundaries"><h2>What I’d improve next</h2><p>The current column matcher falls back to the first column when it cannot find a strong match. I’d replace that fallback with an explicit clarification before applying a command.</p><p>I’d also add automated checks for undo after an AI action, failed cloud saves, and conflicting edits. The public repository does not include a test suite or a performance benchmark; the implementation above is code evidence, not a claim of production reliability.</p></section>
    <p className="source-note">Implementation links refer to the public code inspected on 17 October 2026. The command above is a worked example, not a recorded test result.</p>
    <ContactEnding />
  </main>
}

export function ContactPage() {
  return <main id="main" className="contact-page" tabIndex={-1}>
    <header className="page-intro"><p className="eyebrow">Contact</p><h1>Get in touch</h1><p>Available for internships year-round; I can adjust my study schedule. For software engineering co-op and internship opportunities, email me.</p></header>
    <a className="contact-page-address" href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}<Arrow /></a>
    <div className="contact-directory"><OutsideLink href={IDENTITY.github}><span><strong>GitHub</strong><span>Projects and source code</span></span></OutsideLink><OutsideLink href={IDENTITY.linkedin}><span><strong>LinkedIn</strong><span>Professional profile</span></span></OutsideLink></div>
  </main>
}

export function NotFoundPage() {
  const removedDocument = useLocation().pathname.toLowerCase().endsWith('.pdf')
  return <main id="main" tabIndex={-1}><div className="page-intro not-found"><p className="eyebrow">Page unavailable</p><h1>{removedDocument ? 'This file is no longer available.' : 'No page here.'}</h1><p>{removedDocument ? 'You can read my experience on the home page or contact me directly.' : 'The address may have changed. You can return home or read about Taskly.'}</p><div className="project-links"><Link to="/">Back to home →</Link><Link to="/contact">Contact →</Link></div></div></main>
}
