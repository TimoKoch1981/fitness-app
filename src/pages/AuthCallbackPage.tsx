import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';

/**
 * OAuth Callback Handler — handles redirect from Google/Apple OAuth.
 * Supabase automatically exchanges the auth code for a session.
 * We just wait for the session and redirect to /cockpit.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          navigate('/cockpit', { replace: true });
        }
      }
    );

    // Fallback: if already signed in (session restored from URL hash)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/cockpit', { replace: true });
      }
    });

    // Safety timeout: redirect to login after 10s if nothing happens
    const timeout = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{t.common?.loading || 'Laden...'}</p>
      </div>
    </div>
  );
}
