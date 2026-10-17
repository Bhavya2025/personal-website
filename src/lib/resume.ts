/** Education from the supplied resume; experience wording updated by the user on October 17. */

export const EDUCATION = {
  school: 'University of Waterloo',
  schoolUrl: 'https://uwaterloo.ca',
  degree: 'Honours Bachelor of Mathematics (Co-op)',
  major: 'Applied Mathematics with Scientific Computing and Scientific Machine Learning',
  majorUrl:
    'https://uwaterloo.ca/future-students/programs/applied-mathematics-scientific-computing',
  period: 'Sept 2025 – Apr 2030 (expected)',
  award: "President's Scholarship",
  // Each links to its UWFlow course page. The first three codes are
  // user-confirmed; the last three are best-effort (verify on UWFlow).
  coursework: [
    { label: 'Data Types & Structures', code: 'CS234' },
    { label: 'Algorithm Design in C', code: 'CS136' },
    { label: 'Probability', code: 'STAT230' },
    { label: 'Linear Algebra II', code: 'MATH235' },
    { label: 'Calculus III', code: 'MATH237' },
    { label: 'Functional Programming (Racket)', code: 'CS135' },
  ],
} as const

/** UWFlow course page for a course code (e.g. 'CS234' → uwflow.com/course/cs234). */
export const uwflowUrl = (code: string): string =>
  `https://uwflow.com/course/${code.toLowerCase()}`

export interface ExperienceEntry {
  org: string
  role: string
  period: string
  summary: string
  location?: string
  bullets?: string[]
  technologies?: string[]
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    org: 'ToadEx Inc.',
    role: 'Software Engineering Intern',
    period: 'Sept 2026 – Present',
    summary: 'Architecting Python/FastAPI middleware for a multi-tenant restaurant kiosk platform across 9 merchant configurations, decoupling hardware payment and thermal printing integrations from a legacy Django monolith.',
    bullets: [
      'Engineered fault-tolerant checkout flows between Vue clients and Django backends, implementing idempotency keys and SQLite-backed state recovery for interrupted payment transactions.',
      'Designed standardized REST API contracts and hardware device adapters for physical payment terminals and receipt printers after evaluating three microservice integration patterns.',
      'Hardened multi-environment deployment pipelines by eliminating static credential risks and automating schema validation across four merchant configuration profiles.',
    ],
    technologies: ['Python', 'FastAPI', 'Django', 'SQLite', 'Vue', 'REST APIs'],
  },

]

export interface SkillGroup {
  label: string
  items: string[]
}

export const SKILLS: SkillGroup[] = [
  {
    label: 'Languages',
    items: ['Python', 'C', 'C++', 'JavaScript', 'TypeScript', 'SQL', 'Racket'],
  },
  {
    label: 'Frameworks & databases',
    items: ['FastAPI', 'Django', 'Vue.js', 'React', 'Node.js', 'Express', 'SQLite', 'Supabase'],
  },
  {
    label: 'Tools & technologies',
    items: ['Git', 'GitHub', 'REST APIs', 'LLM APIs', 'Agent workflows', 'Render', 'Vercel'],
  },
]

export interface Achievement {
  tag: string
  text: string
  href?: string
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    tag: 'SCHOLARSHIP',
    text: "President's Scholarship, University of Waterloo",
  },
  {
    tag: 'BRONZE MEDAL',
    text: 'TIMO International Math Olympiad',
  },
  {
    tag: 'FINALIST',
    text: 'Northeastern University London Essay Competition (Tech & Society)',
  },
  {
    tag: 'AUTHOR',
    text: 'Medium',
    href: 'https://medium.com/@bhavyakumar.bkb',
  },
]
