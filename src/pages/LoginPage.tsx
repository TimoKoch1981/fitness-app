import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation } from '../i18n';
import { APP_NAME } from '../lib/constants';

export function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/buddy" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white font-bold">FB</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.app.tagline}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t.auth.login}</h2>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {submitting ? t.common.loading : t.auth.login}
          </button>

          <div className="text-center text-sm text-gray-500 space-y-2">
            <Link to="/forgot-password" className="block text-teal-600 hover:underline">
              {t.auth.forgotPassword}
            </Link>
            <p>
              {t.auth.noAccount}{' '}
              <Link to="/register" className="text-teal-600 font-medium hover:underline">
                {t.auth.register}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
