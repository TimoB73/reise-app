import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { LocationProvider } from './context/LocationContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <LocationProvider>
        <App />
      </LocationProvider>
    </HashRouter>
  </StrictMode>,
)
