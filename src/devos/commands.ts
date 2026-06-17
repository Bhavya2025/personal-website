/**
 * Command engine for the Dev OS. Each command is a small pure-ish
 * function that talks to the terminal through `CommandAPI`. To add a
 * command later, drop another entry into `commands` — nothing else
 * needs to change.
 *
 * All content is pulled from the single sources of truth:
 *   - lib/missions.ts  (MISSIONS, IDENTITY, RUN_PROJECTS)
 *   - lib/resume.ts    (EDUCATION, EXPERIENCE, SKILLS, ACHIEVEMENTS)
 * Nothing here is hardcoded — the terminal is a faithful CLI view of
 * the same person/site as the GUI.
 *
 * Design note: the command set is deliberately UNIQUE — no two commands
 * print the same thing. Builtins (ls/cd/cat/...) navigate the VFS; the
 * "real" commands surface resume/portfolio data; links are split into a
 * single aggregate (`contact`) plus focused openers (linkedin/github/
 * medium) that each do one distinct job.
 */
import { getNode, resolvePath, pathToString, listDir } from './fileSystem'
import { IDENTITY, RUN_PROJECTS, MISSIONS } from '../lib/missions'
import { EDUCATION, EXPERIENCE, SKILLS, ACHIEVEMENTS } from '../lib/resume'

export type LineKind = 'input' | 'output' | 'error' | 'system'

export interface OutputLine {
  id: number
  kind: LineKind
  text: string
  /** When set, the line renders as a clickable link (new tab / mailto). */
  href?: string
}

export interface CommandAPI {
  cwd: string[]
  setCwd: (segments: string[]) => void
  print: (text: string, kind?: LineKind) => void
  /** Print a clickable link line. */
  link: (text: string, href: string) => void
  clear: () => void
  exit: () => void
  /** Leave the OS and open a project on the GUI projects page. */
  openProject: (alias: string) => void
  history: string[]
}

export interface Command {
  description: string
  run: (args: string[], api: CommandAPI) => void
}

