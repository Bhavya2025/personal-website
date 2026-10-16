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
}

export type PortfolioProject = Mission & ProjectNotes
export const PROJECTS: PortfolioProject[] = MISSIONS.flatMap(project => {
  const metadata = notes[project.id]
  return metadata ? [{ ...project, ...metadata }] : []
})
export const SELECTED_PROJECTS = FEATURED_PROJECT_IDS.flatMap(id => PROJECTS.filter(project => project.id === id))
export const ORDERED_PROJECTS = [...SELECTED_PROJECTS, ...PROJECTS.filter(project => !SELECTED_PROJECTS.includes(project))]
