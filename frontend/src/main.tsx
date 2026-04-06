import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
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
