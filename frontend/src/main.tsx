import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Import local fonts (No CDN)
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './i18n' // Add i18n initialization
import App from './App'
import { registerSW } from 'virtual:pwa-register'

// Register PWA service worker for "Add to Home Screen" support
registerSW({ immediate: true })

window.onerror = (msg, url, line) => {
  console.error('FRONTEND ERROR:', msg, 'at', url, ':', line);
  const root = document.getElementById('root');
  if (root) root.innerHTML = `<div style="padding:20px;color:red;"><h1>FRONTEND CRASH</h1><pre>${msg}</pre></div>`;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
