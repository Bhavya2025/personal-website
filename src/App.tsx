import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ContactPage, HomePage, NotFoundPage, ProjectPage, SiteLayout } from './portfolio/Portfolio'

function ProjectIndexRedirect() {
  const focus = new URLSearchParams(useLocation().search).get('focus')
  const destination = focus === 'BK-001' ? '/projects/taskly' : focus === 'BK-103' ? '/#project-wyag' : '/#projects'
  return <Navigate to={destination} replace />
}

export default function App() {
  return <SiteLayout><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/projects" element={<ProjectIndexRedirect />} />
    <Route path="/projects/wyag" element={<Navigate to="/#project-wyag" replace />} />
    <Route path="/projects/:slug" element={<ProjectPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></SiteLayout>
}
