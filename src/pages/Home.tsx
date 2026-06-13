import SkyCanvas from '../components/SkyCanvas'
import Hero from '../sections/Hero'
import Background from '../sections/Background'
import Skills from '../sections/Skills'
import Manifest from '../sections/Manifest'
import Achievements from '../sections/Achievements'
import Surface from '../sections/Surface'
import { usePageReveals } from '../hooks/usePageReveals'

/** The descent: space (top) → atmosphere → daylight surface + contact (bottom). */
function Home() {
  usePageReveals()
  return (
    <main>
      <SkyCanvas />
      <Hero />
      <Background />
      <Skills />
      <Manifest brief />
      <Achievements />
      <Surface />
    </main>
  )
}

export default Home
