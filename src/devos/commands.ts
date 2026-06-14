/**
 * Command engine for the Dev OS. Each command is a small pure-ish
 * function that talks to the terminal through `CommandAPI`. To add a
 * command later, drop another entry into `commands` — nothing else
 * needs to change.
 */
import { getNode, resolvePath, pathToString } from './fileSystem'
import { IDENTITY, RUN_PROJECTS } from '../lib/missions'
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
  help: {
    description: 'list available commands',
    run: (_args, api) => {
      api.print('Available commands:', 'system')
      for (const [name, cmd] of Object.entries(commands)) {
        api.print(`  ${name.padEnd(16)} ${cmd.description}`)
      }
      api.print(`  ${'./<bin>'.padEnd(16)} run an executable in ~/projects`)
    },
  },

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
      const names = Object.entries(node.children).map(([name, child]) =>
        child.type === 'dir' ? `${name}/` : child.executable ? `${name}*` : name,
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

  pwd: {
    description: 'print working directory',
    run: (_args, api) => api.print(pathToString(api.cwd)),
  },

  cat: {
    description: 'print a file to the screen',
    run: (args, api) => {
      const target = args[0]
      if (!target) {
        api.print('cat: missing operand', 'error')
        return
      }
      const node = getNode(resolvePath(api.cwd, target))
      if (!node) {
        api.print(`cat: ${target}: No such file or directory`, 'error')
        return
      }
      if (node.type === 'dir') {
        api.print(`cat: ${target}: Is a directory`, 'error')
        return
      }
      api.print(node.content)
    },
  },

  echo: {
    description: 'display a line of text',
    run: (args, api) => api.print(args.join(' ')),
  },

  clear: {
    description: 'clear the screen',
    run: (_args, api) => api.clear(),
  },

  whoami: {
    description: 'print the current user',
    run: (_args, api) => api.print('guest'),
  },

  history: {
    description: 'show command history',
    run: (_args, api) => {
      api.history.forEach((cmd, i) => api.print(`  ${String(i + 1).padStart(3)}  ${cmd}`))
    },
  },

  linkedin: {
    description: 'open my LinkedIn',
    run: (_args, api) => {
      api.print('LinkedIn:')
      api.link('  → linkedin.com/in/bhavya-kumar', IDENTITY.linkedin)
    },
  },

  github: {
    description: 'open my GitHub',
    run: (_args, api) => {
      api.print('GitHub:')
      api.link('  → github.com/Bhavya2025', IDENTITY.github)
    },
  },

  medium: {
    description: 'open my blog (Medium)',
    run: (_args, api) => {
      api.print('Medium — "School of Machine Learning":')
      api.link('  → medium.com/@bhavyakumar.bkb', IDENTITY.medium)
    },
  },

  contact: {
    description: 'every way to reach me',
    run: (_args, api) => {
      api.print('Reach me — click any line:', 'system')
      api.link('  email      b2kumar@uwaterloo.ca', `mailto:${IDENTITY.email}`)
      api.link('  github     github.com/Bhavya2025', IDENTITY.github)
      api.link('  linkedin   linkedin.com/in/bhavya-kumar', IDENTITY.linkedin)
      api.link('  medium     medium.com/@bhavyakumar.bkb', IDENTITY.medium)
    },
  },

  resume: {
    description: 'print my resume in the terminal',
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
    description: 'open a project on the site — run <name>',
    run: (args, api) => {
      const name = args[0]
      const names = Object.keys(RUN_PROJECTS).join('   ')
      if (!name) {
        api.print('Usage: run <project>', 'system')
        api.print(`Projects:  ${names}`)
        return
      }
      if (!(name in RUN_PROJECTS)) {
        api.print(`run: ${name}: unknown project`, 'error')
        api.print(`Try:  ${names}`, 'system')
        return
      }
      api.print(`> launching ${name} — opening it in a new tab ...`, 'system')
      api.openProject(name)
    },
  },

  exit: {
    description: 'leave the Dev OS, return to the GUI',
    run: (_args, api) => api.exit(),
  },

  gui: {
    description: 'leave the Dev OS, return to the GUI',
    run: (_args, api) => api.exit(),
  },
}

/** Print the resume as formatted terminal text (sourced from resume.ts). */
function printResume(api: CommandAPI): void {
  const head = (t: string) => api.print(t, 'system')

  head('BHAVYA KUMAR')
  api.print(IDENTITY.line)
  api.print('')

  head('EDUCATION')
  api.print(`  ${EDUCATION.school} — ${EDUCATION.degree}`)
  api.print(`  ${EDUCATION.major}`)
  api.print(`  ${EDUCATION.period} · ${EDUCATION.location} · ${EDUCATION.award}`)
  api.print('')

  head('EXPERIENCE')
  for (const e of EXPERIENCE) {
    api.print(`  ${e.role} — ${e.org}  (${e.period})`)
    api.print(`    ${e.summary}`)
  }
  api.print('')

  head('SKILLS')
  for (const s of SKILLS) api.print(`  ${s.label.padEnd(22)} ${s.items.join(', ')}`)
  api.print('')

  head('ACHIEVEMENTS')
  for (const a of ACHIEVEMENTS) api.print(`  [${a.tag}] ${a.text}`)
  api.print('')

  head('LINKS')
  api.link('  github     github.com/Bhavya2025', IDENTITY.github)
  api.link('  linkedin   linkedin.com/in/bhavya-kumar', IDENTITY.linkedin)
  api.print('')
  api.print("type 'resume_download' to grab the PDF.", 'system')
}

/** Run an executable (`./name`): print its content, or a UNIX-style error. */
export function execute(name: string, api: CommandAPI): void {
  const node = getNode(resolvePath(api.cwd, name))
  if (!node) {
    api.print(`bash: ./${name}: No such file or directory`, 'error')
    return
  }
  if (node.type === 'dir') {
    api.print(`bash: ./${name}: Is a directory`, 'error')
    return
  }
  if (!node.executable) {
    api.print(`bash: ./${name}: Permission denied`, 'error')
    return
  }
  api.print(node.content)
}

/** Names available for tab-completion of the first token. */
export const commandNames: string[] = Object.keys(commands)
