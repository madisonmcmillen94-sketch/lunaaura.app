import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.tsx'

// Analytics and Speed Insights are cookie-less and collect no personal data,
// which matters for an app people use to journal about their nervous system.
// Both also need switching on in the Vercel dashboard before they record
// anything -- the components alone are inert.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>,
)
