/**
 * ErrorBoundary — Global error boundary with Sentry integration.
 *
 * Wraps the entire app to catch unhandled React errors.
 * - If Sentry is initialized (VITE_SENTRY_DSN set): reports errors to Sentry.
 * - If Sentry is NOT initialized: still catches errors and shows fallback UI.
 *
 * Fallback UI is in German (app default language).
 */

import * as Sentry from '@sentry/react';
import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

function ErrorFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f9fafb',
        color: '#1f2937',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '28rem',
          width: '100%',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>!</div>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        >
          Etwas ist schiefgelaufen
        </h1>
        <p
          style={{
            color: '#6b7280',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
          }}
        >
          Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#0d9488',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Seite neu laden
        </button>
      </div>
    </div>
  );
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error) => {
        // Sentry.captureException is called automatically by Sentry.ErrorBoundary
        // when Sentry is initialized. This onError handler logs to console as backup.
        console.error('[FitBuddy] Uncaught error:', error);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
