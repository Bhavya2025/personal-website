import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Link, NavLink, useLocation, useParams } from 'react-router-dom'
import { IDENTITY } from '../lib/missions'
import { EDUCATION, EXPERIENCE, SKILLS } from '../lib/resume'
import { ORDERED_PROJECTS, PROJECTS, SELECTED_PROJECTS } from './data'
import type { PortfolioProject } from './data'
import GitObjects from './GitObjects'
import portrait from '../assets/pfp.jpg'
import './portfolio.css'

const BoidsSim = lazy(() => import('../components/BoidsSim'))

function Arrow() {
  return <span aria-hidden="true" className="link-arrow">{'↗'}</span>
}

function OutsideLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}<Arrow /></a>
}

function Rail() {
  return (
    <aside className="identity-rail" aria-label="Site identity and navigation">
      <div className="rail-top">
        <Link to="/" className="rail-mark" aria-label="Bhavya Kumar, home"><svg width="45" height="45" viewBox="0 0 45 45" aria-hidden="true"><path d="M8 8v29h11c12 0 12-15 0-15H8M28 8v29m12-21L28 28l12 9" fill="none" stroke="currentColor" strokeWidth="2.3" /></svg></Link>
        <span className="rail-caption">Personal index<br />Bhavya Kumar</span>
      </div>
      <nav className="rail-nav" aria-label="Main navigation">
        <NavLink to="/" end><span>01</span> Index</NavLink>
        <NavLink to="/projects"><span>02</span> Projects</NavLink>
        <Link to="/#experience"><span>03</span> Experience</Link>
        <Link to="/#about"><span>04</span> About</Link>
        <NavLink to="/contact"><span>05</span> Contact</NavLink>
        <OutsideLink href={IDENTITY.resume} className="mobile-resume">Résumé</OutsideLink>
      </nav>
      <div className="rail-person">
        <img src={portrait} width="76" height="88" alt="Bhavya Kumar at an aviation museum" />
        <p>Applied Mathematics<br />University of Waterloo</p>
        <span>Waterloo, Ontario</span>
      </div>
      <div className="rail-links">
        <OutsideLink href={IDENTITY.resume}>Résumé <span className="file-type">PDF</span></OutsideLink>
        <OutsideLink href={IDENTITY.github}>GitHub</OutsideLink>
        <OutsideLink href={IDENTITY.linkedin}>LinkedIn</OutsideLink>
        <a href={`mailto:${IDENTITY.email}`}>Email <Arrow /></a>
      </div>
      <span className="rail-bottom">Software / mathematics</span>
    </aside>
  )
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname, hash, search, key } = useLocation()
  useEffect(() => {
    const project = pathname.startsWith('/projects/') ? PROJECTS.find(item => pathname === `/projects/${item.slug}`) : null
    const title = pathname === '/' ? 'Bhavya Kumar — Software & Applied Mathematics' : project ? `${project.title} — Bhavya Kumar` : pathname === '/projects' ? 'Project index — Bhavya Kumar' : pathname === '/contact' ? 'Contact — Bhavya Kumar' : 'Page not found — Bhavya Kumar'
    document.title = title
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = `https://bhavyakumar.ca${pathname}`
    const frame = requestAnimationFrame(() => {
      const focus = pathname === '/projects' ? new URLSearchParams(search).get('focus') : null
      const anchor = hash.slice(1) || (focus ? `project-${focus}` : '')
      const target = anchor ? document.getElementById(anchor) : null
      if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'instant' })
      const focusTarget = target ?? document.getElementById('main')
      if (focusTarget) {
        focusTarget.tabIndex = -1
        focusTarget.focus({ preventScroll: true })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash, search, key])
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="site-shell">
        <Rail />
        <div className="content-column">
          {children}
          <footer className="site-footer"><span>© {new Date().getFullYear()} Bhavya Kumar</span><OutsideLink href="https://github.com/Bhavya2025/personal-website">Site source</OutsideLink><a href="#main">Top ↑</a></footer>
        </div>
      </div>
    </>
  )
}

function SectionHeading({ number, children, aside }: { number: string; children: ReactNode; aside?: ReactNode }) {
  return <div className="section-head"><h2><span>{number}</span>{children}</h2>{aside && <span className="section-aside">{aside}</span>}</div>
}

