import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ensureLocationsLoaded } from './utils/locationCache'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// kick off location preload so the app has names available as early as possible
; (async () => { try { await ensureLocationsLoaded() } catch (e) { /* ignore preload errors */ } })()
