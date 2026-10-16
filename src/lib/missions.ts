/**
 * Portfolio projects, grounded in the current resume and previous portfolio.
 * Only verified project URLs are included; missing links are not fabricated.
 */
import tasklyImg from '../assets/taskly.jpg'
import arduinoImg from '../assets/arduino.jpg'

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
    id: 'BK-006',
    year: '2026',
    name: 'GRAPH MECHANICS',
    designation: 'A curve-and-physics puzzle',
    summary: 'Shape a curve with parameter sliders, then launch a ball toward a target. Sampled functions become collision terrain in a browser physics simulation.',
    status: 'BUILT',
    group: 'GAMES',
    stack: ['TypeScript', 'React', 'Matter.js', 'mathjs'],
    brief: [
      'Built three levels around adjustable line and quadratic templates. A shared coordinate transform keeps graph-space points, the canvas, and the physics world aligned.',
      'Compiled and cached function templates with mathjs, sampled finite points, and converted the segments into overlapping static Matter.js bodies.',
      'Used local storage for progress and best times. The leaderboard is a local mock; there is no online leaderboard or multiplayer service.',
    ],
    repo: { label: 'SOURCE', href: 'https://github.com/Bhavya2025/graph-mechanics' },
  },
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
  {
    id: 'BK-005',
    year: '2026',
    name: 'SOFTWARE FACTORY',
    designation: 'An autonomous LLM agent pipeline',
    summary: 'A multi-stage agent workflow that turns feature requests into software proofs of concept and live previews.',
    status: 'BUILT',
    group: 'SOFTWARE',
    stack: ['SuperPlane', 'LLM agents', 'Render'],
    repo: { label: 'PROJECT ARCHIVE', href: 'https://github.com/Bhavya2025/sp-hacks' },
    brief: [
      'Built at a New York LLM-agent hackathon in June 2026. The workflow takes a natural-language feature request through specification, implementation, and verification.',
      'Added validation gates between stages to prevent failed model output from advancing through the pipeline.',
      'Automated code generation, Git commits, and deployment to live Render previews. Tested the pipeline against real open issues from the SuperPlane repository.',
    ],
  },
  {
    id: 'BK-004',
    year: '2026',
    name: 'BOIDS',
    designation: 'Flocking simulation with emergent swarm behavior',
    summary: 'A browser-based exploration of how simple local rules create collective behavior.',
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
    summary: "A Python implementation of 15 core Git commands, from the object store to the binary staging index.",
    status: 'BUILT',
    group: 'SOFTWARE',
    stack: ['Python', 'zlib', 'SHA-1'],
    brief: [
      'Implemented 15 core Git commands in Python, following the Write Yourself a Git approach. Built the object model, a Merkle DAG, and content-addressed storage using SHA-1 hashing and zlib compression.',
      'Parsed the binary index format to support staging, file metadata tracking, and worktree modification detection without Git libraries.',
      'Debugged serialization and object-identity mismatches, and implemented Git-compatible tree ordering to reproduce Git behavior.',
    ],
    repo: { label: 'GITHUB', href: 'https://github.com/Bhavya2025/wyag' },
  },
  {
    id: 'BK-002',
    year: '2023',
    name: 'EMBEDDED SYSTEMS',
    designation: 'Inside the workings of an obstacle-avoiding car · bare-metal C/C++',
    summary: 'An Arduino car with ultrasonic obstacle detection and motor-control logic written in C/C++.',
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
    summary: 'A Unity platformer made for the Brackeys Game Jam and published as a playable WebGL game.',
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
  factory: 'BK-005',
  taskly: 'BK-001',
  boids: 'BK-004',
  git_py: 'BK-103',
  embedded: 'BK-002',
  unity: 'BK-003',
}

export const FEATURED_PROJECT_IDS = ['BK-103', 'BK-006', 'BK-001'] as const

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
