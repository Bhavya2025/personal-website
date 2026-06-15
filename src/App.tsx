import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useMagnetic } from './hooks/useMagnetic'
import { TransitionProvider } from './components/TransitionLayer'
import { DevOSNavCtx } from './devos/devosNav'
import { summonDevOS } from './devos/summonTransition'
import { RUN_PROJECTS } from './lib/missions'
import Hud from './components/Hud'
// TEMPORARY — background-variant preview switcher (remove with bgStore/bgVariants).
import BgSwitcher from './components/BgSwitcher'
import DomBlackhole from './components/DomBlackhole'
import { domHoleStore, setDomHole, subscribeDomHole } from './components/bgStore'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Contact from './pages/Contact'
import './App.css'

// The Dev OS only loads when summoned — keeps it out of the main bundle.
const DevOS = lazy(() => import('./devos/DevOS'))

function App() {
  useSmoothScroll()
  useMagnetic()

  const [isDevMode, setDevMode] = useState(false)
  // TEMPORARY — DOM black-hole easter egg, toggled from the dev menu.
  const [domHole, setDomHoleState] = useState(domHoleStore.current)
  useEffect(() => subscribeDomHole(setDomHoleState), [])
  const devModeRef = useRef(false)
  useEffect(() => {
    devModeRef.current = isDevMode
  }, [isDevMode])

  // Opening pushes a history entry so the browser Back button (and the
  // `exit` command) close the terminal and return to the site — instead
  // of the Back button leaving the site entirely.
  const openDevOS = useCallback(() => {
    window.history.pushState({ devos: true }, '')
    setDevMode(true)
  }, [])
  const closeDevOS = useCallback(() => {
    if (window.history.state?.devos) window.history.back()
    else setDevMode(false)
  }, [])

  // The hero pfp summons the OS via the cinematic scan→CRT transition; the
  // overlay lives outside React (it survives this component unmounting).
  const devosNav = useMemo(
    () => ({ summon: (img: HTMLImageElement | null) => summonDevOS(img, openDevOS) }),
    [openDevOS],
  )

  // `run <project>` in the terminal: open that project's card on the GUI
  // projects page in a NEW TAB — the OS stays open in this tab. Projects
  // reads the ?focus=ID query param to scroll to + pulse the card.
  const goToProject = useCallback((alias: string) => {
    const id = RUN_PROJECTS[alias]
    const url = id ? `/projects?focus=${id}` : '/projects'
    window.open(url, '_blank', 'noopener')
  }, [])

  // Back button → pop the pushed entry → close the terminal, stay on site.
  useEffect(() => {
    const onPop = () => {
      if (devModeRef.current) setDevMode(false)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // "b" toggles the DOM black-hole easter egg (dev shortcut; alongside the dev
  // menu button). Ignored in the terminal or while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'b' && e.key !== 'B') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (devModeRef.current) return
      const el = document.activeElement as HTMLElement | null
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (typing) return
      e.preventDefault()
      setDomHole(!domHoleStore.current)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Secret trigger: Ctrl/Cmd + ` (or \) toggles the Dev OS; a bare
  // backtick opens it from the portfolio when nothing is being typed.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === '\\')) {
        e.preventDefault()
        if (devModeRef.current) closeDevOS()
        else openDevOS()
        return
      }
      if (!devModeRef.current && e.key === '`') {
        const el = document.activeElement as HTMLElement | null
        const typing =
          !!el &&
          (el.tagName === 'INPUT' ||
            el.tagName === 'TEXTAREA' ||
            el.isContentEditable)
        if (!typing) {
          e.preventDefault()
          openDevOS()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openDevOS, closeDevOS])

  // When the Dev OS is up, the whole portfolio GUI is unmounted.
  if (isDevMode) {
    return (
      <Suspense
        fallback={
          <div
            style={{ position: 'fixed', inset: 0, background: '#030303', zIndex: 9999 }}
          />
        }
      >
        <DevOS onExit={closeDevOS} onProject={goToProject} />
      </Suspense>
    )
  }

  return (
    <DevOSNavCtx.Provider value={devosNav}>
      <TransitionProvider>
        <div className="grain" aria-hidden="true" />
        <Hud />
        {/* TEMPORARY — dev menu to preview/pick a background; remove when chosen. */}
        <BgSwitcher />
        {/* TEMPORARY — cursor black-hole easter egg, toggled from the dev menu. */}
        <DomBlackhole active={domHole} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </TransitionProvider>
    </DevOSNavCtx.Provider>
  )
}

export default App