export const commands: Record<string, Command> = {
  /* --- meta --- */

  help: {
    description: 'list every command with a one-line description',
    run: (_args, api) => {
      api.print('AVAILABLE COMMANDS', 'system')
      api.print('')
      api.print('  portfolio', 'system')
      printHelpGroup(api, [
        'projects',
        'skills',
        'experience',
        'education',
        'achievements',
        'resume',
        'resume_download',
        'run',
      ])
      api.print('')
      api.print('  links', 'system')
      printHelpGroup(api, ['contact', 'github', 'linkedin', 'medium'])
      api.print('')
      api.print('  shell', 'system')
      printHelpGroup(api, [
        'ls',
        'cd',
        'cat',
        'pwd',
        'whoami',
        'echo',
        'history',
        'help',
        'clear',
        'exit',
      ])
      api.print('')
      api.print('Tab completes commands, paths, and  run <project>  names.', 'system')
    },
  },

  /* --- portfolio / resume data --- */

  projects: {
    description: 'list every project (open one with  run <name>)',
    run: (_args, api) => {
      api.print('PROJECTS', 'system')
      const aliasFor = (id: string) =>
        Object.keys(RUN_PROJECTS).find((a) => RUN_PROJECTS[a] === id) ?? ''
      for (const m of MISSIONS) {
        const alias = aliasFor(m.id)
        const tag = m.status === 'PLANNED' ? ' [PLANNED]' : ''
        api.print(`  ${alias.padEnd(10)} ${m.name} · ${m.designation}${tag}`)
      }
      api.print('')
      api.print('Open one on the site:  run <name>      (e.g.  run taskly)', 'system')
      api.print('Open every live link:  run *', 'system')
    },
  },

  skills: {
    description: 'languages, frameworks, and tools',
    run: (_args, api) => {
      api.print('SKILLS', 'system')
      for (const s of SKILLS) {
        api.print(`  ${s.label.padEnd(24)} ${s.items.join(', ')}`)
      }
    },
  },

  experience: {
    description: 'work and fellowships',
    run: (_args, api) => {
      api.print('EXPERIENCE', 'system')
      for (const e of EXPERIENCE) {
        api.print(`  ${e.role} · ${e.org}  (${e.period})`)
        api.print(`    ${e.summary}`)
      }
    },
  },

  education: {
    description: 'degree, major, and coursework',
    run: (_args, api) => {
      api.print('EDUCATION', 'system')
      api.print(`  ${EDUCATION.school} · ${EDUCATION.degree}`)
      api.print(`  ${EDUCATION.major}`)
      api.print(`  ${EDUCATION.period} · ${EDUCATION.location} · ${EDUCATION.award}`)
      api.print('')
      api.print('  Selected coursework:')
      for (const c of EDUCATION.coursework) {
        api.print(`    ${c.code.padEnd(9)} ${c.label}`)
      }
    },
  },

  achievements: {
    description: 'awards and writing',
    run: (_args, api) => {
      api.print('ACHIEVEMENTS', 'system')
      for (const a of ACHIEVEMENTS) {
        if (a.href) api.link(`  [${a.tag}] ${a.text}`, a.href)
        else api.print(`  [${a.tag}] ${a.text}`)
      }
    },
  },

  resume: {
    description: 'print my full resume inline',
    run: (_args, api) => printResume(api),
  },

  resume_download: {
    description: 'download my resume as a PDF',
    run: (_args, api) => {
      const a = document.createElement('a')
      a.href = IDENTITY.resume
      a.download = 'Bhavya-Kumar-Resume.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      api.print('↓ downloading resume.pdf ...', 'system')
    },
  },

  run: {
    description: 'open a project on the site: run <name> · run *',
    run: (args, api) => runProject(args, api),
  },

  /* --- links --- */

  contact: {
    description: 'every way to reach me, as clickable lines',
    run: (_args, api) => {
      api.print('CONTACT (click any line)', 'system')
      api.link(`  email      ${IDENTITY.email}`, `mailto:${IDENTITY.email}`)
      api.link(`  github     ${hostPath(IDENTITY.github)}`, IDENTITY.github)
      api.link(`  linkedin   ${hostPath(IDENTITY.linkedin)}`, IDENTITY.linkedin)
      api.link(`  medium     ${hostPath(IDENTITY.medium)}`, IDENTITY.medium)
    },
  },

  github: {
    description: 'open my GitHub in a new tab',
    run: (_args, api) => openLink(api, 'GitHub', IDENTITY.github),
  },

  linkedin: {
    description: 'open my LinkedIn in a new tab',
    run: (_args, api) => openLink(api, 'LinkedIn', IDENTITY.linkedin),
  },

  medium: {
    description: 'open my Medium blog in a new tab',
    run: (_args, api) =>
      openLink(api, 'Medium', IDENTITY.medium),
  },

  /* --- shell builtins --- */

  ls: {
    description: 'list directory contents',
    run: (args, api) => {
      const target = args[0] ?? ''
      const node = getNode(resolvePath(api.cwd, target))
      if (!node) {
        api.print(`ls: cannot access '${target}': No such file or directory`, 'error')
        return
      }
      if (node.type === 'file') {
        api.print(target || '.')
        return
      }
      const names = listDir(node).map(([name, child]) =>
        child.type === 'dir' ? `${name}/` : name,
      )
      if (names.length) api.print(names.join('   '))
    },
  },

  cd: {
    description: 'change directory',
    run: (args, api) => {
      const target = args[0] ?? '~'
      const path = resolvePath(api.cwd, target)
      const node = getNode(path)
      if (!node) {
        api.print(`cd: ${target}: No such file or directory`, 'error')
        return
      }
      if (node.type !== 'dir') {
        api.print(`cd: ${target}: Not a directory`, 'error')
        return
      }
      api.setCwd(path)
    },
  },

  cat: {
    description: 'print file contents, with globs (cat *  ·  cat *.txt)',
    run: (args, api) => catFiles(args, api),
  },

  pwd: {
    description: 'print the working directory',
    run: (_args, api) => api.print(pathToString(api.cwd)),
  },

  whoami: {
    description: 'one-line bio',
    run: (_args, api) => {
      api.print(IDENTITY.name, 'system')
      api.print(`  ${IDENTITY.school}`)
      api.print(`  ${IDENTITY.line}`)
    },
  },

  echo: {
    description: 'display a line of text',
    run: (args, api) => api.print(args.join(' ')),
  },

  history: {
    description: 'show the command history',
    run: (_args, api) => {
      api.history.forEach((cmd, i) =>
        api.print(`  ${String(i + 1).padStart(3)}  ${cmd}`),
      )
    },
  },

  clear: {
    description: 'clear the screen',
    run: (_args, api) => api.clear(),
  },

  exit: {
    description: 'leave the Dev OS and return to the site',
    run: (_args, api) => api.exit(),
  },
}

