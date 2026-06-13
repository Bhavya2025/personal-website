import { createContext, useContext } from 'react'
import type { LineKind, OutputLine } from './commands'

export interface TerminalState {
  lines: OutputLine[]
  cwd: string[]
  history: string[]
  promptText: string
  run: (input: string) => void
  print: (text: string, kind?: LineKind) => void
}

export const TerminalCtx = createContext<TerminalState | null>(null)

export function useTerminal(): TerminalState {
  const ctx = useContext(TerminalCtx)
  if (!ctx) throw new Error('useTerminal must be used inside <TerminalProvider>')
  return ctx
}
