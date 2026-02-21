/**
 * Admin Dashboard — Overview page with key stats and quick links.
 */

import { AdminNav } from '../../features/admin/components/AdminNav';
import { useUserStats, useUsageSummary } from '../../features/admin/hooks/useAdminData';
import { useTranslation } from '../../i18n';

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const { data: users, isLoading: usersLoading } = useUserStats();
  const { summary, isLoading: usageLoading } = useUsageSummary(30);

  const isLoading = usersLoading || usageLoading;

  // Derived stats
  const totalUsers = users?.length ?? 0;
  const activeUsers = users?.filter(u => {
    const lastActivity = u.last_meal_at || u.last_workout_at;
    if (!lastActivity) return false;
    const daysSince = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length ?? 0;
  const confirmedUsers = users?.filter(u => u.email_confirmed_at).length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900">{t.admin.overview}</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            {/* User Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon="👥"
                label={t.admin.totalUsers}
                value={totalUsers}
                color="blue"
              />
              <StatCard
                icon="🟢"
                label={t.admin.activeUsers}
                value={activeUsers}
                subtext={`${t.admin.last7Days}`}
                color="green"
              />
              <StatCard
                icon="✉️"
                label={t.admin.confirmed}
                value={confirmedUsers}
                subtext={`${totalUsers > 0 ? Math.round((confirmedUsers / totalUsers) * 100) : 0}%`}
                color="teal"
              />
              <StatCard
                icon="🤖"
                label={t.admin.aiCalls}
                value={summary?.totalCalls ?? 0}
                subtext={`${t.admin.last30Days}`}
                color="purple"
              />
            </div>

            {/* Token Usage Summary */}
            {summary && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  🤖 {t.admin.tokenUsage} ({t.admin.last30Days})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MiniStat label={t.admin.totalTokens} value={formatNumber(summary.totalTokens)} />
                  <MiniStat label={t.admin.totalCost} value={`$${summary.totalCostUsd.toFixed(4)}`} />
                  <MiniStat label={t.admin.avgDuration} value={`${summary.avgDurationMs}ms`} />
                  <MiniStat label={t.admin.topAgent} value={summary.byAgent[0]?.[0] ?? '-'} />
                </div>

                {/* Agent breakdown */}
                {summary.byAgent.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">{t.admin.byAgent}</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.byAgent.map(([agent, count]) => (
                        <span
                          key={agent}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
                        >
                          {agent}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Users */}
            {users && users.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  👥 {t.admin.recentUsers}
                </h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map(user => (
                    <div key={user.user_id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-gray-900">
                          {user.display_name || user.email || 'Unknown'}
                        </span>
                        {user.email && user.display_name && (
                          <span className="text-gray-500 ml-2">({user.email})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 text-xs">
                        <span>🍽 {user.meal_count}</span>
                        <span>🏋️ {user.workout_count}</span>
                        <span>📏 {user.body_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────────

function StatCard({ icon, label, value, subtext, color }: {
  icon: string;
  label: string;
  value: number;
  subtext?: string;
  color: 'blue' | 'green' | 'teal' | 'purple';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    teal: 'bg-teal-50 text-teal-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`rounded-xl p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium uppercase opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <div className="text-xs opacity-70 mt-0.5">{subtext}</div>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
