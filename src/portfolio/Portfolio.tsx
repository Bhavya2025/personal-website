import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { FEATURED_PROJECT_IDS, IDENTITY, MISSIONS } from '../lib/missions'
import type { Mission } from '../lib/missions'
import { ACHIEVEMENTS, EDUCATION, EXPERIENCE, SKILLS } from '../lib/resume'
import portrait from '../assets/pfp.jpg'
import './portfolio.css'

const BoidsSim = lazy(() => import('../components/BoidsSim'))
const featuredProjects = FEATURED_PROJECT_IDS.flatMap(id => MISSIONS.filter(project => project.id === id))
const allProjects = [...featuredProjects, ...MISSIONS.filter(project => !featuredProjects.includes(project))]

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span className="arrow" aria-hidden="true">{diagonal ? '↗' : '→'}</span>
}

function ExternalLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}<Arrow diagonal /></a>
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname, hash, search } = useLocation()

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Bhavya Kumar | Software & Applied Mathematics',
      '/projects': 'Projects | Bhavya Kumar',
      '/contact': 'Contact | Bhavya Kumar',
    }
    document.title = titles[pathname] ?? 'Page not found | Bhavya Kumar'
    const focus = pathname === '/projects' ? new URLSearchParams(search).get('focus') : null
    const anchor = hash.slice(1) || (focus ? `project-${focus}` : '')
    const frame = requestAnimationFrame(() => {
      const target = anchor ? document.getElementById(anchor) : null
      if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash, search])

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="wordmark" aria-label="Bhavya Kumar, home">
            <span className="monogram">bk<span>.</span></span>
            <span className="wordmark-name">Bhavya Kumar</span>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <NavLink to="/projects">Projects</NavLink>
            <Link to="/#experience">Experience</Link>
            <NavLink to="/contact">Contact</NavLink>
            <ExternalLink href={IDENTITY.resume} className="nav-resume">Resume</ExternalLink>
          </nav>
        </div>
      </header>
      {children}
      <footer className="site-footer container">
        <p>© {new Date().getFullYear()} Bhavya Kumar</p>
        <span>Built with care. Always learning.</span>
        <a href="#main">Back to top <span aria-hidden="true">↑</span></a>
      </footer>
    </>
  )
}

function SectionTitle({ number, label, title, children }: { number: string; label: string; title: string; children?: ReactNode }) {
  return (
    <div className="section-heading">
      <div><p className="eyebrow"><span>{number}</span> {label}</p><h2>{title}</h2></div>
      {children}
    </div>
  )
}

function GitPreview() {
  return (
    <div className="git-preview" aria-label="Diagram of Git commits and a feature branch" role="img">
      <div className="preview-caption"><span>wyag / object model</span><span>Python</span></div>
      <svg viewBox="0 0 360 165" aria-hidden="true">
        <path d="M45 112H315 M125 112C150 112 145 52 182 52H245C280 52 277 112 315 112" fill="none" stroke="#97abc5" strokeWidth="2" />
        {[45, 125, 220, 315].map(x => <g key={x}><circle cx={x} cy="112" r="9" fill="#f6f8fc" stroke="#2455a3" strokeWidth="2" /><circle cx={x} cy="112" r="3" fill="#2455a3" /></g>)}
        {[182, 245].map(x => <circle key={x} cx={x} cy="52" r="8" fill="#2455a3" />)}
        <text x="45" y="146">commit</text><text x="185" y="28">feature</text><text x="290" y="146">main</text>
      </svg>
      <div className="preview-bottom"><span>blob → tree → commit</span><span>15 core commands</span></div>
    </div>
  )
}

function PipelinePreview() {
  return (
    <div className="pipeline-preview" role="img" aria-label="Software Factory pipeline: specify, build, verify, then deploy">
      <div className="preview-caption"><span>software factory / workflow</span><span>LLM agents</span></div>
      <div className="pipeline-flow">
        <div><span>01</span><strong>Specify</strong></div><span aria-hidden="true">→</span>
        <div><span>02</span><strong>Build</strong></div><span aria-hidden="true">→</span>
        <div><span>03</span><strong>Verify</strong></div>
      </div>
      <div className="pipeline-output"><span aria-hidden="true">↳</span><span>validation gates</span><span>→ live preview</span></div>
      <div className="preview-bottom"><span>request → working PoC</span><span>Render</span></div>
    </div>
  )
}

