import { useEffect, useRef, useState } from 'react'
import { useTerminal } from './terminalStore'
import { commandNames } from './commands'
import { getNode } from './fileSystem'

/** A single rendered output line; input echoes get a green prompt prefix. */
function Line({ kind, text }: { kind: string; text: string }) {
  if (kind === 'input') {
    const split = text.indexOf('$ ')
    if (split !== -1) {
      return (
        <div className="devos__line">
          <span className="devos__prompt">{text.slice(0, split + 2)}</span>
          {text.slice(split + 2)}
        </div>
      )
    }
  }
  const cls =
    kind === 'error'
      ? 'devos__line devos__line--error'
      : kind === 'system'
        ? 'devos__line devos__line--system'
        : 'devos__line'
  return <div className={cls}>{text || ' '}</div>
}

function Terminal() {
  const { lines, run, print, promptText, cwd, history } = useTerminal()
  const [value, setValue] = useState('')
  const [caret, setCaret] = useState(0)
  const histIdx = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)

  const focusInput = () => inputRef.current?.focus()

  // auto-focus on mount + whenever the window regains focus
  useEffect(() => {
    focusInput()
    window.addEventListener('focus', focusInput)
    return () => window.removeEventListener('focus', focusInput)
  }, [])

  // keep the latest output in view
  useEffect(() => {
    const el = screenRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const syncCaret = () => setCaret(inputRef.current?.selectionStart ?? value.length)

  const navHistory = (dir: -1 | 1) => {
    if (!history.length) return
    let idx = histIdx.current ?? history.length
    idx += dir
    if (idx < 0) idx = 0
    if (idx >= history.length) {
      histIdx.current = null
      setValue('')
      setCaret(0)
      return
    }
    histIdx.current = idx
    const v = history[idx] ?? ''
    setValue(v)
    setCaret(v.length)
  }

  const complete = () => {
    const token = value.split(/\s+/).pop() ?? ''
    if (!token) return
    const bare = token.startsWith('./') ? token.slice(2) : token
    const isFirstToken = value.trimStart() === token
    const dir = getNode(cwd)
    const entries = dir && dir.type === 'dir' ? Object.keys(dir.children) : []
    const pool = isFirstToken ? [...commandNames, ...entries] : entries
    const matches = [...new Set(pool)].filter((n) => n.startsWith(bare))

    if (matches.length === 1) {
      const completed = matches[0] ?? bare
      const prefix = value.slice(0, value.length - token.length)
      const lead = token.startsWith('./') ? './' : ''
      const next = `${prefix}${lead}${completed}`
      setValue(next)
      setCaret(next.length)
    } else if (matches.length > 1) {
      print(`${promptText}${value}`, 'input')
      print(matches.join('   '))
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const v = value
      setValue('')
      setCaret(0)
      histIdx.current = null
      run(v)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      navHistory(-1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      navHistory(1)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      complete()
    } else {
      // let the value update, then mirror the caret position
      window.setTimeout(syncCaret, 0)
    }
  }

  const before = value.slice(0, caret)
  const atCursor = value.slice(caret, caret + 1) || ' '
  const after = value.slice(caret + 1)

  return (
    <div className="devos__screen" ref={screenRef} onClick={focusInput}>
      {lines.map((line) => (
        <Line key={line.id} kind={line.kind} text={line.text} />
      ))}

      <div className="devos__inputline">
        <span className="devos__prompt">{promptText}</span>
        <span>{before}</span>
        <span className="devos__cursor">{atCursor}</span>
        <span>{after}</span>
        <input
          ref={inputRef}
          className="devos__input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setCaret(e.target.selectionStart ?? e.target.value.length)
          }}
          onKeyDown={onKeyDown}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Terminal input"
        />
      </div>
    </div>
  )
}

export default Terminal
