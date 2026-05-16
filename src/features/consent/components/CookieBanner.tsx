/**
 * CookieBanner — DSGVO-konformer Cookie-Consent.
 *
 * Strategie: Wir nutzen NUR Auth-Cookies (essentiell) + localStorage.
 * Keine Tracking-Cookies, kein Analytics ohne Consent. Damit ist der Banner
 * eher Informativ + Acknowledge, nicht ein 200-Vendor-Auswahl-Dialog.
 *
 * Akzeptanz wird in localStorage UND (optional) DB gespeichert.
 */

import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import { useTranslation } from '../../../i18n';

const CONSENT_KEY = 'fitbuddy_cookie_consent_v1';
const CONSENT_VERSION = '1.0';

interface ConsentStored {
  version: string;
  accepted_at: string;
  essential: true;   // immer true
  analytics: boolean;
  marketing: boolean; // wir nutzen aktuell nichts davon, aber Schema-Future-Proof
}

function readConsent(): ConsentStored | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeConsent(consent: ConsentStored): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch { /* private mode */ }
}

export function CookieBanner() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    if (!stored || stored.version !== CONSENT_VERSION) setVisible(true);
  }, []);

  const handleAcceptAll = () => {
    writeConsent({
      version: CONSENT_VERSION,
      accepted_at: new Date().toISOString(),
      essential: true,
      analytics: true,
      marketing: false,
    });
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    writeConsent({
      version: CONSENT_VERSION,
      accepted_at: new Date().toISOString(),
      essential: true,
      analytics: false,
      marketing: false,
    });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      className="fixed bottom-0 left-0 right-0 z-[60] mx-auto max-w-3xl p-4 m-3 rounded-theme-lg bg-theme-surface border border-theme-line shadow-lg"
    >
      <div className="flex items-start gap-3">
        <Cookie className="h-5 w-5 text-theme-primary flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <h2 id="cookie-banner-title" className="font-semibold text-sm text-theme-ink mb-1">
            {isDE ? 'Cookies & Datenschutz' : 'Cookies & Privacy'}
          </h2>
          <p className="text-xs text-theme-ink-2 mb-2">
            {isDE
              ? 'FitBuddy nutzt essentielle Cookies fuer Login und Session. Optional koennen wir anonyme Telemetrie sammeln, um Bugs zu fixen.'
              : 'FitBuddy uses essential cookies for login and session. Optionally we can collect anonymous telemetry to fix bugs.'}
          </p>

          {showDetails && (
            <ul className="text-xs text-theme-ink-3 mb-3 space-y-1">
              <li>
                <strong>{isDE ? 'Essentiell' : 'Essential'}</strong>:{' '}
                {isDE
                  ? 'Auth-Cookies fuer Login (Supabase). Kein Tracking. Kein Opt-out moeglich.'
                  : 'Auth cookies for login (Supabase). No tracking. No opt-out.'}
              </li>
              <li>
                <strong>{isDE ? 'Telemetrie' : 'Telemetry'}</strong>:{' '}
                {isDE
                  ? 'Anonyme Aktions-Logs (Latenzen, Fehler) zur App-Verbesserung. Keine Inhalte (z.B. Mahlzeit-Namen).'
                  : 'Anonymous action logs (latencies, errors) for app improvement. No content (e.g. meal names).'}
              </li>
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-3 py-1.5 text-xs font-medium rounded-theme-md bg-theme-primary text-theme-primary-on hover:bg-theme-primary-2"
            >
              {isDE ? 'Alle akzeptieren' : 'Accept all'}
            </button>
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="px-3 py-1.5 text-xs font-medium rounded-theme-md border border-theme-line text-theme-ink hover:bg-theme-surface-2"
            >
              {isDE ? 'Nur essentielle' : 'Essential only'}
            </button>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1.5 text-xs underline text-theme-ink-2 hover:text-theme-primary"
            >
              {showDetails
                ? (isDE ? 'Weniger' : 'Less')
                : (isDE ? 'Mehr Infos' : 'More info')}
            </button>
            <a
              href="/datenschutz"
              className="px-3 py-1.5 text-xs underline text-theme-ink-2 hover:text-theme-primary"
            >
              {isDE ? 'Datenschutz' : 'Privacy'}
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={handleEssentialOnly}
          aria-label={isDE ? 'Schliessen (essentiell only)' : 'Close (essential only)'}
          className="p-1 rounded text-theme-ink-3 hover:bg-theme-surface-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Helper: aktuellen Consent-Status fuer andere Module abfragen. */
export function getCookieConsent() {
  return readConsent();
}

export function hasAnalyticsConsent(): boolean {
  const c = readConsent();
  return c?.analytics === true;
}