function ProjectPreview({ project }: { project: Mission }) {
  if (project.id === 'BK-103') return <GitPreview />
  if (project.id === 'BK-005') return <PipelinePreview />
  if (project.image) return <div className={`image-preview image-preview--${project.id}`}><img src={project.image.src} alt={project.image.alt} loading="lazy" width={project.id === 'BK-001' ? 1280 : 700} height={project.id === 'BK-001' ? 631 : 525} /></div>
  if (project.demo === 'boids') return <div className="simulation-preview"><Suspense fallback={<p>Loading flocking simulation…</p>}><BoidsSim /></Suspense></div>
  return <div className="game-preview"><span className="eyebrow">Brackeys Game Jam · 2021</span><strong>Multiplayer<br />Platformer<span aria-hidden="true">↗</span></strong><span>Unity / C# / WebGL</span></div>
}

function projectName(project: Mission) {
  const names: Record<string, string> = {
    'BK-103': 'Wyag', 'BK-005': 'Software Factory', 'BK-001': 'Taskly',
    'BK-004': 'Boids', 'BK-002': 'Obstacle-avoiding car', 'BK-003': 'Multiplayer platformer',
  }
  return names[project.id] ?? project.name
}

function ProjectCard({ project, index }: { project: Mission; index: number }) {
  return (
    <article className="project-card" id={`project-${project.id}`}>
      <ProjectPreview project={project} />
      <div className="project-body">
        <p className="project-meta"><span>{String(index + 1).padStart(2, '0')} / {project.id === 'BK-103' ? 'Developer tools' : project.id === 'BK-005' ? 'AI workflows' : project.id === 'BK-001' ? 'Full-stack application' : project.group.toLowerCase()}</span><span>{project.year}</span></p>
        <h3>{projectName(project)}</h3>
        <p className="project-summary">{project.summary ?? project.designation}</p>
        <ul className="project-tags" aria-label="Technologies">{project.stack.slice(0, 3).map(tech => <li key={tech}>{tech}</li>)}</ul>
        <div className="project-links">
          {project.repo && <ExternalLink href={project.repo.href}>Source code</ExternalLink>}
          {project.link && <ExternalLink href={project.link.href}>{project.demo === 'itch' ? 'Play game' : 'Live demo'}</ExternalLink>}
          {!project.repo && !project.link && <span className="project-context">{project.id === 'BK-005' ? 'NYC hackathon · June 2026' : project.demo === 'boids' ? 'Interactive canvas demo' : 'Hardware prototype'}</span>}
        </div>
        <details className="project-details">
          <summary>Engineering details <span className="detail-toggle" aria-hidden="true" /></summary>
          <ul>{project.brief.filter(text => !text.startsWith('Live below')).map(text => <li key={text}>{text}</li>)}</ul>
        </details>
      </div>
    </article>
  )
}

function ContactBand() {
  return (
    <section className="contact-band" id="contact" aria-labelledby="contact-title">
      <div><p className="eyebrow">Let’s connect</p><h2 id="contact-title">Have a role in mind?</h2><p>I’m open to software engineering co-op and internship opportunities.</p></div>
      <div className="contact-band-actions"><a className="email-link" href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}<Arrow diagonal /></a><div className="social-links"><ExternalLink href={IDENTITY.github}>GitHub</ExternalLink><ExternalLink href={IDENTITY.linkedin}>LinkedIn</ExternalLink></div></div>
    </section>
  )
}

