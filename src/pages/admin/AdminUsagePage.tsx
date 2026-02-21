/**
 * Admin Usage Page — Token consumption charts and cost tracking.
 */

import { useState } from 'react';
import { AdminNav } from '../../features/admin/components/AdminNav';
import { useTokenUsage, useAiUsageLogs, useUsageSummary } from '../../features/admin/hooks/useAdminData';
import { useTranslation } from '../../i18n';

export function AdminUsagePage() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const { usageStats, isLoading } = useUsageSummary(days);
  const { data: recentLogs } = useAiUsageLogs(50);

  // Aggregate stats for display
  const totalTokens = usageStats?.reduce((sum, s) => sum + s.total_tokens, 0) ?? 0;
  const totalCost = usageStats?.reduce((sum, s) => sum + s.total_cost_usd, 0) ?? 0;
  const totalCalls = usageStats?.reduce((sum, s) => sum + s.call_count, 0) ?? 0;

  // Group by day for the chart
  const dailyData = usageStats?.reduce((acc, stat) => {
    const day = stat.day.split('T')[0];
    if (!acc[day]) {
      acc[day] = { day, tokens: 0, calls: 0, cost: 0 };
    }
    acc[day].tokens += stat.total_tokens;
    acc[day].calls += stat.call_count;
    acc[day].cost += stat.total_cost_usd;
    return acc;
  }, {} as Record<string, { day: string; tokens: number; calls: number; cost: number }>) ?? {};

  const chartData = Object.values(dailyData).sort((a, b) => a.day.localeCompare(b.day));
  const maxTokens = Math.max(...chartData.map(d => d.tokens), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t.admin.usage}</h2>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  days === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {d} {t.admin.daysLabel}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="text-xs text-gray-500 uppercase">{t.admin.totalCalls}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{totalCalls}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="text-xs text-gray-500 uppercase">{t.admin.totalTokens}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(totalTokens)}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="text-xs text-gray-500 uppercase">{t.admin.totalCost}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">${totalCost.toFixed(4)}</div>
              </div>
            </div>

            {/* Simple Bar Chart */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">{t.admin.tokensByDay}</h3>
                <div className="flex items-end gap-1 h-40">
                  {chartData.map(d => (
                    <div key={d.day} className="flex-1 flex flex-col items-center group relative">
                      <div
                        className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors min-h-[2px]"
                        style={{ height: `${(d.tokens / maxTokens) * 100}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        {d.day}: {formatNumber(d.tokens)} tokens, {d.calls} calls
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                  <span>{chartData[0]?.day}</span>
                  <span>{chartData[chartData.length - 1]?.day}</span>
                </div>
              </div>
            )}

            {/* Recent Logs Table */}
            {recentLogs && recentLogs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">{t.admin.recentCalls}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500 uppercase">
                        <th className="px-4 py-2">{t.admin.timeLabel}</th>
                        <th className="px-4 py-2">Agent</th>
                        <th className="px-4 py-2">Model</th>
                        <th className="px-4 py-2 text-right">Tokens</th>
                        <th className="px-4 py-2 text-right">{t.admin.costLabel}</th>
                        <th className="px-4 py-2 text-right">ms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentLogs.map((log: Record<string, unknown>) => (
                        <tr key={log.id as string} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-600">
                            {new Date(log.created_at as string).toLocaleString('de-DE', {
                              hour: '2-digit', minute: '2-digit',
                              day: '2-digit', month: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                              {log.agent_type as string}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{log.model as string}</td>
                          <td className="px-4 py-2 text-right font-mono text-gray-700">
                            {formatNumber(log.tokens_total as number)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-gray-700">
                            ${((log.estimated_cost_usd as number) ?? 0).toFixed(6)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-500">
                            {(log.duration_ms as number) ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
