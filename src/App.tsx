import { Navigate, Route, Routes } from 'react-router-dom'
import { ContactPage, HomePage, NotFoundPage, ProjectPage, SiteLayout } from './portfolio/Portfolio'

export default function App() {
  return (
    <SiteLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<Navigate to="/projects/taskly" replace />} />
        <Route path="/projects/:slug" element={<ProjectPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteLayout>
  )
}