export function HomePage() {
  return (
    <main className="container" id="main" tabIndex={-1}>
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">Software engineering &amp; applied mathematics</p>
          <h1 id="hero-title">Bhavya Kumar<span>.</span></h1>
          <p className="hero-statement">Building software.<br /><em>Understanding systems.</em></p>
          <p className="hero-description">Applied Mathematics student at the University of Waterloo and software engineering intern at ToadEx. I build backend systems, web applications, and AI agent workflows.</p>
          <div className="hero-actions"><ExternalLink href={IDENTITY.resume} className="button button-primary">View resume</ExternalLink><a href="#projects" className="button button-secondary">Explore my work <span aria-hidden="true">↓</span></a></div>
          <p className="availability"><span aria-hidden="true" />Open to co-op &amp; internship opportunities</p>
        </div>
        <figure className="hero-portrait"><div className="portrait-wrap"><img src={portrait} alt="Bhavya Kumar at an aviation museum" width="520" height="495" fetchPriority="high" /></div><figcaption><span>Waterloo, Ontario</span><span>Math → code</span></figcaption></figure>
      </section>

      <div className="at-a-glance" aria-label="Current experience and education">
        <div><span className="eyebrow">Currently</span><p>Software Engineering Intern <span className="subtle">at ToadEx</span></p></div>
        <div><span className="eyebrow">Studying</span><p>Honours Mathematics <span className="subtle">at Waterloo</span></p></div>
        <ExternalLink href={IDENTITY.github}>Find me on GitHub</ExternalLink>
      </div>

      <section className="portfolio-section" id="projects">
        <SectionTitle number="01" label="Selected work" title="A few things I’ve built."><Link to="/projects" className="text-link">All projects <Arrow /></Link></SectionTitle>
        <div className="projects-grid">{featuredProjects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div>
      </section>

      <section className="portfolio-section experience-section" id="experience">
        <SectionTitle number="02" label="Experience" title="Putting ideas into practice." />
        <div className="experience-list">{EXPERIENCE.map((entry, index) => <article className="experience-entry" key={entry.org}>
          <div className="experience-date"><span>{entry.period}</span><span className="experience-location">Remote{index === 0 && <span className="current-label">Current</span>}</span></div>
          <div className="experience-content"><h3>{entry.role}</h3><p className="experience-org">{entry.org}</p><p>{entry.summary}</p>{entry.bullets && <ul>{entry.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>}</div>
        </article>)}</div>
      </section>

      <section className="portfolio-section about-section" id="about">
        <SectionTitle number="03" label="Background" title="A foundation in mathematics." />
        <div className="background-grid">
          <div className="education-block"><p className="eyebrow">Education</p><h3>{EDUCATION.school}</h3><p className="degree">{EDUCATION.degree}</p><p>{EDUCATION.major}</p><p className="education-period">{EDUCATION.period}</p><span className="scholarship">{EDUCATION.award}</span><p className="coursework"><span>Relevant coursework</span>Data Structures, Algorithm Design in C, Functional Programming, Probability</p><div className="recognition"><p className="eyebrow">Recognition</p>{ACHIEVEMENTS.filter(a => a.tag === 'BRONZE MEDAL' || a.tag === 'FINALIST').map(a => <p key={a.tag}><strong>{a.tag === 'BRONZE MEDAL' ? 'Bronze medalist' : 'Finalist'}</strong><span>{a.text}</span></p>)}</div></div>
          <div className="skills-block"><p className="eyebrow">Technical toolkit</p>{SKILLS.map(group => <div className="skill-group" key={group.label}><h3>{group.label}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}</div>
        </div>
      </section>
      <ContactBand />
    </main>
  )
}

export function ProjectsPage() {
  const [filter, setFilter] = useState('All work')
  const filters = ['All work', 'Software', 'Hardware', 'Games']
  const visible = allProjects.filter(project => filter === 'All work' || project.group === filter.toUpperCase())
  return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="page-intro"><Link to="/" className="back-link"><span aria-hidden="true">←</span> Back to home</Link><p className="eyebrow">Projects &amp; experiments</p><h1>Built to learn.<br /><em>Made to work.</em></h1><p>From Git internals to AI workflows, a selection of the systems, applications, and experiments I’ve worked on. Open a project’s engineering details for a closer look.</p></div>
      <div className="project-toolbar"><div className="project-filters" role="group" aria-label="Filter projects">{filters.map(label => <button type="button" key={label} aria-pressed={filter === label} className={filter === label ? 'is-selected' : ''} onClick={() => setFilter(label)}>{label}</button>)}</div><span className="project-count" aria-live="polite">{visible.length} project{visible.length === 1 ? '' : 's'}</span></div>
      <div className="projects-grid all-projects">{visible.map(project => <ProjectCard key={project.id} project={project} index={allProjects.indexOf(project)} />)}</div>
      <ContactBand />
    </main>
  )
}

export function ContactPage() {
  return (
    <main className="container contact-page" id="main" tabIndex={-1}>
      <div className="page-intro"><Link to="/" className="back-link"><span aria-hidden="true">←</span> Back to home</Link><p className="eyebrow">Contact</p><h1>Let’s build<br /><em>something useful.</em></h1><p>I’m open to software engineering co-op and internship opportunities. For a role, a project, or a conversation about my work, email is the best way to reach me.</p></div>
      <a className="contact-email" href={`mailto:${IDENTITY.email}`}>{IDENTITY.email}<Arrow diagonal /></a>
      <div className="contact-options"><ExternalLink href={IDENTITY.linkedin}><span><strong>LinkedIn</strong><span>Professional background</span></span></ExternalLink><ExternalLink href={IDENTITY.github}><span><strong>GitHub</strong><span>Projects &amp; source code</span></span></ExternalLink><ExternalLink href={IDENTITY.resume}><span><strong>Resume</strong><span>Experience &amp; qualifications · PDF</span></span></ExternalLink></div>
      <p className="contact-location">Based in Waterloo, Ontario, Canada.</p>
    </main>
  )
}

export function NotFoundPage() {
  return <main className="container" id="main" tabIndex={-1}><div className="page-intro"><p className="eyebrow">404 / Page not found</p><h1>Let’s get you<br /><em>back on track.</em></h1><p>This page doesn’t exist. You can find my work and experience on the homepage.</p><Link to="/" className="button button-primary">Back to home <span aria-hidden="true">→</span></Link></div></main>
}