/** Print `names` as aligned "name  description" rows under a help group. */
function printHelpGroup(api: CommandAPI, names: string[]): void {
  for (const name of names) {
    const cmd = commands[name]
    if (cmd) api.print(`    ${name.padEnd(16)} ${cmd.description}`)
  }
}

/** "github.com/Bhavya2025" — host + path, no scheme, for compact link labels. */
function hostPath(url: string): string {
  try {
    const u = new URL(url)
    return (u.host + u.pathname).replace(/\/$/, '')
  } catch {
    return url
  }
}

/** Print a header then one clickable "→ host/path" opener, and open it. */
function openLink(api: CommandAPI, label: string, href: string): void {
  api.print(`${label}:`)
  api.link(`  → ${hostPath(href)}`, href)
  window.open(href, '_blank', 'noopener')
}

/**
 * `cat` with glob support.
 *   cat <file>          print one file
 *   cat a b c           print several files in order
 *   cat *               every file in the current dir
 *   cat *.txt           files whose name ends in ".txt"
 *   cat <prefix>*       files whose name starts with <prefix>
 * Directories among the args are skipped with a note (matches real cat).
 */
function catFiles(args: string[], api: CommandAPI): void {
  if (!args.length) {
    api.print('cat: missing operand', 'error')
    api.print("Try:  cat README.txt   ·   cat *   ·   cat *.txt", 'system')
    return
  }

  // Expand each argument: globs against the current dir, plain names as-is.
  const targets: string[] = []
  for (const arg of args) {
    if (arg.includes('*')) {
      const matches = expandGlob(api.cwd, arg)
      if (!matches.length) {
        api.print(`cat: ${arg}: No such file or directory`, 'error')
        continue
      }
      targets.push(...matches)
    } else {
      targets.push(arg)
    }
  }

  if (!targets.length) return

  // Header each file only when reading more than one (mirrors `cat`/`tail`).
  const multi = targets.length > 1
  let printed = 0
  for (const target of targets) {
    const node = getNode(resolvePath(api.cwd, target))
    if (!node) {
      api.print(`cat: ${target}: No such file or directory`, 'error')
      continue
    }
    if (node.type === 'dir') {
      api.print(`cat: ${target}: Is a directory`, 'error')
      continue
    }
    if (multi) {
      if (printed > 0) api.print('')
      api.print(`==> ${target} <==`, 'system')
    }
    api.print(node.content)
    printed++
  }
}

/**
 * Expand a glob (only `*` is supported) against the files in `cwd`.
 * `*` → all files; `*.txt` → suffix match; `pre*` → prefix match.
 * Returns sorted file names (dirs excluded — cat reads files).
 */
function expandGlob(cwd: string[], pattern: string): string[] {
  const dir = getNode(cwd)
  if (!dir || dir.type !== 'dir') return []

  const star = pattern.indexOf('*')
  const prefix = pattern.slice(0, star)
  const suffix = pattern.slice(star + 1)

  return listDir(dir)
    .filter(([, child]) => child.type === 'file')
    .map(([name]) => name)
    .filter((name) => name.startsWith(prefix) && name.endsWith(suffix))
    .filter((name) => name.length >= prefix.length + suffix.length)
}

