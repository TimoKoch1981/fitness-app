import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation } from '../i18n';

/**
 * Localize GoTrue / Supabase error messages to German.
 * Supabase returns errors in English regardless of request language.
 */
function localizeAuthError(raw: string, language: string): { message: string; cooldownSec?: number } {
  const isDE = language === 'de';

  // Rate limit: "For security purposes, you can only request this after NN seconds."
  const rateLimitMatch = raw.match(/after\s+(\d+)\s+seconds?/i);
  if (rateLimitMatch) {
    const sec = parseInt(rateLimitMatch[1], 10);
    return {
      message: isDE
        ? `Aus Sicherheitsgruenden kannst du erst in ${sec} Sekunden einen neuen Reset anfordern.`
        : `For security reasons, you can request a new reset in ${sec} seconds.`,
      cooldownSec: sec,
    };
  }

  // Generic rate limit
  if (/rate\s*limit|too\s*many/i.test(raw)) {
    return {
      message: isDE
        ? 'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.'
        : 'Too many requests. Please wait a moment and try again.',
      cooldownSec: 60,
    };
  }

  // Invalid email
  if (/invalid.*email|email.*invalid/i.test(raw)) {
    return { message: isDE ? 'Ungueltige E-Mail-Adresse.' : 'Invalid email address.' };
  }

  // User not found (GoTrue returns success for non-existent emails by design, but just in case)
  if (/user.*not.*found|not\s*registered/i.test(raw)) {
    return {
      message: isDE
        ? 'Falls diese E-Mail registriert ist, haben wir einen Link gesendet.'
        : 'If this email is registered, we have sent a link.',
    };
  }

  // Fallback: return raw
  return { message: raw };
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t, language } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Tick down cooldown counter every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || submitting) return;
    setError('');
    setSubmitting(true);

    const { error: resetErr } = await resetPassword(email);
    if (resetErr) {
      const localized = localizeAuthError(resetErr.message ?? String(resetErr), language);
      setError(localized.message);
      if (localized.cooldownSec) setCooldown(localized.cooldownSec);
    } else {
      setSent(true);
      // Even on success, GoTrue may enforce 60s between requests — prevent spam
      setCooldown(60);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t.auth.resetPassword}</h2>

          {sent ? (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">
              {t.auth.resetSent}
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.auth.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || cooldown > 0}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting
                  ? t.common.loading
                  : cooldown > 0
                    ? (language === 'de' ? `Bitte warten (${cooldown}s)` : `Please wait (${cooldown}s)`)
                    : t.auth.resetPassword}
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="text-teal-600 hover:underline">
              {t.common.back}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
