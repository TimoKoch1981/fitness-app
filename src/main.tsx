import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initSentry } from './lib/sentry';
import App from './app/App';
import './index.css';

// Initialize Sentry BEFORE React renders (requires VITE_SENTRY_DSN in .env)
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
