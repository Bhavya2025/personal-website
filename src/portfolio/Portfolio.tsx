import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useParams } from 'react-router-dom'
import { IDENTITY } from '../lib/missions'
import { EDUCATION, EXPERIENCE } from '../lib/resume'
import { HERO, PROJECTS, SELECTED_PROJECTS, SYSTEMS_PROJECTS, TASKLY_CHALLENGE, TECHNICAL_STACK } from './data'
import type { PortfolioProject } from './data'
import './portfolio.css'

function Arrow() {
  return <span aria-hidden="true" className="link-arrow">↗</span>
}

function OutsideLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}<Arrow /></a>
}

function ResumeLink({ className = '' }: { className?: string }) {
  return <OutsideLink href={IDENTITY.resume} className={`pill pill-dark ${className}`}>Resume<span className="sr-only"> (PDF)</span></OutsideLink>
}

function SiteHeader() {
  const { pathname, hash } = useLocation()
  const architectureActive = pathname === '/projects/taskly' && hash === '#architecture'
  const projectsActive = (pathname === '/' && (hash === '#projects' || hash.startsWith('#project-'))) || (pathname.startsWith('/projects') && !architectureActive)
  return <header className="site-header">
    <Link to="/" className="site-brand" aria-label="Bhavya Kumar, home">
      <svg width="35" height="35" viewBox="0 0 45 45" aria-hidden="true"><path d="M8 8v29h11c12 0 12-15 0-15H8M28 8v29m12-21L28 28l12 9" fill="none" stroke="currentColor" strokeWidth="2.3" /></svg>
      <span>Bhavya Kumar</span>
    </Link>
    <nav aria-label="Main navigation">
      <Link to="/#experience" aria-current={pathname === '/' && hash === '#experience' ? 'location' : undefined}>Experience</Link>
      <Link to="/#projects" aria-current={projectsActive ? 'location' : undefined}>Projects</Link>
      <Link to="/projects/taskly#architecture" aria-current={architectureActive ? 'location' : undefined}>Architecture</Link>
      <NavLink to="/contact">Contact</NavLink>
    </nav>
    <ResumeLink className="header-resume" />
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
      const focusTarget = target && target.id !== 'main'
        ? target.querySelector<HTMLElement>('h2, h3') ?? target
        : document.getElementById('main')
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

function EditorialSection({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode }) {
  return <section className="editorial-section" id={id} aria-labelledby={`${id}-title`}>
    <div className="section-label"><h2 id={`${id}-title`}><span>{number} /</span> {title}</h2></div>
    <div className="section-content">{children}</div>
  </section>
}

function TechnologyTags({ items }: { items: readonly string[] }) {
  return <ul className="technology-tags" aria-label="Technologies">{items.map(item => <li key={item}>{item}</li>)}</ul>
}

function ProjectLinks({ project }: { project: PortfolioProject }) {
  return <div className="project-links">
    {project.link && <OutsideLink href={project.link.href} className="pill">Live App</OutsideLink>}
    {project.repo && <OutsideLink href={project.repo.href} className="pill">Source</OutsideLink>}
  </div>
}

function ProjectVisual({ project }: { project: PortfolioProject }) {
  const [failed, setFailed] = useState(false)
  if (!project.image) return null
  return <figure className="project-image">
    <div className="browser-frame">
      <div className="browser-bar" aria-hidden="true"><span className="browser-controls"><i /><i /><i /></span><span>Taskly / Board</span></div>
      {failed ? <div className="image-fallback" role="status"><strong>Screenshot unavailable</strong><p>{project.image.alt}. The description, source code, and live app are still available.</p></div> : <img src={project.image.src} alt={project.image.alt} width={1280} height={631} loading="lazy" onError={() => setFailed(true)} />}
    </div>
    <figcaption><span>Taskly’s board interface</span>{!failed && <OutsideLink href={project.image.src}>View full-size screenshot</OutsideLink>}</figcaption>
  </figure>
}

function FeaturedProject({ project }: { project: PortfolioProject }) {
  return <article className="featured-project" id={`project-${project.id}`}>
    <div className="entry-heading"><div><p className="eyebrow">Featured case study</p><h3>{project.title}</h3></div><span className="entry-period">{project.year} / Web app</span></div>
    <p className="work-overview">{project.overview}</p><p>{project.detail}</p>
    <TechnologyTags items={project.stack} />
    <div className="engineering-challenge"><p className="small-label">Engineering Challenge</p><p>{TASKLY_CHALLENGE}</p></div>
    <div className="work-actions"><Link to="/projects/taskly" className="pill pill-dark">Engineering Case Study <span aria-hidden="true">→</span></Link><ProjectLinks project={project} /></div>
    <ProjectVisual project={project} />
  </article>
}

function SystemsGrid() {
  return <div className={`systems-grid${SYSTEMS_PROJECTS.length === 1 ? ' systems-grid-single' : ''}`}>{SYSTEMS_PROJECTS.map(project => <article className="systems-project" key={project.id} id={`project-${project.id}`}>
    <p className="eyebrow">Systems &amp; Engineering</p><h3>{project.title}</h3><p className="systems-subtitle">{project.subtitle}</p>
    <p className="systems-description">{project.description}</p><TechnologyTags items={project.stack} />
    <div className="systems-links"><OutsideLink href={project.repo}>Source</OutsideLink>{project.credit && <OutsideLink href={project.credit.href} className="project-credit">{project.credit.label}</OutsideLink>}</div>
  </article>)}</div>
}

function EducationAndStack() {
  return <div className="education-stack">
    <div className="education-block"><p className="small-label">Education</p><h3>{EDUCATION.school}</h3><p>{EDUCATION.degree}</p><p className="muted">{EDUCATION.major}</p><p className="entry-period">{EDUCATION.period}</p><p className="education-award">{EDUCATION.award}</p></div>
    <div className="stack-block"><p className="small-label">Technical Stack</p><dl className="stack-specification">{TECHNICAL_STACK.map(group => <div key={group.label}><dt>{group.label}</dt><dd>{group.items.join(' · ')}</dd></div>)}</dl></div>
  </div>
}

function ContactEnding() {
  return <section className="contact-ending" aria-labelledby="contact-title">
    <div><p className="small-label">Contact</p><h2 id="contact-title">Get in touch</h2></div>
    <div><p>Open to 2027 software engineering co-op and internship opportunities.</p><a className="contact-address" href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}<Arrow /></a></div>
  </section>
}

