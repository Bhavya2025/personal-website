/**
 * TEMPORARY — background DEV MENU.
 *
 * Lists every background variant grouped by AUTHOR (which agent / Claude made
 * it), switches the active one live (via bgStore, localStorage-persisted), and
 * can be hidden to preview the site from a real user's POV. Press "d" to
 * toggle the menu, "b" to toggle the black-hole easter egg (both ignored while
 * typing in a field).
 *
 * REMOVE WHEN A BACKGROUND IS CHOSEN: delete this file, BgSwitcher.css,
 * bgStore.ts, bgVariants.ts, useBgCanvas.ts, src/lab1, src/lab2, src/components/bg,
 * and inline the chosen painter into SkyCanvas / TransitSky.
 */

import { useEffect, useRef, useState } from 'react'
import './BgSwitcher.css'
import {
  BG_VARIANTS,
  bgStore,
  setBgVariant,
  subscribeBgVariant,
  domHoleStore,
  setDomHole,
  subscribeDomHole,
  type BgVariant,
  type BgVariantInfo,
} from './bgStore'

// group variants by author, preserving first-seen order
const GROUPS: { author: string; items: BgVariantInfo[] }[] = (() => {
  const order: string[] = []
  const map = new Map<string, BgVariantInfo[]>()
  for (const v of BG_VARIANTS) {
    let bucket = map.get(v.author)
    if (!bucket) {
      bucket = []
      map.set(v.author, bucket)
      order.push(v.author)
    }
    bucket.push(v)
  }
  return order.map((author) => ({ author, items: map.get(author)! }))
})()

const HIDE_KEY = 'bk-bg-devhidden'

function BgSwitcher() {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<BgVariant>(bgStore.current)
  const [holeOn, setHoleOn] = useState<boolean>(domHoleStore.current)
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HIDE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => subscribeBgVariant(setActive), [])
  useEffect(() => subscribeDomHole(setHoleOn), [])

  const setHide = (v: boolean) => {
    setHidden(v)
    try {
      localStorage.setItem(HIDE_KEY, v ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  // "d" toggles the dev menu — but not while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'd' && e.key !== 'D') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = document.activeElement as HTMLElement | null
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (typing) return
      e.preventDefault()
      setHidden((h) => {
        const nv = !h
        try {
          localStorage.setItem(HIDE_KEY, nv ? '1' : '0')
        } catch {
          /* ignore */
        }
        return nv
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Keep the wheel INSIDE the menu: when the cursor is over the panel, scroll
  // the variant list locally and never the page. We disable Lenis for these
  // events (data-lenis-prevent) AND block native page-scroll over the header/
  // footer and at the list's scroll limits. When the menu is hidden the panel
  // unmounts, so the page scrolls normally again.
  useEffect(() => {
    const root = rootRef.current
    if (hidden || !root) return
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation() // keep it from reaching Lenis' window listener
      const sc = scrollRef.current
      if (!sc || !sc.contains(e.target as Node)) {
        e.preventDefault() // over header/footer/padding → freeze the page
        return
      }
      const atTop = sc.scrollTop <= 0 && e.deltaY < 0
      const atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1 && e.deltaY > 0
      if (atTop || atBottom) e.preventDefault() // contain overscroll
      // otherwise let the list scroll natively
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => root.removeEventListener('wheel', onWheel)
  }, [hidden])

  if (hidden) return null

  const current = BG_VARIANTS.find((b) => b.id === active)

  return (
    <div className="bgsw" role="group" aria-label="Background dev menu" ref={rootRef} data-lenis-prevent>
      <div className="bgsw__head">
        <span>DEV · BACKGROUNDS</span>
        <button type="button" className="bgsw__hide" onClick={() => setHide(true)}>
          hide · d
        </button>
      </div>

      <div className="bgsw__scroll" ref={scrollRef}>
        {GROUPS.map((g) => (
          <div className="bgsw__group" key={g.author}>
            <div className="bgsw__author">{g.author}</div>
            <div className="bgsw__row">
              {g.items.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="bgsw__btn"
                  aria-pressed={b.id === active}
                  title={b.blurb}
                  onClick={() => setBgVariant(b.id)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="bgsw__toggle"
        aria-pressed={holeOn}
        onClick={() => setDomHole(!holeOn)}
        title="Cursor black hole — warps & swallows page elements (non-destructive)"
      >
        <span>🕳 BLACK HOLE · b</span>
        <span className="bgsw__toggle-state">{holeOn ? 'ON' : 'OFF'}</span>
      </button>

      {current ? (
        <div className="bgsw__blurb">
          <b>{current.label}</b> — {current.blurb}
        </div>
      ) : null}
    </div>
  )
}

export default BgSwitcher
