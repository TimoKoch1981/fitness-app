import * as Sentry from '@sentry/react';

/**
 * Initializes Sentry error monitoring.
 *
 * Reads VITE_SENTRY_DSN from environment variables (embedded at build time by Vite).
 * If DSN is not set, Sentry is gracefully skipped — no errors, no side effects.
 *
 * Must be called BEFORE ReactDOM.createRoot() in main.tsx.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.info(
      '[FitBuddy] VITE_SENTRY_DSN is not set. Sentry error monitoring is disabled. ' +
      'Set it in .env.local or .env.production to enable.'
    );
    return;
  }

  const isProduction = import.meta.env.PROD;

  Sentry.init({
    dsn,
    environment: isProduction ? 'production' : 'development',
    release: `fitbuddy@${import.meta.env.VITE_APP_VERSION || '0.1.0'}`,
    tracesSampleRate: 0.1,
    // Only send errors in production by default; in dev, send all for debugging
    enabled: true,
    // Avoid sending PII (DSGVO compliance)
    sendDefaultPii: false,
  });
}
