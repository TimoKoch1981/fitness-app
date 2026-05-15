/**
 * ForgotPasswordPage — Sends a password-reset email via Supabase Auth.
 *
 * v14.22: Klarer UX nach Submit (Spam-Hinweis, eingegebene Adresse zeigen,
 * Resend-Button mit Cooldown) und konsequente i18n. Der frühere Pfad zeigte
 * nur "wurde gesendet" ohne Anweisung — Nutzer dachte, nichts passiert,
 * weil die Mail in Spam landete oder das Frontend den Recovery-Token nicht
 * weiterverarbeitete (siehe v14.22 für den eigentlichen Reset-Bug).
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Info, RotateCw } from 'lucide-react';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation } from '../i18n';
import { localizeAuthError } from '../lib/auth/localizeAuthError';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t, language } = useTranslation();
  const isDE = language === 'de';
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Tick down cooldown counter every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submitReset = async (targetEmail: string) => {
    setError('');
    setSubmitting(true);

    const { error: resetErr } = await resetPassword(targetEmail);
    if (resetErr) {
      const localized = localizeAuthError(resetErr.message ?? String(resetErr), language);
      setError(localized.message);
      if (localized.cooldownSec) setCooldown(localized.cooldownSec);
    } else {
      setSentTo(targetEmail);
      // Even on success, GoTrue enforces 60 s between requests — prevent spam.
      setCooldown(60);
    }
    setSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || submitting) return;
    submitReset(email);
  };

  const handleResend = () => {
    if (cooldown > 0 || submitting || !sentTo) return;
    submitReset(sentTo);
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-theme-surface rounded-theme-lg border border-theme-line p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme-ink">{t.auth.resetPassword}</h2>

          {sentTo ? (
            // v14.22: Reichere Success-UX. Vorher nur ein gruener Banner —
            // Nutzer wusste nicht, was zu tun ist, wenn keine Mail kommt.
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-theme-md flex gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {isDE ? 'E-Mail verschickt' : 'Email sent'}
                  </p>
                  <p className="text-xs mt-1 text-green-600">
                    {isDE
                      ? <>An <strong>{sentTo}</strong>. Folge dem Link in der Mail, um ein neues Passwort zu setzen.</>
                      : <>To <strong>{sentTo}</strong>. Follow the link in the email to set a new password.</>}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded-theme-md flex gap-2">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  {isDE
                    ? 'Keine Mail? Schau im Spam-Ordner oder warte 1–2 Minuten — die Zustellung kann kurz dauern. Absender: noreply@fudda.de.'
                    : 'No email? Check your spam folder, or wait 1–2 minutes — delivery can be brief. Sender: noreply@fudda.de.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-theme-surface border border-theme-primary text-theme-primary font-medium rounded-theme-md hover:bg-theme-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <RotateCw className="h-4 w-4" />
                {submitting
                  ? t.common.loading
                  : cooldown > 0
                    ? (isDE ? `Erneut senden (${cooldown}s)` : `Resend (${cooldown}s)`)
                    : (isDE ? 'Erneut senden' : 'Resend')}
              </button>

              <button
                type="button"
                onClick={() => { setSentTo(null); setEmail(''); }}
                className="w-full text-xs text-theme-ink-2 hover:text-theme-ink underline"
              >
                {isDE ? 'Andere E-Mail verwenden' : 'Use a different email'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-theme-ink-2">
                {isDE
                  ? 'Trag deine E-Mail ein — wir schicken dir einen Link zum Zurücksetzen.'
                  : 'Enter your email — we will send you a reset link.'}
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-theme-md" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-theme-ink mb-1">
                  {t.auth.email}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-surface border border-theme-line rounded-theme-md focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none transition-colors"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting || cooldown > 0}
                className="w-full py-2.5 bg-theme-primary text-theme-primary-on font-medium rounded-theme-md hover:bg-theme-primary-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting
                  ? t.common.loading
                  : cooldown > 0
                    ? (isDE ? `Bitte warten (${cooldown}s)` : `Please wait (${cooldown}s)`)
                    : t.auth.resetPassword}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-theme-ink-2 pt-2 border-t border-theme-line">
            <Link to="/login" className="text-theme-primary hover:underline">
              {t.common.back}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
