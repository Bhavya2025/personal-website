/**
 * Portfolio projects, grounded in the current resume and previous portfolio.
 * Only verified project URLs are included; missing links are not fabricated.
 */
import tasklyImg from '../assets/taskly.jpg'

export type MissionGroup = 'SOFTWARE' | 'HARDWARE' | 'GAMES' | 'PLANNED'

export interface Mission {
  id: string
  year: string
  name: string
  designation: string
  summary?: string
  status: 'DEPLOYED' | 'BUILT' | 'HARDWARE' | 'AWAITING DATA' | 'PLANNED'
  group: MissionGroup
  stack: string[]
  brief: string[]
  image?: { src: string; alt: string }
  /** Renders a live in-card demo instead of a static image. */
  demo?: 'boids' | 'itch'
  link?: { label: string; href: string }
  /** optional source-code link, shown alongside the live link */
  repo?: { label: string; href: string }
  pending?: string
}

export const MISSIONS: Mission[] = [
  {
    id: 'BK-001',
    year: '2026',
    name: 'TASKLY',
    designation: 'Kanban app with built-in AI assistant',
    summary: 'An AI-assisted kanban app with natural-language task commands, undo/redo, and consistent state across tabs.',
    status: 'DEPLOYED',
    group: 'SOFTWARE',
    stack: ['React', 'Supabase', 'DeepSeek-R1 70B', 'Vercel'],
    brief: [
      'Multi-project boards with drag-and-drop and a separate mobile component tree triggered by viewport detection.',
      'Centralized mutation pipeline with undo/redo history and 500ms-debounced sync. One source of truth across guest and authenticated modes, with realtime cross-tab updates.',
      'AI integrated in two flows: full board generation from natural-language descriptions, and command parsing with fuzzy task resolution.',
      'Diagnosed and fixed a 60fps scroll regression via ref-based DOM mutations and passive event listeners.',
    ],
    image: { src: tasklyImg, alt: 'Taskly kanban board interface' },
    link: { label: 'LAUNCH APP', href: 'https://taskly-virid.vercel.app' },
    repo: { label: 'GITHUB', href: 'https://github.com/Bhavya2025/taskly' },
  },
]

/** Terminal `run <alias>` → mission id to focus on the GUI projects page. */
export const RUN_PROJECTS: Record<string, string> = { taskly: 'BK-001' }

export const FEATURED_PROJECT_IDS = ['BK-001'] as const

export const IDENTITY = {
  name: 'BHAVYA KUMAR',
  school: 'Applied Mathematics · University of Waterloo',
  line: 'Software engineering intern and Applied Mathematics student at the University of Waterloo.',
  github: 'https://github.com/Bhavya2025',
  linkedin: 'https://www.linkedin.com/in/bhavya-bk/',
  medium: 'https://medium.com/@bhavyakumar.bkb',
  email: 'b2kumar@uwaterloo.ca',
  resume: '/resume.pdf',
} as const