function ProjectLinks({ project, details = false }: { project: PortfolioProject; details?: boolean }) {
  return <div className="project-links">
    {details && <Link to={`/projects/${project.slug}`}>Project notes <span aria-hidden="true">→</span></Link>}
    {project.repo && <OutsideLink href={project.repo.href}>{project.id === 'BK-005' ? 'Project archive' : 'Source code'}</OutsideLink>}
    {project.link && <OutsideLink href={project.link.href}>{project.demo === 'itch' ? 'Play on itch.io' : 'Live app'}</OutsideLink>}
  </div>
}

function SafeImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className="image-fallback" role="status"><span>Image unavailable</span><p>{alt}. You can inspect the project using its links.</p></div>
  return <img src={src} alt={alt} width={width} height={height} loading="lazy" onError={() => setFailed(true)} />
}

function CurveFigure() {
  const points = Array.from({ length: 49 }, (_, index) => {
    const x = 54 + index * 11.5
    return { x, y: 57 + ((x - 330) ** 2) / 860 }
  })
  return <figure className="curve-figure"><figcaption><span>Graph Mechanics</span><span>Function → collision terrain</span></figcaption>
    <svg viewBox="0 0 660 230" role="img" aria-label="Conceptual illustration of a curve sampled into points for collision terrain">
      {[70, 120, 170].map(y => <path key={y} d={`M35 ${y}H625`} stroke="#dbe0e5" strokeWidth="1" />)}
      {[100, 215, 330, 445, 560].map(x => <path key={x} d={`M${x} 27V193`} stroke="#dbe0e5" strokeWidth="1" />)}
      <path d="M35 193H625M35 193V25" stroke="#89929a" strokeWidth="1" />
      <polyline points={points.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#2454bc" strokeWidth="2.5" />
      {points.filter((_, index) => index % 3 === 0).map(point => <circle key={point.x} cx={point.x} cy={point.y} r="3" fill="#2454bc" />)}
      <circle cx="468" cy="67" r="10" fill="#bd4c32" /><path d="M544 104v-25l20 7-20 7" stroke="#303a38" strokeWidth="2" fill="#d7e4c7" />
      <text x="35" y="216">sampled points</text><text x="530" y="216">graph space</text>
    </svg><p className="figure-note">Conceptual terrain illustration. The game source contains the physics implementation.</p>
  </figure>
}

class DemoBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Simulation failed to load:', error.message, info.componentStack) }
  render() {
    if (this.state.failed) return <p className="demo-message" role="alert">The simulation couldn’t load. <button type="button" onClick={() => window.location.reload()}>Reload this page</button> to try again.</p>
    return this.props.children
  }
}

function FlockingDemo() {
  const [running, setRunning] = useState(false)
  return <figure className="flock-figure"><figcaption><span>Boids / flocking simulation</span><button type="button" onClick={() => setRunning(!running)} aria-pressed={running}>{running ? 'Stop simulation' : 'Run simulation'} <span aria-hidden="true">{running ? '□' : '▷'}</span></button></figcaption>
    <div className="flock-stage">{running ? <DemoBoundary><Suspense fallback={<p className="demo-message" role="status">Loading the simulation…</p>}><BoidsSim /></Suspense></DemoBoundary> : <div className="demo-rest"><svg width="160" height="70" viewBox="0 0 160 70" aria-hidden="true"><path d="m20 40 10-20 8 10m20 20 10-20 8 10m20 2 10-20 8 10m14 28 10-20 8 10" fill="none" stroke="currentColor" strokeWidth="2" /></svg><p>The flock starts when you press Run.</p></div>}</div>
    <p className="figure-note">Alignment, cohesion, separation. Move your pointer through the running flock.</p>
  </figure>
}

function ProjectVisual({ project }: { project: PortfolioProject }) {
  if (project.id === 'BK-103') return <GitObjects />
  if (project.id === 'BK-006') return <CurveFigure />
  if (project.demo === 'boids') return <FlockingDemo />
  if (project.image) return <figure className={`project-image project-image--${project.id}`}><SafeImage src={project.image.src} alt={project.image.alt} width={project.id === 'BK-001' ? 1280 : 700} height={project.id === 'BK-001' ? 631 : 525} /><figcaption>{project.id === 'BK-001' ? 'Taskly / project board interface' : 'Arduino prototype / ultrasonic sensing and motor control'}</figcaption></figure>
  return null
}

