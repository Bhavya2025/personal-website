import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/archivo-black/400.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import './theme/space.css'
import './index.css'
import './devos/boot.css'
import App from './App.tsx'

// A small hello for anyone who opens the console.
console.log(
  '%cThanks for looking under the hood.\n%cBuilt by Bhavya Kumar — b2kumar@uwaterloo.ca',
  'color: #ffb000; font-family: monospace; font-size: 13px; font-weight: bold;',
  'color: #9b968a; font-family: monospace; font-size: 12px;',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
