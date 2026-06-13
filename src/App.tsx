import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useMagnetic } from './hooks/useMagnetic'
import { TransitionProvider } from './components/TransitionLayer'
import Hud from './components/Hud'
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
  const devModeRef = useRef(false)
  useEffect(() => {
    devModeRef.current = isDevMode
  }, [isDevMode])

  // Secret trigger: Ctrl/Cmd + ` (or \) toggles the Dev OS; a bare
  // backtick opens it from the portfolio when nothing is being typed.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === '\\')) {
        e.preventDefault()
        setDevMode((v) => !v)
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
          setDevMode(true)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
        <DevOS onExit={() => setDevMode(false)} />
      </Suspense>
    )
  }

  return (
    <TransitionProvider>
      <div className="grain" aria-hidden="true" />
      <Hud />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </TransitionProvider>
  )
}

export default App
