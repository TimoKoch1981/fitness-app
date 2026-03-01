import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import type { OAuthProvider } from '../app/providers/AuthProvider';
import { useTranslation } from '../i18n';
import { APP_NAME } from '../lib/constants';

export function LoginPage() {
  const { signIn, signInWithOAuth, resendConfirmation, user, loading } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  if (loading) return null;
  if (user) return <Navigate to="/cockpit" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailNotConfirmed(false);
    setResendSuccess(false);
    setSubmitting(true);

    const { error, errorCode } = await signIn(email, password);
    if (error) {
      if (errorCode === 'email_not_confirmed') {
        setEmailNotConfirmed(true);
      } else {
        setError(error.message);
      }
    }
    setSubmitting(false);
  };

  const handleResendConfirmation = async () => {
    setResending(true);
    setResendSuccess(false);
    const { error } = await resendConfirmation(email);
    if (error) {
      setError(error.message);
    } else {
      setResendSuccess(true);
    }
    setResending(false);
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setError('');
    setOauthLoading(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
    // On success, the browser redirects — no need to reset loading
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg" aria-hidden="true">
            <span className="text-2xl text-white font-bold">FB</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.app.tagline}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t.auth.login}</h2>

          {error && (
            <div role="alert" aria-live="assertive" className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {emailNotConfirmed && (
            <div role="alert" aria-live="assertive" className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none">✉️</span>
                <div>
                  <p className="font-medium">{t.auth.emailNotConfirmedTitle}</p>
                  <p className="text-amber-700 mt-0.5">{t.auth.emailNotConfirmedMessage}</p>
                </div>
              </div>
              {resendSuccess ? (
                <p className="text-emerald-600 font-medium text-center">
                  {t.auth.confirmationResent}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="w-full py-1.5 text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {resending ? t.common.loading : t.auth.resendConfirmation}
                </button>
              )}
            </div>
          )}

          {/* OAuth Social Login Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={!!oauthLoading || submitting}
              className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {oauthLoading === 'google' ? t.common?.loading || 'Laden...' : (t.auth as Record<string, string>).signInWithGoogle || 'Mit Google anmelden'}
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignIn('apple')}
              disabled={!!oauthLoading || submitting}
              className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.45-3.74 4.25z"/>
              </svg>
              {oauthLoading === 'apple' ? t.common?.loading || 'Laden...' : (t.auth as Record<string, string>).signInWithApple || 'Mit Apple anmelden'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">{(t.auth as Record<string, string>).orWithEmail || 'oder mit E-Mail'}</span>
            </div>
          </div>

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.email}
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.password}
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !!oauthLoading}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {submitting ? t.common.loading : t.auth.login}
          </button>

          <div className="text-center text-sm text-gray-500 space-y-2">
            <Link to="/forgot-password" className="block text-teal-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded">
              {t.auth.forgotPassword}
            </Link>
            <p>
              {t.auth.noAccount}{' '}
              <Link to="/register" className="text-teal-700 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded">
                {t.auth.register}
              </Link>
            </p>
          </div>
        </form>

        {/* Legal Links */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-400">
          <Link to="/impressum" className="hover:text-teal-600 transition-colors">
            {t.legal.impressumTitle}
          </Link>
          <span>|</span>
          <Link to="/datenschutz" className="hover:text-teal-600 transition-colors">
            {t.legal.privacyPolicy}
          </Link>
        </div>
      </div>
    </div>
  );
}
