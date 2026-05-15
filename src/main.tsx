import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { initSentry } from './lib/sentry';
import App from './app/App';
import { preloadCriticalAssets } from './shared/utils/assetPreloader';
import { registerDefaultActions } from './lib/ai/actions/registerDefaults';
import './index.css';

// Initialize Sentry BEFORE React renders (requires VITE_SENTRY_DSN in .env)
initSentry();

// Register all 17 action types in the ActionRegistry (Phase 1)
// Must run before React renders so the registry is available when Buddy chat opens.
registerDefaultActions();

// Register service worker (PWA offline support).
//
// v14.28 Stufe 1.5: vollautomatisches Auto-Update.
// Wenn ein neuer Build verfuegbar ist, wird er sofort aktiviert und der Tab
// einmalig reloaded — ohne User-Prompt. Hintergrund: PWA-Cache hielt frueher
// alte Versionen fest, weil der "Neue Version verfuegbar"-Toast haeufig
// uebersehen wurde und der alte SW so unbegrenzt lang weiter servierte.
//
// Workbox-Seite (vite.config.ts): skipWaiting=true + clientsClaim=true sorgen
// dafuer, dass der neue SW direkt installiert wird und alle Tabs uebernimmt.
// Hier (Client-Seite): updateSW(true) loest den Page-Reload aus, sobald ein
// neuer SW bereitsteht.
//
// Wer den frueheren Prompt zurueckhaben will: onNeedRefresh wieder durch
// window.dispatchEvent(new Event('sw:need-refresh')) ersetzen — PWAUpdatePrompt
// und useServiceWorker bleiben im Code als Fallback erhalten.
const updateSW = registerSW({
  onNeedRefresh() {
    // Bei neuem Build: sofort SW aktivieren + Page reloaden.
    // updateSW(true) ruft skipWaiting + reload automatisch auf.
    updateSW(true);
  },
  onOfflineReady() {
    window.dispatchEvent(new Event('sw:offline-ready'));
  },
  onRegisteredSW(_swUrl, registration) {
    // Update-Check-Intervall: 10 Minuten (vorher 60 min).
    // Mit Auto-Reload bekommt der Nutzer einen frischen Build innerhalb dieser
    // Zeit, ohne dass er manuell reloaden muss.
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 10 * 60 * 1000);
    }
  },
});

// Fallback: useServiceWorker-Hook + PWAUpdatePrompt bleiben funktional, falls
// onNeedRefresh wieder auf "Prompt"-Strategie umgestellt wird.
window.addEventListener('sw:update', () => {
  updateSW(true);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Preload critical assets (preconnect, dns-prefetch) after initial render.
// Deferred so it does not block the first paint.
if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(preloadCriticalAssets);
} else {
  setTimeout(preloadCriticalAssets, 1);
}
