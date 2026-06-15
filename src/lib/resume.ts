/** Resume facts — everything here comes from public/resume.pdf. */

export const EDUCATION = {
  school: 'University of Waterloo',
  schoolUrl: 'https://uwaterloo.ca',
  degree: 'Honours Bachelor of Mathematics (Co-op)',
  major: 'Applied Mathematics with Scientific Computing and Scientific Machine Learning',
  majorUrl:
    'https://uwaterloo.ca/future-students/programs/applied-mathematics-scientific-computing',
  period: 'SEPT 2025 — PRESENT',
  location: 'Waterloo, ON',
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
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    org: 'Clevered AI Fellowship',
    role: 'Student Fellow',
    period: 'JAN 2024 — FEB 2024',
    summary:
      'Selected for a mentored AI program led by Oxford-affiliated researcher Ken Kahn; built a voice-activated accessibility prototype in Python using NLP-style intent matching.',
  },
]

export interface SkillGroup {
  label: string
  items: string[]
}

export const SKILLS: SkillGroup[] = [
  {
    label: 'LANGUAGES',
    items: ['Python', 'C', 'C++', 'JavaScript', 'TypeScript', 'Racket', 'SQL'],
  },
  {
    label: 'FRAMEWORKS & LIBRARIES',
    items: ['React', 'Node.js', 'Supabase'],
  },
  {
    label: 'TOOLS',
    items: ['Git', 'GitHub', 'Vercel', 'VS Code', 'Arduino'],
  },
  {
    label: 'AI TOOLING',
    items: ['Claude Code'],
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
    text: "President's Scholarship — University of Waterloo",
  },
  {
    tag: 'BRONZE MEDAL',
    text: 'TIMO International Math Olympiad',
  },
  {
    tag: 'FINALIST',
    text: 'Northeastern University London Essay Competition — Tech & Society',
  },
  {
    tag: 'AUTHOR',
    text: '"School of Machine Learning" — a blog simplifying ML concepts for beginners',
    href: 'https://medium.com/@bhavyakumar.bkb',
  },
]
