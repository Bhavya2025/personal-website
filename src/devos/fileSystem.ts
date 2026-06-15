/**
 * Tiny virtual file system for the Hidden Dev OS — just enough to give
 * ls / cd / cat some charm. NO executables, no `./bin` model: the real
 * site actions live in commands.ts (about / projects / run / etc.).
 *
 * Content is intentionally light and points back at the real commands so
 * the filesystem reads as a friendly map, not a second source of truth.
 */

export interface VFile {
  type: 'file'
  content: string
}

export interface VDir {
  type: 'dir'
  children: Record<string, VNode>
}

export type VNode = VFile | VDir

/* --- The tree (root = `~`) --- */

export const HOME: VDir = {
  type: 'dir',
  children: {
    'README.txt': {
      type: 'file',
      content: `You're in a guest shell on my portfolio.

This filesystem is mostly for fun — the useful stuff is commands:

  whoami       one-line bio
  projects     what I've built  (then  run <name>  to open one)
  skills       languages, frameworks, tools
  experience   work / fellowships
  education    University of Waterloo
  achievements awards + writing
  resume       my resume, printed here
  contact      every way to reach me

Type  help  for the full list, or  cat *  to read every file here.`,
    },
    'bio.txt': {
      type: 'file',
      content: `Bhavya Kumar — Honours Mathematics (Co-op), University of Waterloo.
Major: Applied Mathematics with Scientific Computing & Scientific
Machine Learning.

I build across the web, embedded systems, and games, and care as much
about how something feels as whether it works.

Run  whoami  for the formatted version.`,
    },
    projects: {
      type: 'dir',
      children: {
        'README.txt': {
          type: 'file',
          content: `These are listed live by the  projects  command.

To open one on the site:   run <name>
To list the names:         run
To open every live link:   run *`,
        },
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
  if (t === '') raw = [...cwd]
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

/**
 * Entries of a directory, sorted (dirs first, then files, A–Z) so that
 * `ls` and `cat *` are deterministic and read top-to-bottom.
 */
export function listDir(dir: VDir): Array<[string, VNode]> {
  return Object.entries(dir.children).sort((a, b) => {
    const aDir = a[1].type === 'dir'
    const bDir = b[1].type === 'dir'
    if (aDir !== bDir) return aDir ? -1 : 1
    return a[0].localeCompare(b[0])
  })
}
