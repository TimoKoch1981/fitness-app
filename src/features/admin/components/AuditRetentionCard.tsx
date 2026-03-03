/**
 * AuditRetentionCard — Admin card showing audit log retention policy
 * and providing a manual cleanup trigger.
 *
 * Displays retention rules per category and last cleanup results.
 * DSGVO-compliant: different retention periods for different event types.
 */

import { useState } from 'react';
import { Shield, Trash2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuditRetention } from '../hooks/useAuditRetention';
import { useTranslation } from '../../../i18n';

function formatRetentionDays(days: number, t: Record<string, string | undefined>): string {
  if (days >= 3650) return t.years10 || '10 years';
  if (days >= 730) return t.years2 || '2 years';
  if (days >= 365) return t.year1 || '1 year';
  return `${days} ${t.days || 'days'}`;
}

export function AuditRetentionCard() {
  const { t } = useTranslation();
  const { retentionPolicy, runCleanup, lastResult, isRunning, error } = useAuditRetention();
  const [showConfirm, setShowConfirm] = useState(false);

  const retentionT = t.admin?.auditRetention || {} as Record<string, string>;

  const categoryLabels: Record<string, string> = {
    login: retentionT.loginEvents || 'Login/Logout',
    dataChange: retentionT.dataChanges || 'Data Changes',
    security: retentionT.securityEvents || 'Security Events',
    consent: retentionT.consentChanges || 'Consent Changes',
  };

  const handleCleanup = async () => {
    setShowConfirm(false);
    try {
      await runCleanup();
    } catch {
      // Error is captured in the hook
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber-500" />
        {retentionT.title || 'Audit Log Retention'}
      </h3>

      {/* Retention Policy Table */}
      <div className="rounded-lg border border-gray-100 overflow-hidden mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-1.5 px-2.5 text-gray-500 font-medium">
                {retentionT.category || 'Category'}
              </th>
              <th className="text-right py-1.5 px-2.5 text-gray-500 font-medium">
                {retentionT.retention || 'Retention'}
              </th>
            </tr>
          </thead>
          <tbody>
            {retentionPolicy.map((rule) => (
              <tr key={rule.category} className="border-t border-gray-50">
                <td className="py-1.5 px-2.5 text-gray-700">
                  {categoryLabels[rule.category] || rule.category}
                </td>
                <td className="py-1.5 px-2.5 text-right text-gray-500 flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRetentionDays(rule.retentionDays, retentionT)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error display */}
      {error && (
        <p className="text-xs text-red-500 mb-2">
          {error.message}
        </p>
      )}

      {/* Last Cleanup Results */}
      {lastResult && (
        <div className="mb-3 p-2.5 rounded-lg bg-green-50 border border-green-100">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-medium text-green-700">
              {retentionT.cleanup || 'Cleanup'}: {lastResult.totalDeleted} {retentionT.deleted || 'entries deleted'}
            </span>
          </div>
          <div className="text-[10px] text-green-600 space-y-0.5">
            {Object.entries(lastResult.deletedCounts).map(([cat, count]) => (
              <div key={cat} className="flex justify-between">
                <span>{categoryLabels[cat] || cat}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-green-500 mt-1">
            {new Date(lastResult.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Cleanup Button */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Trash2 className="h-3.5 w-3.5 animate-pulse" />
              {retentionT.running || 'Running...'}
            </>
          ) : (
            <>
              <Trash2 className="h-3.5 w-3.5" />
              {retentionT.runNow || 'Run Cleanup Now'}
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{retentionT.confirmCleanup || 'Delete expired audit logs?'}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCleanup}
              className="flex-1 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
            >
              {t.common.confirm}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
