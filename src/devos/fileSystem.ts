/**
 * Virtual file system for the Hidden Dev OS.
 *
 * `HOME` is the root of `~`. To expand the environment later, just add
 * nodes to the tree below — directories nest via `children`, files carry
 * `content`, and "binaries" set `executable: true` so they can be run
 * with `./name`. No other code needs to change.
 */

export interface VFile {
  type: 'file'
  content: string
  executable?: boolean
}

export interface VDir {
  type: 'dir'
  children: Record<string, VNode>
}

export type VNode = VFile | VDir

/* --- Project "binaries": ASCII art + a short brief, printed on ./run --- */

const TASKLY = `
 ┌──────────┬──────────┬──────────┐
 │ BACKLOG  │  DOING   │   DONE   │
 ├──────────┼──────────┼──────────┤
 │ ▢ boards │ ▣ ai-gen │ ✓ auth   │
 │ ▢ search │          │ ✓ sync   │
 └──────────┴──────────┴──────────┘

TASKLY  ·  Kanban app with a built-in AI assistant
React · Supabase · DeepSeek-R1 70B · Vercel

  > DeepSeek-R1 70B is wired into two flows: full board
    generation from a natural-language project description,
    and command parsing with fuzzy task/column resolution
    (regex-fallback JSON extraction when the model rambles).
  > Centralized mutation pipeline: undo/redo history with
    500ms-debounced sync, one source of truth across guest
    (localStorage) and authenticated modes, realtime cross-tab.

  live: https://taskly-virid.vercel.app
`.trim()

const EMBEDDED_CAR = `
        ____________________
   ____/  o   o   o   o   o  \\____
  / o                          o \\
  \\__()________________________()__/
     [ ULTRASONIC ]   [ MOTOR-CTRL ]

EMBEDDED-CAR  ·  Obstacle-avoiding model vehicle
Arduino · bare-metal C/C++ · ultrasonic sensors

  > Detection + motor-control logic written in C/C++ on the
    microcontroller; sensor thresholds tuned through real-world
    testing for reliable obstacle avoidance.
`.trim()

const UNITY_GAME = `
    ____________________________
   |  ________________________  |
   | |  MULTIPLAYER PLATFORMER | |
   | |  ______    ______       | |
   | | |      |  |      | P2   | |
   | | | P1   |  |      |      | |
   | |_|______|__|______|______| |
   |____________________________|

MULTIPLAYER-PLATFORMER  ·  WebGL game   [DEPLOYED]
Unity · C# · WebGL

  > A multiplayer platformer exported to WebGL —
    playable in-browser via itch.io.
  > https://bulbgaming.itch.io/multiplayer-platformer
`.trim()

/* --- The tree --- */

export const HOME: VDir = {
  type: 'dir',
  children: {
    'about.txt': {
      type: 'file',
      content: `Bhavya Kumar — Honours Mathematics (Co-op), University of Waterloo.
Major: Applied Mathematics with Scientific Computing & Scientific
Machine Learning.

Focus: computational mathematics and systems — the layer where math,
performance, and real hardware meet. I build across the web, embedded
systems, and games, and care as much about how something feels as
whether it works.

Try:  ls            list this directory
      cat about.txt re-read this
      cd projects   then  ./taskly   to run a project`,
    },
    'contact.txt': {
      type: 'file',
      content: `email     b2kumar@uwaterloo.ca
github    https://github.com/Bhavya2025
linkedin  https://www.linkedin.com/in/bhavya-kumar-1652a8336/
medium    https://medium.com/@bhavyakumar.bkb`,
    },
    skills: {
      type: 'dir',
      children: {
        'languages.json': {
          type: 'file',
          content: `{
  "systems":     ["C", "C++"],
  "scripting":   ["Python"],
  "functional":  ["Racket"],
  "web":         ["JavaScript", "TypeScript"],
  "data":        ["SQL"]
}`,
        },
        'hardware.txt': {
          type: 'file',
          content: `microcontrollers   Arduino (bare-metal C/C++)
sensors            ultrasonic ranging, threshold tuning
interfaces         motor control, real-time loops`,
        },
      },
    },
    projects: {
      type: 'dir',
      children: {
        'README.md': {
          type: 'file',
          content: `Executables in this directory — run them with ./<name>:

  ./taskly            Kanban app + DeepSeek-R1 AI assistant
  ./embedded-car      Arduino obstacle-avoiding vehicle
  ./unity-platformer  Multiplayer platformer (WebGL)`,
        },
        taskly: { type: 'file', executable: true, content: TASKLY },
        'embedded-car': { type: 'file', executable: true, content: EMBEDDED_CAR },
        'unity-platformer': { type: 'file', executable: true, content: UNITY_GAME },
      },
    },
  },
}

/** Walk the tree to a node by absolute segments (from home). */
export function getNode(segments: string[]): VNode | null {
  let node: VNode = HOME
  for (const seg of segments) {
    if (node.type !== 'dir') return null
    const child: VNode | undefined = node.children[seg]
    if (!child) return null
    node = child
  }
  return node
}

/**
 * Resolve `target` (relative or absolute) against `cwd` into normalized
 * segments from home. Handles `~`, `/`, `.`, `..`. Never throws.
 */
export function resolvePath(cwd: string[], target: string): string[] {
  const t = target.trim()
  let raw: string[]
  if (t === '' ) raw = [...cwd]
  else if (t === '~' || t === '/') raw = []
  else if (t.startsWith('~/')) raw = t.slice(2).split('/')
  else if (t.startsWith('/')) raw = t.slice(1).split('/')
  else raw = [...cwd, ...t.split('/')]

  const out: string[] = []
  for (const part of raw) {
    if (part === '' || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return out
}

/** Pretty path for the prompt / pwd. */
export function pathToString(segments: string[]): string {
  return segments.length ? '~/' + segments.join('/') : '~'
}
