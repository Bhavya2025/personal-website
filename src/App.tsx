import { Route, Routes } from 'react-router-dom'
import { ContactPage, HomePage, NotFoundPage, ProjectPage, ProjectsPage, SiteLayout } from './portfolio/Portfolio'

export default function App() {
  return (
    <SiteLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteLayout>
  )
}
