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
  sections: { title: string; text: string; evidence?: { href: string; label: string } }[]
  credit?: { text: string; href: string; label: string }
}

const notes: Record<string, ProjectNotes> = {
  'BK-001': {
    slug: 'taskly', title: 'Taskly', category: 'Web application', context: 'Personal project · live demo',
    overview: 'A task board you can edit by hand or through an AI assistant.',
    detail: 'Organize tasks into columns, move cards, or describe a change in plain language. Taskly combines a React board with undo/redo, guest storage, and Supabase-backed accounts.',
    focus: 'State consistency and handling unpredictable model output.',
    sections: [
      { title: 'One board, one update path', text: 'Board actions use commitBoardChange, which stores previous states and clears redo history after a new edit. Undo and redo each retain up to 80 snapshots. Local storage is updated separately, while signed-in board changes schedule a Supabase save after 500 ms without another change. That pause reduces repeated writes; it does not establish conflict-free collaboration.', evidence: { label: 'Inspect board history and persistence', href: 'https://github.com/Bhavya2025/taskly/blob/8138a662469b9e569f23bae83364c8ad679411a6/src/App.jsx#L466-L568' } },
      { title: 'Model output becomes a board action', text: 'The assistant requests an action type and task/column names, then matches those names against the current board. A move calls the same handler used by the interface. An unmatched task produces a message instead of a task update. This keeps language interpretation separate from the board operation.', evidence: { label: 'Inspect command dispatch', href: 'https://github.com/Bhavya2025/taskly/blob/8138a662469b9e569f23bae83364c8ad679411a6/src/components/AIAgent.jsx#L92-L128' } },
      { title: 'Recovering structured output', text: 'The server strips reasoning tags and attempts to extract a JSON object when the response includes extra prose. The client normalizes fields such as priority and color before using them. These fallbacks handle some formatting problems, but parsing valid JSON alone does not prove that a command matches the user’s intent.', evidence: { label: 'Inspect response parsing', href: 'https://github.com/Bhavya2025/taskly/blob/8138a662469b9e569f23bae83364c8ad679411a6/server/geminiHelpers.js#L223-L234' } },
    ],
  },
}

export type PortfolioProject = Mission & ProjectNotes
export const PROJECTS: PortfolioProject[] = MISSIONS.flatMap(project => {
  const metadata = notes[project.id]
  return metadata ? [{ ...project, ...metadata }] : []
})
export const SELECTED_PROJECTS = FEATURED_PROJECT_IDS.flatMap(id => PROJECTS.filter(project => project.id === id))
export const ORDERED_PROJECTS = [...SELECTED_PROJECTS, ...PROJECTS.filter(project => !SELECTED_PROJECTS.includes(project))]


/** Homepage content supplied in the user's October 17 editorial brief. */
export const HERO = {
  eyebrow: 'Software Engineering · Applied Mathematics',
  lead: 'Software Engineering Intern at ToadEx · Applied Mathematics (Scientific Computing & ML) at the University of Waterloo.',
  body: 'I build fault-tolerant backend middleware, developer tooling, and AI-orchestrated web applications. Currently architecting hardware-facing Python/FastAPI payment and printing systems for multi-tenant restaurant kiosks.',
  availability: 'Available for 2027 SWE Co-op / Internships (Flexible Waterloo Sequence)',
}

export const TASKLY_CHALLENGE = 'Synchronizing manual drag-and-drop board mutations and natural-language AI commands through a unified command-pattern state engine without breaking deterministic undo/redo history.'

export interface SystemsProject {
  id: string
  title: string
  subtitle: string
  stack: string[]
  description: string
  repo: string
  credit?: { label: string; href: string }
}

/** Add or edit secondary projects here; absent demo links are never fabricated. */
export const SYSTEMS_PROJECTS: SystemsProject[] = [
  {
    id: 'wyag', title: 'Wyag', subtitle: 'Custom Git Version Control Engine',
    stack: ['Python', 'Systems', 'SHA-1', 'Merkle DAG'],
    description: 'Command-line Git client built from scratch implementing a content-addressable SHA-1 object store, Merkle DAG traversal, and a binary .git/index parser.',
    repo: 'https://github.com/Bhavya2025/wyag',
    credit: { label: 'Learning implementation · Write Yourself a Git', href: 'https://wyag.thb.lt/' },
  },

]

export const TECHNICAL_STACK = [
  { label: 'Languages', items: ['Python', 'C', 'C++', 'TypeScript', 'JavaScript', 'SQL', 'Bash'] },
  { label: 'Backend & Systems', items: ['FastAPI', 'Django', 'Node.js', 'REST API Design', 'Git Internals', 'Linux/Unix', 'SQLite', 'Supabase'] },
  { label: 'Frontend & Graphics', items: ['React', 'Next.js', 'Tailwind CSS', 'Three.js', 'State Management'] },
]
