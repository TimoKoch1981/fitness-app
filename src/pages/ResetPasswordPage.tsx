/**
 * ResetPasswordPage — Reached via the link in the password-recovery email.
 *
 * v14.22 / A-02 fix: The Supabase JS-Client emits a dedicated
 * `PASSWORD_RECOVERY` event when the URL hash contains a recovery token.
 * We subscribe to that event instead of guessing with a 3-second timeout.
 *
 * Flow:
 *   1. User clicks the link in the email →
 *      `/auth/v1/verify?token=...&type=recovery&redirect_to=/reset-password`
 *   2. GoTrue verifies the token and redirects to `/reset-password#access_token=…&type=recovery`
 *   3. Supabase JS-Client parses the hash, sets the session, emits
 *      `PASSWORD_RECOVERY` event.
 *   4. We mark the form as "ready", user enters new password, we call
 *      `updateUser({ password })`.
 *
 * Edge cases:
 *   - Link expired / invalid token → no PASSWORD_RECOVERY event fires.
 *     We fall back to "if there's a session within 5s, allow the change;
 *     otherwise show error and offer a fresh reset request".
 *   - User comes to this page without a hash (direct URL): same fallback.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';

type ReadyState = 'pending' | 'ready' | 'invalid_link';

export function ResetPasswordPage() {
  const { updatePassword, session } = useAuth();
  const { t, language } = useTranslation();
  const isDE = language === 'de';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState<ReadyState>('pending');

  // v14.22: subscribe to PASSWORD_RECOVERY event from Supabase Auth.
  // This fires AFTER the JS-Client parsed the URL hash, exchanged it for
  // a session, and emitted the event. Much more reliable than a timeout.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady('ready');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fallback: if we already have a session (e.g. user refreshed the page,
  // or PASSWORD_RECOVERY already fired before our subscription mounted),
  // we still allow the password change. Without a session after 5s we
  // assume the link was invalid/expired and surface a clear error.
  useEffect(() => {
    if (session) {
      setReady('ready');
      return;
    }
    const timer = setTimeout(() => {
      setReady((s) => (s === 'pending' ? 'invalid_link' : s));
    }, 5000);
    return () => clearTimeout(timer);
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      // v14.22: bump minimum to 8 chars to align with OWASP ASVS V2.1.1.
      setError(isDE
        ? 'Passwort muss mindestens 8 Zeichen lang sein.'
        : 'Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setSubmitting(true);
    const { error } = await updatePassword(password);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Land on /cockpit so the user is straight in the app, not /buddy
      // which forces the Buddy panel open.
      setTimeout(() => navigate('/cockpit'), 1500);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t.auth.resetPassword}</h2>

          {ready === 'pending' && (
            <div className="flex items-center gap-3 bg-gray-50 text-gray-500 text-sm p-3 rounded-lg">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              {isDE
                ? 'Reset-Link wird geprüft …'
                : 'Verifying reset link …'}
            </div>
          )}

          {ready === 'invalid_link' && (
            <div className="space-y-3">
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
                {isDE
                  ? 'Der Reset-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.'
                  : 'The reset link is invalid or expired. Please request a new one.'}
              </div>
              <Link
                to="/forgot-password"
                className="block w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg text-center hover:from-teal-600 hover:to-emerald-700 transition-all"
              >
                {isDE ? 'Neuen Reset anfordern' : 'Request new reset'}
              </Link>
            </div>
          )}

          {ready === 'ready' && success && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">
              {t.auth.passwordUpdated}
            </div>
          )}

          {ready === 'ready' && !success && (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.auth.newPassword}
                </label>
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  required
                  minLength={8}
                  autoFocus
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  {isDE
                    ? 'Mindestens 8 Zeichen. Idealerweise lang und einzigartig.'
                    : 'At least 8 characters. Long and unique is best.'}
                </p>
              </div>

              <div>
                <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.auth.confirmNewPassword}
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
              >
                {submitting ? t.common.loading : t.auth.updatePassword}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
