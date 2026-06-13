import { useRef, useState, type ReactNode } from 'react'
import {
  commands,
  execute,
  type CommandAPI,
  type LineKind,
  type OutputLine,
} from './commands'
import { pathToString } from './fileSystem'
import { TerminalCtx, type TerminalState } from './terminalStore'

const WELCOME: OutputLine[] = [
  { id: 0, kind: 'system', text: '██████╗ ██╗  ██╗    ██████╗ ███████╗' },
  { id: 1, kind: 'system', text: '██╔══██╗██║ ██╔╝   ██╔═══██╗██╔════╝' },
  { id: 2, kind: 'system', text: '██████╔╝█████╔╝    ██║   ██║███████╗' },
  { id: 3, kind: 'system', text: '██╔══██╗██╔═██╗    ██║   ██║╚════██║' },
  { id: 4, kind: 'system', text: '██████╔╝██║  ██╗   ╚██████╔╝███████║' },
  { id: 5, kind: 'system', text: '╚═════╝ ╚═╝  ╚═╝    ╚═════╝ ╚══════╝' },
  { id: 6, kind: 'output', text: '' },
  { id: 7, kind: 'output', text: 'bhavyaOS 1.0.0  ·  guest shell  ·  you are SSH-d into my brain.' },
  { id: 8, kind: 'system', text: "type 'help' for commands, 'ls' to look around, 'exit' to leave." },
  { id: 9, kind: 'output', text: '' },
]

export function TerminalProvider({
  onExit,
  children,
}: {
  onExit: () => void
  children: ReactNode
}) {
  const [lines, setLines] = useState<OutputLine[]>(WELCOME)
  const [cwd, setCwd] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const idRef = useRef<number>(WELCOME.length)

  const print = (text: string, kind: LineKind = 'output') =>
    setLines((prev) => [...prev, { id: idRef.current++, kind, text }])

  const clear = () => setLines([])

  const promptText = `guest@bhavya:${pathToString(cwd)}$ `

  const run = (raw: string) => {
    const input = raw
    const trimmed = input.trim()
    // echo the command back, prompt and all
    setLines((prev) => [
      ...prev,
      { id: idRef.current++, kind: 'input', text: `${promptText}${input}` },
    ])
    if (!trimmed) return
    setHistory((h) => [...h, trimmed])

    const tokens = trimmed.split(/\s+/)
    const cmd = tokens[0] ?? ''
    const args = tokens.slice(1)

    const api: CommandAPI = {
      cwd,
      setCwd,
      print,
      clear,
      exit: onExit,
      history,
    }

    if (cmd.startsWith('./')) {
      execute(cmd.slice(2), api)
      return
    }
    const command = commands[cmd]
    if (!command) {
      print(`bash: ${cmd}: command not found`, 'error')
      return
    }
    command.run(args, api)
  }

  const value: TerminalState = { lines, cwd, history, promptText, run, print }
  return <TerminalCtx.Provider value={value}>{children}</TerminalCtx.Provider>
}
