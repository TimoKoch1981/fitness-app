import { LogOut, User } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation } from '../i18n';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  return (
    <PageShell title={t.profile.title}>
      <div className="space-y-4">
        {/* User Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {user?.email ?? 'Benutzer'}
            </p>
            <p className="text-xs text-gray-400">
              {user?.id?.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Language Switch */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t.profile.settings}</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t.profile.language}</span>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setLanguage('de')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  language === 'de'
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.profile.german}
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  language === 'en'
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.profile.english}
              </button>
            </div>
          </div>
        </div>

        {/* Placeholder sections */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">{t.profile.personalData}</h3>
          <p className="text-sm text-gray-400">Phase 3b</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">{t.profile.goals}</h3>
          <p className="text-sm text-gray-400">Phase 3b</p>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t.auth.logout}
        </button>

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-400 text-center px-4 mt-4">
          {t.app.disclaimer}
        </p>
      </div>
    </PageShell>
  );
}
