/**
 * AdminNav — Top navigation bar for the admin section.
 * Displays tabs for Dashboard, Users, Products, Usage.
 */

import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../../i18n';

const ADMIN_TABS = [
  { path: '/admin', labelKey: 'dashboard' as const, icon: '📊' },
  { path: '/admin/users', labelKey: 'users' as const, icon: '👥' },
  { path: '/admin/products', labelKey: 'products' as const, icon: '🍎' },
  { path: '/admin/usage', labelKey: 'usage' as const, icon: '🤖' },
  { path: '/admin/feedback', labelKey: 'feedback' as const, icon: '💬' },
] as const;

export function AdminNav() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h1 className="text-lg font-bold text-gray-900">{t.admin.title}</h1>
          </div>
          <Link
            to="/buddy"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← {t.common.back}
          </Link>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {ADMIN_TABS.map(tab => {
            const isActive = location.pathname === tab.path ||
              (tab.path !== '/admin' && location.pathname.startsWith(tab.path));

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {t.admin[tab.labelKey]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
