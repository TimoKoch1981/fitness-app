import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation } from '../i18n';
import { APP_NAME } from '../lib/constants';
import { LanguageSelector } from '../components/LanguageSelector';
import { localizeAuthError } from '../lib/auth/localizeAuthError';

export function RegisterPage() {
  const { signUp, user, loading } = useAuth();
  const { t, language } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [autoLogging, setAutoLogging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/buddy" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Trim to avoid invisible whitespace from autofill/paste
    const pw = password.trim();
    const cpw = confirmPassword.trim();

    if (pw !== cpw) {
      setError(language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match');
      return;
    }

    if (pw.length < 6) {
      setError(language === 'de' ? 'Passwort muss mindestens 6 Zeichen lang sein' : 'Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const { error, autoConfirmed } = await signUp(email.trim(), pw);
      if (error) {
        // v14.25 / A-07: Account-Enumeration-Schutz. "User already registered"
        // wird zur neutralen Bestaetigungs-Mitteilung — der Angreifer kann
        // nicht aus dem Response unterscheiden, ob die Email schon vergeben
        // ist. Echte Neukunden erhalten die Mail und werden bestaetigt;
        // Bestandsuser bekommen GoTrue-seitig (resend) keine Reset-Mail,
        // koennen sich aber normal anmelden.
        const localized = localizeAuthError(error.message, language);
        if (localized.isEnumerationGuard) {
          // Zeige Success-style UX statt rotem Banner.
          setSuccess(true);
        } else {
          setError(localized.message);
        }
      } else if (autoConfirmed) {
        setAutoLogging(true);
        return;
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  };

  if (autoLogging) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4">
        <div className="bg-theme-surface rounded-theme-lg border border-theme-line p-6 max-w-sm w-full text-center">
          <h2 className="text-lg font-semibold text-theme-ink font-theme-display mb-2 tracking-tight">
            {language === 'de' ? 'Willkommen bei FitBuddy.' : 'Welcome to FitBuddy.'}
          </h2>
          <p className="text-sm text-theme-ink-2">
            {language === 'de' ? 'Du wirst gleich weitergeleitet...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4">
        <div className="bg-theme-surface rounded-theme-lg border border-theme-line p-6 max-w-sm w-full text-center">
          <h2 className="text-lg font-semibold text-theme-ink font-theme-display mb-2 tracking-tight">
            {language === 'de' ? 'Registrierung erfolgreich' : 'Registration successful'}
          </h2>
          <p className="text-sm text-theme-ink-2 mb-1">
            {language === 'de'
              ? 'Bitte überprüfe deine E-Mail und bestätige dein Konto.'
              : 'Please check your email and confirm your account.'}
          </p>
          <p className="text-sm font-medium text-theme-primary mb-4 break-all">{email}</p>
          <Link to="/login" className="inline-block py-2 px-6 bg-theme-primary text-theme-primary-on rounded-theme-md hover:bg-theme-primary-2 transition-colors">
            {t.auth.login}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4 relative">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-theme-primary rounded-theme-lg mx-auto mb-4 flex items-center justify-center" aria-hidden="true">
            <span className="text-2xl text-theme-primary-on font-bold tracking-tight">FB</span>
          </div>
          <h1 className="text-2xl font-semibold text-theme-ink font-theme-display tracking-tight">{APP_NAME}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-theme-surface rounded-theme-lg border border-theme-line p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme-ink">{t.auth.register}</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-theme-md">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-theme-ink mb-1">{t.auth.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-3 py-2 bg-theme-surface border border-theme-line rounded-theme-md focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none transition-colors"
              required
            />
          </div>

          {/* Password with toggle */}
          <div>
            <label className="block text-sm font-medium text-theme-ink mb-1">{t.auth.password}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2 pr-10 bg-theme-surface border border-theme-line rounded-theme-md focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none transition-colors"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-theme-ink-3 hover:text-theme-ink-2 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password with toggle */}
          <div>
            <label className="block text-sm font-medium text-theme-ink mb-1">{t.auth.confirmPassword}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2 pr-10 bg-theme-surface border border-theme-line rounded-theme-md focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none transition-colors"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-theme-ink-3 hover:text-theme-ink-2 transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-theme-primary text-theme-primary-on font-medium rounded-theme-md hover:bg-theme-primary-2 disabled:opacity-50 transition-colors"
          >
            {submitting ? t.common.loading : t.auth.register}
          </button>

          <p className="text-center text-sm text-theme-ink-2">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="text-theme-primary font-medium hover:underline">{t.auth.login}</Link>
          </p>
        </form>

        {/* Legal Links */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-theme-ink-3">
          <Link to="/impressum" className="hover:text-theme-primary transition-colors">{t.legal.impressumTitle}</Link>
          <span>|</span>
          <Link to="/datenschutz" className="hover:text-theme-primary transition-colors">{t.legal.privacyPolicy}</Link>
        </div>
      </div>
    </div>
  );
}
