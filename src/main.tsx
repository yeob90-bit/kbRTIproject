import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AuthenticatedApp from './pages/AuthenticatedApp.tsx'
import ShowcasePage from './pages/ShowcasePage.tsx'

const normalizedPath =
  window.location.pathname.replace(/\/+$/, '') || '/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {normalizedPath === '/showcase' ? <ShowcasePage /> : <AuthenticatedApp />}
  </StrictMode>,
)