export function HomePage() {
  return <main id="main" tabIndex={-1}>
    <header className="intro">
      <p className="eyebrow">{HERO.eyebrow}</p><h1>Bhavya Kumar</h1>
      <p className="intro-role">{HERO.lead}</p><p className="intro-text">{HERO.body}</p>
      <p className="availability"><span aria-hidden="true" />{HERO.availability}</p>
      <div className="intro-links"><ResumeLink /><OutsideLink href={IDENTITY.github} className="pill">GitHub</OutsideLink><OutsideLink href={IDENTITY.linkedin} className="pill">LinkedIn</OutsideLink><a href={`mailto:${IDENTITY.email}`} className="pill">Email<Arrow /></a></div>
    </header>
    <EditorialSection id="experience" number="01" title="Experience">
      {EXPERIENCE.map(entry => <article className="experience-entry" key={entry.org}>
        <div className="entry-heading"><div><h3>{entry.org}</h3><p className="experience-role">{entry.role}</p></div><p className="entry-period">{entry.period}</p></div>
        {entry.technologies && <TechnologyTags items={entry.technologies} />}
        <p>{entry.summary}</p>{entry.bullets && <ul className="contributions">{entry.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>}
      </article>)}
    </EditorialSection>
    <EditorialSection id="projects" number="02" title="Projects">
      <span id="work" className="anchor-alias" aria-hidden="true" />
      {SELECTED_PROJECTS.map(project => <FeaturedProject key={project.id} project={project} />)}
      <SystemsGrid />
    </EditorialSection>
    <EditorialSection id="about" number="03" title="Education & Stack"><EducationAndStack /></EditorialSection>
    <ContactEnding />
  </main>
}

function CommandFlow() {
  return <figure className="command-example">
    <figcaption>Illustrative command · a board with a “Write tests” task and a “Done” column</figcaption>
    <blockquote>“Move Write tests to Done.”</blockquote>
    <ol className="command-flow"><li><strong>Parse</strong><span>Request a structured move-task action from the model.</span></li><li><strong>Resolve</strong><span>Match the task and column names to board IDs.</span></li><li><strong>Commit</strong><span>Apply the move through the board’s shared update path.</span></li></ol>
    <p>The move enters undo history; authenticated board changes schedule a cloud save after a 500 ms pause.</p>
  </figure>
}

export function ProjectPage() {
  const { slug } = useParams()
  const project = PROJECTS.find(item => item.slug === slug)
  if (!project) return <NotFoundPage />
  return <main id="main" className="detail-page" tabIndex={-1}>
    <header className="project-intro"><Link to="/#projects" className="back-link">← Back to projects</Link><p className="eyebrow">Personal project · Web application · {project.year}</p><h1>{project.title}</h1><p className="project-lead">{project.overview}</p><p>{project.detail}</p><ProjectLinks project={project} /></header>
    <dl className="project-spec"><div><dt>Built with</dt><dd>{project.stack.join(', ')}</dd></div><div><dt>Scope</dt><dd>Personal application with a public demo and source repository.</dd></div></dl>
    <section className="case-section" id="architecture" aria-labelledby="architecture-title"><p className="small-label">Taskly</p><h2 id="architecture-title">Architecture</h2><p>A task board can be edited by dragging a card, using a form, or asking an assistant. Each route needs to update the same state and preserve a way to undo the change. I built Taskly around that shared update path.</p><CommandFlow /></section>
    <div className="implementation-notes">{project.sections.map(section => <section className="case-section" key={section.title}><h2>{section.title}</h2><p>{section.text}</p>{section.evidence && <OutsideLink href={section.evidence.href}>{section.evidence.label}</OutsideLink>}</section>)}</div>
    <ProjectVisual key={project.id} project={project} />
    <section className="case-section project-boundaries"><h2>What I’d improve next</h2><p>The current column matcher falls back to the first column when it cannot find a strong match. I’d replace that fallback with an explicit clarification before applying a command.</p><p>I’d also add automated checks for undo after an AI action, failed cloud saves, and conflicting edits. The public repository does not include a test suite or a performance benchmark; the implementation above is code evidence, not a claim of production reliability.</p></section>
    <p className="source-note">Implementation links refer to the public code inspected on 17 October 2026. The command above is an illustrative example.</p><ContactEnding />
  </main>
}

export function ContactPage() {
  return <main id="main" className="contact-page detail-page" tabIndex={-1}>
    <header className="page-intro"><p className="eyebrow">Contact</p><h1>Get in touch</h1><p>Open to 2027 software engineering co-op and internship opportunities, with a flexible Waterloo sequence.</p></header>
    <a className="contact-page-address" href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}<Arrow /></a>
    <div className="contact-directory"><OutsideLink href={IDENTITY.resume}><span><strong>Resume</strong><span>Experience and qualifications · PDF</span></span></OutsideLink><OutsideLink href={IDENTITY.github}><span><strong>GitHub</strong><span>Projects and source code</span></span></OutsideLink><OutsideLink href={IDENTITY.linkedin}><span><strong>LinkedIn</strong><span>Professional profile</span></span></OutsideLink></div>
  </main>
}

export function NotFoundPage() {
  return <main id="main" className="detail-page" tabIndex={-1}><div className="page-intro not-found"><p className="eyebrow">Page unavailable</p><h1>No page here.</h1><p>The address may have changed. You can return home or browse my projects.</p><div className="project-links"><Link to="/" className="pill">Back to home →</Link><Link to="/#projects" className="pill">Projects →</Link></div></div></main>
}
