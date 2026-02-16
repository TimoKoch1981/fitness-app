import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation } from '../i18n';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
              >
                {submitting ? t.common.loading : t.auth.resetPassword}
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
