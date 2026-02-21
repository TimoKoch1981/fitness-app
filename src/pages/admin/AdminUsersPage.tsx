/**
 * Admin Users Page — shows all registered users with their activity stats.
 */

import { AdminNav } from '../../features/admin/components/AdminNav';
import { useUserStats } from '../../features/admin/hooks/useAdminData';
import { useTranslation } from '../../i18n';

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { data: users, isLoading, error } = useUserStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t.admin.users}</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
            {error.message}
          </div>
        ) : !users || users.length === 0 ? (
          <div className="bg-gray-100 text-gray-600 p-8 rounded-xl text-center">
            {t.common.noData}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="px-4 py-3">{t.admin.user}</th>
                    <th className="px-4 py-3">{t.admin.registered}</th>
                    <th className="px-4 py-3">{t.admin.lastLogin}</th>
                    <th className="px-4 py-3 text-center">🍽</th>
                    <th className="px-4 py-3 text-center">🏋️</th>
                    <th className="px-4 py-3 text-center">📏</th>
                    <th className="px-4 py-3">{t.admin.lastActivity}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => {
                    const lastActivity = user.last_meal_at || user.last_workout_at;
                    return (
                      <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {user.display_name || '-'}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(user.registered_at)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">
                          {user.meal_count}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">
                          {user.workout_count}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">
                          {user.body_count}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {lastActivity ? formatDate(lastActivity) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
