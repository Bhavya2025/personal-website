import { useEffect, useRef, useState } from 'react'
import { useTerminal } from './terminalStore'
import { commandNames } from './commands'
import { getNode } from './fileSystem'
import { RUN_PROJECTS } from '../lib/missions'

/** A single rendered output line; input echoes get a green prompt prefix. */
function Line({ kind, text, href }: { kind: string; text: string; href?: string }) {
  if (href) {
    const mail = href.startsWith('mailto:')
    return (
      <div className="devos__line">
        <a
          className="devos__link"
          href={href}
          {...(mail ? {} : { target: '_blank', rel: 'noreferrer' })}
        >
          {text}
        </a>
      </div>
    )
  }
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
  const scrollRef = useRef<HTMLDivElement>(null)
  // True when the view is parked at (or near) the bottom. Only then do we
  // auto-scroll on new output — so wheeling UP to read history isn't yanked
  // back down on the next print.
  const atBottomRef = useRef(true)

  const focusInput = () => inputRef.current?.focus()

  // auto-focus on mount + whenever the window regains focus
  useEffect(() => {
    focusInput()
    window.addEventListener('focus', focusInput)
    return () => window.removeEventListener('focus', focusInput)
  }, [])

  // Track whether the user is parked at the bottom of the scrollback.
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    atBottomRef.current = distance < 24 // px tolerance
  }

  // Keep the latest output in view ONLY when already at the bottom; if the
  // user has scrolled up to read, leave their position untouched.
  useEffect(() => {
    const el = scrollRef.current
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight
  }, [lines])

  // Lenis (mounted app-wide via useSmoothScroll) hijacks the window wheel even
  // while the Dev OS is open, so the scrollback never moved. Handle the wheel
  // ourselves and stop it reaching Lenis, so the mouse wheel scrolls history.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1
      el.scrollTop += e.deltaY * unit
      e.preventDefault()
      e.stopPropagation()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

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

  /** Context-aware tab completion: commands, `run` projects, and paths. */
  const complete = () => {
    const parts = value.split(/\s+/)
    const token = parts[parts.length - 1] ?? ''
    const isFirstToken = parts.length === 1
    const firstCmd = parts[0] ?? ''

    const dir = getNode(cwd)
    const entries = dir && dir.type === 'dir' ? Object.entries(dir.children) : []
    const dirsOnly = entries.filter(([, c]) => c.type === 'dir').map(([n]) => n)
    const filesAndDirs = entries.map(([n]) => n)

    let pool: string[]
    if (isFirstToken) pool = commandNames
    else if (firstCmd === 'run') pool = [...Object.keys(RUN_PROJECTS), '*', 'all']
    else if (firstCmd === 'cd') pool = dirsOnly
    else if (firstCmd === 'cat' || firstCmd === 'ls') pool = filesAndDirs
    else return

    const matches = [...new Set(pool)].filter((n) => n.startsWith(token))
    if (!matches.length) return

    const prefix = value.slice(0, value.length - token.length)
    if (matches.length === 1) {
      const next = `${prefix}${matches[0]}`
      setValue(next)
      setCaret(next.length)
      return
    }

    // multiple matches: fill to the longest common prefix, then list them
    const lcp = matches.reduce((acc, m) => {
      let i = 0
      while (i < acc.length && i < m.length && acc[i] === m[i]) i++
      return acc.slice(0, i)
    })
    if (lcp.length > token.length) {
      const next = `${prefix}${lcp}`
      setValue(next)
      setCaret(next.length)
    }
    print(`${promptText}${value}`, 'input')
    print(matches.join('   '))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const v = value
      setValue('')
      setCaret(0)
      histIdx.current = null
      // Submitting a command always snaps the view back to the bottom,
      // even if the user had scrolled up to read history.
      atBottomRef.current = true
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
    <div className="devos__screen" onClick={focusInput}>
      <div className="devos__scroll" ref={scrollRef} onScroll={onScroll}>
        {lines.map((line) => (
          <Line key={line.id} kind={line.kind} text={line.text} href={line.href} />
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
    </div>
  )
}

export default Terminal
