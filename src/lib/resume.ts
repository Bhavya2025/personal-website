/** Resume facts — everything here comes from public/resume.pdf. */

export const EDUCATION = {
  school: 'University of Waterloo',
  degree: 'Honours Bachelor of Mathematics (Co-op)',
  major: 'Applied Mathematics with Scientific Computing and Scientific Machine Learning',
  period: 'SEPT 2025 — PRESENT',
  location: 'Waterloo, ON',
  award: "President's Scholarship",
  coursework: [
    'Data Types & Structures',
    'Algorithm Design in C',
    'Probability',
    'Linear Algebra II',
    'Calculus III',
    'Functional Programming (Racket)',
  ],
} as const

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
    items: ['Claude Code', 'Prompt Engineering'],
  },
  {
    label: 'CURRENTLY PRACTICING',
    items: ['LeetCode', 'NeetCode'],
  },
]

export const ACHIEVEMENTS = [
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
  },
] as const
