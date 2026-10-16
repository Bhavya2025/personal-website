import { FEATURED_PROJECT_IDS, MISSIONS } from '../lib/missions'
import type { Mission } from '../lib/missions'

interface ProjectNotes {
  slug: string
  title: string
  category: string
  context: string
  overview: string
  detail: string
  focus: string
  sections: { title: string; text: string }[]
  credit?: { text: string; href: string; label: string }
}

const notes: Record<string, ProjectNotes> = {
  'BK-103': {
    slug: 'wyag', title: 'Wyag', category: 'Developer tools', context: 'Learning implementation',
    overview: 'A Git implementation in Python, down to the bytes.',
    detail: 'Implemented 15 core commands, a content-addressed object store, and a parser for Git’s binary staging index.',
    focus: 'Object serialization, tree ordering, and the staging index.',
    sections: [
      { title: 'Object storage', text: 'The implementation stores blobs, trees, commits, and tags. Object IDs come from SHA-1 hashes of the object header and content; zlib handles compression. References point to commits, which connect snapshots to their history.' },
      { title: 'The index is a binary format', text: 'The staging area requires more than a list of filenames. I parsed the index’s entries and file metadata to support staging and worktree modification detection without using a Git library.' },
      { title: 'Tree serialization', text: 'Tree serialization requires Git’s ordering rules. I worked through serialization and object-identity mismatches to reproduce that behavior.' },
    ],
    credit: { text: 'I built this learning implementation by following', href: 'https://wyag.thb.lt/', label: 'Write Yourself a Git' },
  },
  'BK-006': {
    slug: 'graph-mechanics', title: 'Graph Mechanics', category: 'Math & simulation', context: 'Interactive experiment',
    overview: 'A physics puzzle with adjustable curves.',
    detail: 'A browser puzzle that turns sampled mathematical functions into Matter.js collision terrain.',
    focus: 'Connecting function evaluation, coordinate transforms, and physics.',
    sections: [
      { title: 'From a function to a surface', text: 'Players adjust parameters in line and quadratic templates, then launch a ball toward a target. mathjs compiles the function templates; sampled points become overlapping static rectangles in the physics world.' },
      { title: 'Keep the coordinate systems aligned', text: 'Graph-space uses positive y upward, while canvas-space uses positive y downward. A shared transformation and uniform scale keep the curve, obstacles, ball, and target aligned. The optional launch ramp estimates a tangent from neighboring samples.' },
      { title: 'Levels and local progress', text: 'The repository contains three authored levels, editing and simulation states, win/loss conditions, and local progress. Progress, best times, and the mock leaderboard stay in the browser’s localStorage.' },
    ],
  },
  'BK-001': {
    slug: 'taskly', title: 'Taskly', category: 'Web application', context: 'Personal project · live demo',
    overview: 'A kanban board with an AI assistant.',
    detail: 'Drag-and-drop boards, undo/redo, natural-language commands, and shared state across tabs.',
    focus: 'State consistency and handling unpredictable model output.',
    sections: [
      { title: 'One mutation path', text: 'Task changes go through a centralized mutation pipeline with undo/redo history and a 500 ms debounced Supabase sync. Guest and authenticated modes share the same state model, with realtime updates across tabs.' },
      { title: 'Language to actions', text: 'The assistant supports board generation and task commands. Fuzzy matching resolves task and column references, while a JSON extraction fallback handles model responses that do not follow the requested format.' },
      { title: 'Scroll performance', text: 'I investigated a scroll regression and used ref-based DOM updates and passive event listeners. The app also has a separate mobile component tree.' },
    ],
  },
  'BK-005': {
    slug: 'software-factory', title: 'Software Factory', category: 'Agent workflows', context: 'Hackathon team prototype',
    overview: 'Feature requests through a multi-stage agent workflow.',
    detail: 'A SuperPlane hackathon project connecting specification, implementation, verification, and Render previews.',
    focus: 'Validation between agent stages and deployment integrations.',
    sections: [
      { title: 'The workflow', text: 'At the New York hackathon in June 2026, I worked on a workflow for turning natural-language feature requests into proofs of concept. Specification, implementation, and verification are separate stages, with validation gates between them.' },
      { title: 'Integrations', text: 'The team prototype contains CLI and MCP integrations for GitHub, SuperPlane pipelines, and Render preview deployment. The linked repository contains the project as a source archive.' },
    ],
  },
  'BK-004': {
    slug: 'boids', title: 'Boids', category: 'Math & simulation', context: 'Browser experiment',
    overview: 'Collective motion from local rules.',
    detail: 'An interactive canvas simulation using alignment, cohesion, and separation.',
    focus: 'Emergent behavior from simple neighbor interactions.',
    sections: [
      { title: 'Three steering rules', text: 'Each agent steers toward nearby headings, toward the local center, and away from close neighbors. The flock emerges from those interactions, with an additional cursor-avoidance force.' },
      { title: 'Browser implementation', text: 'I prototyped the simulation in p5.js and ported it to a dependency-free canvas renderer. The renderer pauses off-screen, caps pixel density, and draws a static frame for reduced-motion preferences. The demo starts after you press Run.' },
    ],
  },
  'BK-002': {
    slug: 'obstacle-avoiding-car', title: 'Obstacle-avoiding car', category: 'Hardware', context: 'School hardware project',
    overview: 'Sensing and motor control on an Arduino.',
    detail: 'Ultrasonic obstacle detection and control logic in embedded C/C++.',
    focus: 'Tuning sensor thresholds through physical testing.',
    sections: [{ title: 'A physical feedback loop', text: 'I wrote the ultrasonic detection and motor-control logic in C/C++ and tuned thresholds through real-world tests. The prototype demonstrates the interaction between sensing, control decisions, and movement.' }],
  },
  'BK-003': {
    slug: 'multiplayer-platformer', title: 'Multiplayer platformer', category: 'Game development', context: 'Game jam project',
    overview: 'A Unity platformer for the Brackeys Game Jam.',
    detail: 'Built in C# and exported to WebGL, with a playable version on itch.io.',
    focus: 'Game development and browser delivery.',
    sections: [{ title: 'An early game project', text: 'I built this platformer in Unity for the Brackeys Game Jam in 2021 and exported it to WebGL. The itch.io page provides a playable version. It remains in this index as an early project.' }],
  },
}

export type PortfolioProject = Mission & ProjectNotes
export const PROJECTS: PortfolioProject[] = MISSIONS.flatMap(project => {
  const metadata = notes[project.id]
  return metadata ? [{ ...project, ...metadata }] : []
})
export const SELECTED_PROJECTS = FEATURED_PROJECT_IDS.flatMap(id => PROJECTS.filter(project => project.id === id))
export const ORDERED_PROJECTS = [...SELECTED_PROJECTS, ...PROJECTS.filter(project => !SELECTED_PROJECTS.includes(project))]
