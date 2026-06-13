/**
 * Command engine for the Dev OS. Each command is a small pure-ish
 * function that talks to the terminal through `CommandAPI`. To add a
 * command later, drop another entry into `commands` — nothing else
 * needs to change.
 */
import { getNode, resolvePath, pathToString } from './fileSystem'

export type LineKind = 'input' | 'output' | 'error' | 'system'

export interface OutputLine {
  id: number
  kind: LineKind
  text: string
}

export interface CommandAPI {
  cwd: string[]
  setCwd: (segments: string[]) => void
  print: (text: string, kind?: LineKind) => void
  clear: () => void
  exit: () => void
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
        api.print(`  ${name.padEnd(8)} ${cmd.description}`)
      }
      api.print(`  ${'./<bin>'.padEnd(8)} run an executable in ~/projects`)
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

  exit: {
    description: 'leave the Dev OS, return to the GUI',
    run: (_args, api) => api.exit(),
  },

  gui: {
    description: 'leave the Dev OS, return to the GUI',
    run: (_args, api) => api.exit(),
  },
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
