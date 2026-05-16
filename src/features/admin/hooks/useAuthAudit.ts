/**
 * useAuthAudit — Admin-only hook fuer GoTrue-Audit-Trail (PH11).
 *
 * Backend: public.fn_get_auth_audit_recent(p_limit)
 *   - SECURITY DEFINER, validiert is_admin server-seitig
 *   - liest auth.audit_log_entries (letzte 30 Tage)
 *   - Felder: id, created_at, action, user_email, user_id, provider, log_type, ip_address
 *
 * Verwendung: AdminAuthAuditPage.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface AuthAuditEntry {
  id: string;
  created_at: string;
  action: string | null;
  user_email: string | null;
  user_id: string | null;
  provider: string | null;
  log_type: string | null;
  ip_address: string | null;
}

export const AUTH_AUDIT_KEY = ['admin', 'auth-audit'] as const;

export function useAuthAudit(limit: number = 200) {
  return useQuery<AuthAuditEntry[]>({
    queryKey: [...AUTH_AUDIT_KEY, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_get_auth_audit_recent', { p_limit: limit });
      if (error) throw new Error(error.message);
      return (data ?? []) as AuthAuditEntry[];
    },
    staleTime: 30_000,  // 30s — audit-data muss frisch sein
  });
}
