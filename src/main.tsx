import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { missing } from './i18n'

// lets a developer list untranslated texts from the browser console
if (import.meta.env.DEV) Object.assign(window, { __missing: missing })

// Offline copy of the app. Only in the built app, so it never gets in the way while developing.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
