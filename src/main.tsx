import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { initSentry } from './lib/sentry';
import App from './app/App';
import './index.css';

// Initialize Sentry BEFORE React renders (requires VITE_SENTRY_DSN in .env)
initSentry();

// Register service worker (PWA offline support).
// Dispatches custom events so the React useServiceWorker hook can react.
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event('sw:need-refresh'));
  },
  onOfflineReady() {
    window.dispatchEvent(new Event('sw:offline-ready'));
  },
  onRegisteredSW(_swUrl, registration) {
    // Periodically check for SW updates (every 60 minutes)
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
});

// Listen for update requests from the React UI (useServiceWorker hook)
window.addEventListener('sw:update', () => {
  updateSW(true);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
