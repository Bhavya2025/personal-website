import SkyCanvas from '../components/SkyCanvas'
import Footer from '../components/Footer'
import Hero from '../sections/Hero'
import Background from '../sections/Background'
import Skills from '../sections/Skills'
import Manifest from '../sections/Manifest'
import Achievements from '../sections/Achievements'
import Surface from '../sections/Surface'
import { usePageReveals } from '../hooks/usePageReveals'

/** The descent: space (top) → atmosphere → daylight landing (bottom). */
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
      <Footer />
    </main>
  )
}

export default Home
