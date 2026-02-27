import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation } from '../i18n';
import { APP_NAME } from '../lib/constants';

export function RegisterPage() {
  const { signUp, user, loading } = useAuth();
  const { t, language } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [autoLogging, setAutoLogging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/buddy" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError(language === 'de' ? 'Passwort muss mindestens 6 Zeichen lang sein' : 'Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    const { error, autoConfirmed } = await signUp(email, password);
    if (error) {
      setError(error.message);
    } else if (autoConfirmed) {
      // AUTOCONFIRM active: user is already logged in, wait for redirect
      setAutoLogging(true);
      return; // Navigate to /buddy will trigger via AuthProvider
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  };

  // Auto-login spinner while auth state propagates
  if (autoLogging) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-6 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'de' ? 'Willkommen bei FitBuddy!' : 'Welcome to FitBuddy!'}
          </h2>
          <p className="text-sm text-gray-600">
            {language === 'de' ? 'Du wirst gleich weitergeleitet...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-6 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'de' ? 'Registrierung erfolgreich!' : 'Registration successful!'}
          </h2>
          <p className="text-sm text-gray-600 mb-1">
            {language === 'de'
              ? 'Bitte überprüfe deine E-Mail und bestätige dein Konto.'
              : 'Please check your email and confirm your account.'}
          </p>
          <p className="text-sm font-medium text-teal-600 mb-4">
            {email}
          </p>
          <Link
            to="/login"
            className="inline-block py-2 px-6 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            {t.auth.login}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white font-bold">FB</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t.auth.register}</h2>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {submitting ? t.common.loading : t.auth.register}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="text-teal-600 font-medium hover:underline">
              {t.auth.login}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
