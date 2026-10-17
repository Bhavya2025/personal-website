/** Facts from the current resume and the earlier resume-backed portfolio. */

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
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    org: 'ToadEx Inc.',
    role: 'Software Engineering Intern',
    period: 'Sept 2026 – Present',
    summary: 'Designing Python/FastAPI middleware for a restaurant kiosk platform with nine merchant configurations, separating payment and printing integrations from Django.',
    bullets: [
      'Traced Vue-to-Django checkout risks and specified idempotency keys and SQLite-backed recovery for interrupted transactions.',
      'Removed a hardcoded SMTP credential, validated four configuration scenarios, and documented environment-based deployment.',
      'Compared three architectural approaches and proposed REST API contracts and device adapters for payment terminals and printers.',
    ],
  },
  {
    org: 'Clevered AI Fellowship',
    role: 'Student Fellow',
    period: 'Jan 2024 – Feb 2024',
    summary:
      'Built a voice-activated accessibility prototype in Python during a mentored AI fellowship.',
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