/** `run`, `run <name>`, `run *` / `run all`, `run <prefix>*`. */
function runProject(args: string[], api: CommandAPI): void {
  const aliases = Object.keys(RUN_PROJECTS)
  const name = args[0]

  // run  → list available projects
  if (!name) {
    api.print('Usage: run <project>   ·   run *   (open every live link)', 'system')
    api.print(`Projects:  ${aliases.join('   ')}`)
    return
  }

  const lower = name.toLowerCase()

  // run *  /  run all  → open every external project link in a new tab
  if (lower === '*' || lower === 'all') {
    openAllLinks(MISSIONS, api)
    return
  }

  // run <prefix>*  → open links for matching projects
  if (lower.endsWith('*')) {
    const prefix = lower.slice(0, -1)
    const matchAliases = aliases.filter((a) => a.startsWith(prefix))
    if (!matchAliases.length) {
      api.print(`run: no projects match '${name}'`, 'error')
      api.print(`Try:  ${aliases.join('   ')}`, 'system')
      return
    }
    const ids = new Set(matchAliases.map((a) => RUN_PROJECTS[a]))
    openAllLinks(
      MISSIONS.filter((m) => ids.has(m.id)),
      api,
    )
    return
  }

  // run <name>  → open that one project on the GUI
  if (!(lower in RUN_PROJECTS)) {
    api.print(`run: ${name}: unknown project`, 'error')
    api.print(`Try:  ${aliases.join('   ')}`, 'system')
    return
  }
  api.print(`> launching ${lower}, opening it on the site ...`, 'system')
  api.openProject(lower)
}

/** Open every external link among `list`; report which opened. */
function openAllLinks(list: typeof MISSIONS, api: CommandAPI): void {
  const linked = list.filter((m) => m.link)
  if (!linked.length) {
    api.print('run: none of those projects have an external link.', 'error')
    return
  }
  api.print(`Opening ${linked.length} project link(s) in new tabs:`, 'system')
  for (const m of linked) {
    if (m.link) {
      window.open(m.link.href, '_blank', 'noopener')
      api.link(`  → ${m.name}  ${m.link.href}`, m.link.href)
    }
  }
  api.print('')
  api.print(
    'If nothing opened, your browser blocked the pop-ups. Allow them and retry,',
    'system',
  )
  api.print('or click the links above individually.', 'system')
}

/** Print the resume as formatted terminal text (sourced from resume.ts). */
function printResume(api: CommandAPI): void {
  const head = (t: string) => api.print(t, 'system')

  head(IDENTITY.name)
  api.print(`  ${IDENTITY.line}`)
  api.print('')

  head('EDUCATION')
  api.print(`  ${EDUCATION.school} · ${EDUCATION.degree}`)
  api.print(`  ${EDUCATION.major}`)
  api.print(`  ${EDUCATION.period} · ${EDUCATION.location} · ${EDUCATION.award}`)
  api.print('')

  head('EXPERIENCE')
  for (const e of EXPERIENCE) {
    api.print(`  ${e.role} · ${e.org}  (${e.period})`)
    api.print(`    ${e.summary}`)
  }
  api.print('')

  head('PROJECTS')
  for (const m of MISSIONS) {
    const tag = m.status === 'PLANNED' ? ' [PLANNED]' : ''
    api.print(`  ${m.name} · ${m.designation}${tag}`)
  }
  api.print('')

  head('SKILLS')
  for (const s of SKILLS) api.print(`  ${s.label.padEnd(24)} ${s.items.join(', ')}`)
  api.print('')

  head('ACHIEVEMENTS')
  for (const a of ACHIEVEMENTS) api.print(`  [${a.tag}] ${a.text}`)
  api.print('')

  head('LINKS')
  api.link(`  github     ${hostPath(IDENTITY.github)}`, IDENTITY.github)
  api.link(`  linkedin   ${hostPath(IDENTITY.linkedin)}`, IDENTITY.linkedin)
  api.link(`  medium     ${hostPath(IDENTITY.medium)}`, IDENTITY.medium)
  api.print('')
  api.print("type 'resume_download' to grab the PDF.", 'system')
}

/** Names available for tab-completion of the first token. */
export const commandNames: string[] = Object.keys(commands)
