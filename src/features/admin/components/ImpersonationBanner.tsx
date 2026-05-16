/**
 * ImpersonationBanner — Sticky-Bar oben wenn Admin als anderer User eingeloggt ist (PH5).
 *
 * Sichtbar in der gesamten App (in App.tsx global gemountet). Zeigt:
 *   - "Du siehst als <target-email>" (von Admin <admin-email>)
 *   - "Beenden"-Button -> signOut + redirect /login
 *
 * Design: kraeftiges Rot/Warn-Farbe damit niemand vergisst dass er impersoniert.
 * Sticky top, drueckt App-Inhalt nach unten.
 */

import { useEffect, useState } from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { getImpersonationState, useImpersonate } from '../hooks/useImpersonate';

export function ImpersonationBanner() {
  const [state, setState] = useState(getImpersonationState());
  const { endImpersonation, loading } = useImpersonate();

  // Re-poll sessionStorage on focus changes — covers tab-back / Banner re-mount
  useEffect(() => {
    const refresh = () => setState(getImpersonationState());
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (!state.active) return null;

  return (
    <div
      role="alert"
      data-no-print
      className="sticky top-0 left-0 right-0 z-[100] bg-red-600 text-white shadow-lg"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <ShieldAlert className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold">Impersonation aktiv:</span>{' '}
          <span className="opacity-95">
            Du siehst als <strong>{state.targetEmail}</strong>
            {state.adminEmail && (
              <>
                {' '}
                <span className="opacity-75">(als {state.adminEmail})</span>
              </>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={endImpersonation}
          disabled={loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-red-700 hover:bg-red-50 disabled:opacity-60 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          {loading ? 'Beende...' : 'Beenden'}
        </button>
      </div>
    </div>
  );
}
