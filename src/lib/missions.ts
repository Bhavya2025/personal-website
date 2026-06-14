/**
 * Project data — sourced from the real resume (public/resume.pdf).
 * Items marked `pending` are awaiting assets/links via FROM_BHAVYA/.
 */
import tasklyImg from '../assets/taskly.jpg'
import arduinoImg from '../assets/arduino.jpg'

export type MissionGroup = 'SOFTWARE' | 'HARDWARE' | 'GAMES' | 'PLANNED'

export interface Mission {
  id: string
  year: string
  name: string
  designation: string
  status: 'DEPLOYED' | 'HARDWARE' | 'AWAITING DATA' | 'PLANNED'
  group: MissionGroup
  stack: string[]
  brief: string[]
  image?: { src: string; alt: string }
  /** Renders a live in-card demo instead of a static image. */
  demo?: 'boids' | 'itch'
  link?: { label: string; href: string }
  pending?: string
}

export const MISSIONS: Mission[] = [
  {
    id: 'BK-001',
    year: '2026',
    name: 'TASKLY',
    designation: 'Kanban app with built-in AI assistant',
    status: 'DEPLOYED',
    group: 'SOFTWARE',
    stack: ['React', 'Supabase', 'DeepSeek-R1 70B', 'Vercel'],
    brief: [
      'Multi-project boards with drag-and-drop and a separate mobile component tree triggered by viewport detection.',
      'Centralized mutation pipeline with undo/redo history and 500ms-debounced sync — one source of truth across guest and authenticated modes, with realtime cross-tab updates.',
      'AI integrated in two flows: full board generation from natural-language descriptions, and command parsing with fuzzy task resolution.',
      'Diagnosed and fixed a 60fps scroll regression via ref-based DOM mutations and passive event listeners.',
    ],
    image: { src: tasklyImg, alt: 'Taskly kanban board interface' },
    link: { label: 'LAUNCH APP', href: 'https://taskly-virid.vercel.app' },
    pending: 'repo link',
  },
  {
    id: 'BK-004',
    year: '2026',
    name: 'BOIDS',
    designation: 'Flocking simulation — emergent swarm behavior',
    status: 'DEPLOYED',
    group: 'SOFTWARE',
    stack: ['JavaScript', 'Canvas', 'Flocking'],
    brief: [
      "Reynolds' three rules — alignment, cohesion, separation — produce lifelike flocking from nothing but local interactions; no leader, no global plan.",
      'Each boid steers from neighbors inside a perception radius and flees the cursor. Prototyped in p5.js, then ported to a dependency-free canvas renderer for the site.',
      'Live below — move your cursor through the flock.',
    ],
    demo: 'boids',
  },
  {
    id: 'BK-102',
    year: '2026',
    name: 'SLACK AI CHATBOT',
    designation: 'LLM-powered workspace assistant',
    status: 'PLANNED',
    group: 'PLANNED',
    stack: ['Python', 'Slack API', 'LLM API'],
    brief: [
      'A Slack bot that answers questions and runs small workflows through an LLM backend.',
    ],
  },
  {
    id: 'BK-103',
    year: '2026',
    name: 'GIT, FROM SCRATCH',
    designation: 'Reimplementation of git internals',
    status: 'PLANNED',
    group: 'PLANNED',
    stack: ['Python'],
    brief: [
      'Building git from first principles in Python (objects, refs, index, commits) to understand the internals — in the spirit of "Write Yourself a Git".',
    ],
  },
  {
    id: 'BK-002',
    year: '2023',
    name: 'EMBEDDED SYSTEMS',
    designation: 'Arduino obstacle-avoiding car · bare-metal C/C++',
    status: 'HARDWARE',
    group: 'HARDWARE',
    stack: ['Arduino', 'Embedded C/C++', 'Ultrasonic sensors'],
    brief: [
      'Hands-on embedded development: wrote the detection and motor-control logic in C/C++ on an Arduino, reading ultrasonic sensors and tuning thresholds through real-world testing for reliable obstacle avoidance.',
    ],
    image: { src: arduinoImg, alt: 'Arduino obstacle-avoiding car prototype' },
    pending: 'driving footage',
  },
  {
    id: 'BK-003',
    year: '2021',
    name: 'MULTIPLAYER PLATFORMER',
    designation: 'WebGL game — playable in-browser',
    status: 'DEPLOYED',
    group: 'GAMES',
    stack: ['Unity', 'C#', 'WebGL'],
    brief: [
      'A multiplayer platformer built in Unity and exported to WebGL — playable directly below via itch.io.',
    ],
    demo: 'itch',
    link: { label: 'PLAY ON ITCH.IO', href: 'https://bulbgaming.itch.io/multiplayer-platformer' },
  },
]

/** Terminal `run <alias>` → mission id to focus on the GUI projects page. */
export const RUN_PROJECTS: Record<string, string> = {
  taskly: 'BK-001',
  boids: 'BK-004',
  slack: 'BK-102',
  git_py: 'BK-103',
  embedded: 'BK-002',
  unity: 'BK-003',
}

export const IDENTITY = {
  name: 'BHAVYA KUMAR',
  school: 'Applied Mathematics · University of Waterloo',
  line: 'I build across web, embedded systems, and games — and I care as much about how it feels as whether it works.',
  github: 'https://github.com/Bhavya2025',
  linkedin: 'https://www.linkedin.com/in/bhavya-kumar-1652a8336/',
  medium: 'https://medium.com/@bhavyakumar.bkb',
  email: 'b2kumar@uwaterloo.ca',
  resume: '/resume.pdf',
} as const
