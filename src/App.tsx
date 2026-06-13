import { Routes, Route } from 'react-router-dom'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useMagnetic } from './hooks/useMagnetic'
import { TransitionProvider } from './components/TransitionLayer'
import Hud from './components/Hud'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Contact from './pages/Contact'
import './App.css'

function App() {
  useSmoothScroll()
  useMagnetic()

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
