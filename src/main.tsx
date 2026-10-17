import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import './index.css'
import App from './App.tsx'

// A small hello for anyone who opens the console.
console.log(
  '%cThanks for looking under the hood.\n%cBuilt by Bhavya Kumar · b2kumar@uwaterloo.ca',
  'color: #2455a3; font-family: monospace; font-size: 13px; font-weight: bold;',
  'color: #666; font-family: monospace; font-size: 12px;',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
