/**
 * Project data — sourced from the real resume (public/resume.pdf).
 * Items marked `pending` are awaiting assets/links via FROM_BHAVYA/.
 */
import tasklyImg from '../assets/taskly.jpg'
import arduinoImg from '../assets/arduino.jpg'
import unityImg from '../assets/unity1.jpg'

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
    id: 'BK-002',
    year: '2023',
    name: 'SELF-DRIVING CAR',
    designation: 'Obstacle-avoiding model vehicle',
    status: 'HARDWARE',
    group: 'HARDWARE',
    stack: ['Arduino', 'Embedded C/C++', 'Ultrasonic sensors'],
    brief: [
      'Detection and motor-control logic written in C/C++; sensor thresholds tuned through real-world testing for reliable navigation.',
    ],
    image: { src: arduinoImg, alt: 'The Arduino self-driving car prototype' },
    pending: 'driving footage',
  },
  {
    id: 'BK-003',
    year: '——',
    name: 'UNITY GAMES',
    designation: 'Playable WebGL builds',
    status: 'AWAITING DATA',
    group: 'GAMES',
    stack: ['Unity', 'C#'],
    brief: [
      'Playable in-browser via itch.io embeds. Slots reserved — names and links incoming.',
    ],
    image: { src: unityImg, alt: 'Unity platformer screenshot' },
    pending: 'itch.io links per game',
  },
  {
    id: 'BK-101',
    year: 'NEXT',
    name: 'PLANET GRAVITY SIMULATOR',
    designation: 'N-body orbital physics sandbox',
    status: 'PLANNED',
    group: 'PLANNED',
    stack: ['C++', 'Emscripten', 'WebAssembly'],
    brief: [
      'Real gravitational n-body simulation written in C++, compiled to WebAssembly, embedded on this site — the rocket on the home page already points here.',
    ],
  },
  {
    id: 'BK-102',
    year: 'NEXT',
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
    year: 'NEXT',
    name: 'GIT, FROM SCRATCH',
    designation: 'Reimplementation of git internals',
    status: 'PLANNED',
    group: 'PLANNED',
    stack: ['Python'],
    brief: [
      'Building git from first principles in Python (objects, refs, index, commits) to understand the internals — in the spirit of "Write Yourself a Git".',
    ],
  },
]

export const IDENTITY = {
  name: 'BHAVYA KUMAR',
  school: 'Applied Mathematics · University of Waterloo',
  line: 'Software developer in training — building across web, embedded systems, and games.',
  github: 'https://github.com/Bhavya2025',
  linkedin: 'https://www.linkedin.com/in/bhavya-kumar-1652a8336/',
  email: 'b2kumar@uwaterloo.ca',
  resume: '/resume.pdf',
} as const
