/**
 * Admin Auth Audit Page — Last 30 days of GoTrue auth events (PH11).
 *
 * Reads from public.fn_get_auth_audit_recent (SECURITY DEFINER, is_admin checked).
 * Supports filter by action-type + email-substring search.
 */

import { useMemo, useState } from 'react';
import { Search, Filter, ShieldAlert } from 'lucide-react';
import { AdminNav } from '../../features/admin/components/AdminNav';
import { useAuthAudit, type AuthAuditEntry } from '../../features/admin/hooks/useAuthAudit';
import { useTranslation } from '../../i18n';

/** Tag-Style fuer die haeufigsten action-Typen. */
const ACTION_BADGE: Record<string, string> = {
  login: 'bg-green-100 text-green-700 border-green-200',
  logout: 'bg-gray-100 text-gray-600 border-gray-200',
  token_refreshed: 'bg-blue-50 text-blue-600 border-blue-200',
  token_revoked: 'bg-orange-100 text-orange-700 border-orange-200',
  user_signedup: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  user_updated_password: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  user_recovery_requested: 'bg-amber-100 text-amber-800 border-amber-200',
  user_modified: 'bg-purple-100 text-purple-700 border-purple-200',
  user_deleted: 'bg-red-100 text-red-700 border-red-200',
  login_failed: 'bg-red-100 text-red-700 border-red-200',
};

function badgeClass(action: string | null): string {
  if (!action) return 'bg-gray-100 text-gray-500 border-gray-200';
  return ACTION_BADGE[action] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function AdminAuthAuditPage() {
  const { t } = useTranslation();
  const [limit, setLimit] = useState<number>(200);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const { data, isLoading, error, refetch, isFetching } = useAuthAudit(limit);

  // Aktionen unique fuer Filter-Dropdown
  const actionOptions = useMemo(() => {
    if (!data) return [] as string[];
    const set = new Set<string>();
    for (const e of data) if (e.action) set.add(e.action);
    return Array.from(set).sort();
  }, [data]);

  // Filter anwenden
  const filtered = useMemo(() => {
    if (!data) return [] as AuthAuditEntry[];
    const term = search.trim().toLowerCase();
    return data.filter(e => {
      if (actionFilter && e.action !== actionFilter) return false;
      if (term) {
        const hay = [e.user_email, e.user_id, e.ip_address, e.action, e.provider]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [data, actionFilter, search]);

  // Top-Counts (24h)
  const stats24h = useMemo(() => {
    if (!data) return { logins: 0, failed: 0, signups: 0, resets: 0 };
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let logins = 0, failed = 0, signups = 0, resets = 0;
    for (const e of data) {
      if (new Date(e.created_at).getTime() < cutoff) continue;
      if (e.action === 'login') logins++;
      else if (e.action === 'login_failed') failed++;
      else if (e.action === 'user_signedup') signups++;
      else if (e.action === 'user_recovery_requested') resets++;
    }
    return { logins, failed, signups, resets };
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t.admin.authAudit}</h2>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isFetching ? '…' : '↻'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Audit-Fehler:</strong> {error.message}
            </div>
          </div>
        )}

        {/* 24h Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500 uppercase">Logins 24h</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats24h.logins}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500 uppercase">Fehlversuche 24h</div>
            <div className={`text-2xl font-bold mt-1 ${stats24h.failed > 10 ? 'text-red-600' : 'text-gray-900'}`}>
              {stats24h.failed}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500 uppercase">Signups 24h</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats24h.signups}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500 uppercase">Pwd-Resets 24h</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats24h.resets}</div>
          </div>
        </div>

        {/* Filter-Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Email, IP, User-ID…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="px-2 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Alle Aktionen</option>
              {actionOptions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            {[100, 200, 500, 1000].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setLimit(n)}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  limit === n
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Events-Tabelle */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : !filtered.length ? (
          <div className="bg-gray-100 text-gray-600 p-8 rounded-xl text-center">
            {data?.length === 0
              ? 'Keine Auth-Events in den letzten 30 Tagen.'
              : 'Keine Treffer mit aktuellen Filtern.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                    <th className="px-3 py-2.5">Zeit</th>
                    <th className="px-3 py-2.5">Aktion</th>
                    <th className="px-3 py-2.5">Email</th>
                    <th className="px-3 py-2.5">Provider</th>
                    <th className="px-3 py-2.5">IP</th>
                    <th className="px-3 py-2.5">User-ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 text-gray-600 font-mono text-xs whitespace-nowrap">
                        {formatDateTime(e.created_at)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${badgeClass(e.action)}`}>
                          {e.action ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{e.user_email ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{e.provider ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono text-xs">{e.ip_address ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-400 font-mono text-[10px]" title={e.user_id ?? undefined}>
                        {e.user_id ? `${e.user_id.slice(0, 8)}…` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
              {filtered.length} von {data?.length ?? 0} Eintraegen (letzte 30 Tage, max {limit})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