function WorkEntry({ project, index, showVisual = true }: { project: PortfolioProject; index: number; showVisual?: boolean }) {
  return <article className="work-entry" id={`project-${project.id}`}>
    <div className="work-meta"><span>{String(index + 1).padStart(2, '0')} / {project.category}</span><span>{project.year}</span></div>
    <div className="work-description"><div><h3><Link to={`/projects/${project.slug}`}>{project.title}<span aria-hidden="true">↗</span></Link></h3><p className="work-overview">{project.overview}</p></div><p className="work-detail">{project.detail}</p></div>
    <div className="work-bottom"><span className="project-context">{project.context}</span><ProjectLinks project={project} details /></div>
    {showVisual && <ProjectVisual project={project} />}
  </article>
}

function ContactEnding() {
  return <section className="contact-ending" aria-labelledby="contact-title"><p className="small-label">Contact</p><h2 id="contact-title">Open to software engineering roles.</h2><p>For co-op and internship opportunities, you can reach me at:</p><a className="contact-address" href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}<Arrow /></a></section>
}

export function HomePage() {
  return <main id="main" tabIndex={-1}>
    <header className="intro"><div className="page-datum"><span>Portfolio / 2026</span><span>Waterloo, Ontario</span></div>
      <h1>Bhavya Kumar</h1>
      <p className="intro-degree">Applied mathematics student.<br />Software engineering intern.</p>
      <p className="intro-text">I study at the University of Waterloo and work on Python middleware at ToadEx. Here’s a selection of my software projects and experiments.</p>
      <div className="intro-links"><OutsideLink href={IDENTITY.resume}>Read my résumé <span className="file-type">PDF</span></OutsideLink><a href={`mailto:${IDENTITY.email}`}>Get in touch <Arrow /></a></div>
      <p className="availability"><span aria-hidden="true" />Open to co-op &amp; internship roles</p>
    </header>
    <section className="work-section" id="work"><SectionHeading number="01" aside="2026 / Selected projects">Selected work</SectionHeading>{SELECTED_PROJECTS.map((project, index) => <WorkEntry key={project.id} project={project} index={index} />)}<Link className="all-work-link" to="/projects">Browse the full project index <span aria-hidden="true">→</span></Link></section>
    <section className="experience-section" id="experience"><SectionHeading number="02">Experience</SectionHeading>{EXPERIENCE.map(entry => <article className="experience-entry" key={entry.org}><div className="experience-meta"><span>{entry.period}</span>{entry.location && <span>{entry.location}</span>}</div><div><h3>{entry.org}</h3><p className="experience-role">{entry.role}</p><p>{entry.summary}</p>{entry.bullets && <details className="experience-details"><summary>Selected contributions <span aria-hidden="true">+</span></summary><ul>{entry.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul></details>}</div></article>)}</section>
    <section className="about-section" id="about"><SectionHeading number="03">Background</SectionHeading><div className="about-columns"><div><p className="small-label">Education</p><h3>{EDUCATION.school}</h3><p>{EDUCATION.degree}</p><p className="muted">{EDUCATION.major}</p><p className="education-period">{EDUCATION.period}</p><p className="scholarship">{EDUCATION.award}</p><p className="small-label recognition-label">Also</p><p className="recognition">Bronze medalist, TIMO International Math Olympiad.<br />Finalist, Northeastern University London Essay Competition.</p></div><div className="toolkit"><p className="small-label">Working with</p>{SKILLS.map(group => <div key={group.label}><h3>{group.label}</h3><p>{group.items.join(' · ')}</p></div>)}</div></div></section>
    <ContactEnding />
  </main>
}

export function ProjectsPage() {
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const categories = ['All', 'Software', 'Math & simulation', 'Hardware', 'Games']
  const visible = ORDERED_PROJECTS.filter(project => {
    const categoryMatch = category === 'All' || category === 'Math & simulation' && project.category === category || category === 'Software' && project.group === 'SOFTWARE' || category === 'Hardware' && project.group === 'HARDWARE' || category === 'Games' && project.group === 'GAMES'
    return categoryMatch && `${project.title} ${project.detail} ${project.stack.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim())
  })
  return <main id="main" tabIndex={-1}><header className="page-intro"><div className="page-datum"><Link to="/">Index</Link><span>Projects / 2021–2026</span></div><h1>Project index<span className="count-mark">{PROJECTS.length.toString().padStart(2, '0')}</span></h1><p>Software, simulations, and earlier experiments. Each entry includes its scope and the evidence available to inspect.</p></header>
    <div className="index-controls"><label className="search-label" htmlFor="project-search">Find a project<input ref={searchRef} id="project-search" type="search" placeholder="Search name or technology…" value={query} onChange={event => setQuery(event.target.value)} /></label><div className="category-filters" role="group" aria-label="Project categories">{categories.map(filter => <button type="button" key={filter} aria-pressed={category === filter} onClick={() => setCategory(filter)}>{filter}</button>)}</div></div>
    <p className="results-label" aria-live="polite">{visible.length} of {PROJECTS.length} projects</p>
    <div className="project-index">{visible.map(project => <WorkEntry key={project.id} project={project} index={ORDERED_PROJECTS.indexOf(project)} showVisual={false} />)}{visible.length === 0 && <div className="empty-state"><h2>No matching projects</h2><p>Try a project name or a technology such as Python.</p><button type="button" onClick={() => { setCategory('All'); setQuery(''); searchRef.current?.focus() }}>Clear search and filters <span aria-hidden="true">↺</span></button></div>}</div>
    <ContactEnding />
  </main>
}

export function ProjectPage() {
  const { slug } = useParams()
  const project = PROJECTS.find(item => item.slug === slug)
  if (!project) return <NotFoundPage />
  const next = ORDERED_PROJECTS[(ORDERED_PROJECTS.indexOf(project) + 1) % ORDERED_PROJECTS.length]!
  return <main id="main" tabIndex={-1}><header className="project-intro"><div className="page-datum"><Link to="/projects">← Project index</Link><span>{project.year} / {project.category}</span></div><p className="small-label">{project.context}</p><h1>{project.title}</h1><p className="project-lead">{project.overview}</p><p className="project-description">{project.detail}</p><ProjectLinks project={project} /></header>
    <dl className="project-spec"><div><dt>Technologies</dt><dd>{project.stack.join(', ')}</dd></div><div><dt>Focus</dt><dd>{project.focus}</dd></div></dl>
    <ProjectVisual key={project.id} project={project} />
    <div className="implementation-notes">{project.sections.map((section, index) => <section key={section.title}><span className="note-number">0{index + 1}</span><div><h2>{section.title}</h2><p>{section.text}</p></div></section>)}</div>
    {project.credit && <p className="project-credit">{project.credit.text} <OutsideLink href={project.credit.href}>{project.credit.label}</OutsideLink>.</p>}
    <nav className="project-pagination" aria-label="More projects"><Link to="/projects">← All projects</Link><Link to={`/projects/${next.slug}`}>{next.title} <span aria-hidden="true">→</span></Link></nav>
    <ContactEnding />
  </main>
}

export function ContactPage() {
  return <main id="main" tabIndex={-1}><header className="page-intro"><div className="page-datum"><Link to="/">Index</Link><span>Contact</span></div><h1>Get in touch<span className="name-mark" aria-hidden="true">↗</span></h1><p>For software engineering co-op roles, internships, or a conversation about one of my projects, email me.</p></header><a className="contact-page-address" href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}<Arrow /></a>
    <div className="contact-directory"><OutsideLink href={IDENTITY.resume}><span><strong>Résumé</strong><span>Experience and qualifications · PDF</span></span></OutsideLink><OutsideLink href={IDENTITY.github}><span><strong>GitHub</strong><span>Public repositories and source code</span></span></OutsideLink><OutsideLink href={IDENTITY.linkedin}><span><strong>LinkedIn</strong><span>Professional profile</span></span></OutsideLink></div><p className="location-note">Based in Waterloo, Ontario, Canada.</p>
  </main>
}

export function NotFoundPage() {
  return <main id="main" tabIndex={-1}><div className="page-intro not-found"><div className="page-datum"><span>404</span><span>Page not found</span></div><h1>No page here.</h1><p>The address may have changed. You can return to the index or browse my projects.</p><div className="project-links"><Link to="/">Back to index →</Link><Link to="/projects">Project index →</Link></div></div></main>
}
