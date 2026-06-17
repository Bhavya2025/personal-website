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
  {
    id: 'BK-004',
    year: '2026',
    name: 'BOIDS',
    designation: 'Flocking simulation with emergent swarm behavior',
    status: 'BUILT',
    group: 'SOFTWARE',
    stack: ['JavaScript', 'Canvas', 'Flocking'],
    brief: [
      "Reynolds' three rules (alignment, cohesion, separation) produce lifelike flocking from nothing but local interactions. No leader, no global plan.",
      'Each boid steers from neighbors inside a perception radius and flees the cursor. Prototyped in p5.js, then ported to a dependency-free canvas renderer for the site.',
      'Live below. Move your cursor through the flock.',
    ],
    demo: 'boids',
  },
  {
    id: 'BK-103',
    year: '2026',
    name: 'WYAG · GIT FROM SCRATCH',
    designation: 'A from-scratch Git implementation in Python',
    status: 'BUILT',
    group: 'SOFTWARE',
    stack: ['Python', 'zlib', 'SHA-1'],
    brief: [
      'Reimplemented Git\'s internals from scratch in Python, following the "Write Yourself a Git" approach: the content-addressed object store (blobs, trees, commits, tags), refs, branches and tags, the staging index, and commands from init and hash-object through log, checkout, add and commit.',
      'Biggest takeaway: Git\'s apparent complexity hides a tiny core, really just a Merkle DAG of immutable objects named by the SHA-1 of their own contents. The fiddliest part was matching Git\'s exact tree-entry sort order and byte-level index format closely enough that real git accepts the objects wyag writes.',
    ],
    repo: { label: 'GITHUB', href: 'https://github.com/Bhavya2025/wyag' },
  },
  {
    id: 'BK-002',
    year: '2023',
    name: 'EMBEDDED SYSTEMS',
    designation: 'Inside the workings of an obstacle-avoiding car · bare-metal C/C++',
    status: 'HARDWARE',
    group: 'HARDWARE',
    stack: ['Arduino', 'Embedded C/C++', 'Ultrasonic sensors'],
    brief: [
      'Hands-on embedded development: wrote the detection and motor-control logic in C/C++ on an Arduino, reading ultrasonic sensors and tuning thresholds through real-world testing for reliable obstacle avoidance.',
    ],
    image: { src: arduinoImg, alt: 'Arduino obstacle-avoiding car prototype' },
  },
  {
    id: 'BK-003',
    year: '2021',
    name: 'MULTIPLAYER PLATFORMER',
    designation: 'Unity → WebGL · a Brackeys Game Jam entry',
    status: 'DEPLOYED',
    group: 'GAMES',
    stack: ['Unity', 'C#', 'WebGL'],
    brief: [
      'A multiplayer platformer built in Unity for the Brackeys Game Jam and exported to WebGL. Playable directly below via itch.io.',
    ],
    demo: 'itch',
    link: { label: 'PLAY ON ITCH.IO', href: 'https://bulbgaming.itch.io/multiplayer-platformer' },
  },
]

/** Terminal `run <alias>` → mission id to focus on the GUI projects page. */
export const RUN_PROJECTS: Record<string, string> = {
  taskly: 'BK-001',
  boids: 'BK-004',
  git_py: 'BK-103',
  embedded: 'BK-002',
  unity: 'BK-003',
}

export const IDENTITY = {
  name: 'BHAVYA KUMAR',
  school: 'Applied Mathematics · University of Waterloo',
  line: 'A math student who builds web apps, embedded systems, and games. Sweats the details.',
  github: 'https://github.com/Bhavya2025',
  linkedin: 'https://www.linkedin.com/in/bhavya-kumar-1652a8336/',
  medium: 'https://medium.com/@bhavyakumar.bkb',
  email: 'b2kumar@uwaterloo.ca',
  resume: '/resume.pdf',
} as const
