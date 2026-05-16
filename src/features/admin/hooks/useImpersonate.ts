/**
 * useImpersonate — Admin-Impersonation-Hook (PH5 / Phase 4).
 *
 * Flow:
 *   1. startImpersonation({ targetUserId, reason })
 *      -> Edge Function admin-impersonate aufrufen
 *      -> received token_hash + log_id
 *      -> sessionStorage: original admin session token sichern (fuer "Beenden")
 *      -> sessionStorage: log_id + admin_email sichern (fuer Banner)
 *      -> verifyOtp({type:'magiclink', token_hash}) -> target-session
 *      -> reload -> AppRoutes laden als target_user
 *
 *   2. endImpersonation()
 *      -> end_impersonation_session RPC (markiert ended_at = now())
 *      -> sessionStorage clearen
 *      -> signOut()
 *      -> redirect /login (Admin muss sich neu einloggen)
 *
 * Security:
 *   - sessionStorage statt localStorage: ueberlebt KEIN Browser-restart
 *   - Magic-Link ist single-use + 60min TTL durch Supabase default
 *   - Edge Function macht die echte Auth-Pruefung; dieser Hook ist nur UI
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

const STORAGE_KEY_LOG_ID = 'fitbuddy_impersonation_log_id';
const STORAGE_KEY_TARGET_EMAIL = 'fitbuddy_impersonation_target_email';
const STORAGE_KEY_ADMIN_EMAIL = 'fitbuddy_impersonation_admin_email';

export interface ImpersonationState {
  active: boolean;
  targetEmail: string | null;
  adminEmail: string | null;
  logId: string | null;
}

export function getImpersonationState(): ImpersonationState {
  try {
    return {
      active: !!sessionStorage.getItem(STORAGE_KEY_LOG_ID),
      targetEmail: sessionStorage.getItem(STORAGE_KEY_TARGET_EMAIL),
      adminEmail: sessionStorage.getItem(STORAGE_KEY_ADMIN_EMAIL),
      logId: sessionStorage.getItem(STORAGE_KEY_LOG_ID),
    };
  } catch {
    return { active: false, targetEmail: null, adminEmail: null, logId: null };
  }
}

export function useImpersonate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startImpersonation = useCallback(async (opts: { targetUserId: string; reason: string }) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Capture current admin email (for banner + "back" flow)
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser?.email) {
        throw new Error('Du bist nicht eingeloggt.');
      }

      // 2. Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('admin-impersonate', {
        body: { target_user_id: opts.targetUserId, reason: opts.reason },
      });

      if (fnError) {
        throw new Error(fnError.message ?? 'Impersonation-Anfrage fehlgeschlagen');
      }

      const { token_hash, log_id, target_email } = data as {
        token_hash: string; log_id: string; target_email: string;
      };

      if (!token_hash) throw new Error('Kein Token erhalten');

      // 3. Persist banner-info BEFORE switching session
      sessionStorage.setItem(STORAGE_KEY_LOG_ID, log_id);
      sessionStorage.setItem(STORAGE_KEY_TARGET_EMAIL, target_email);
      sessionStorage.setItem(STORAGE_KEY_ADMIN_EMAIL, adminUser.email);

      // 4. Exchange token_hash for target session
      const { error: otpError } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash,
      });

      if (otpError) {
        // Cleanup on failure
        sessionStorage.removeItem(STORAGE_KEY_LOG_ID);
        sessionStorage.removeItem(STORAGE_KEY_TARGET_EMAIL);
        sessionStorage.removeItem(STORAGE_KEY_ADMIN_EMAIL);
        throw new Error(`Token-Tausch fehlgeschlagen: ${otpError.message}`);
      }

      // 5. Hard reload to ensure all React-Query caches refetch with target session
      window.location.href = '/cockpit';
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setLoading(false);
      throw e;
    }
  }, []);

  const endImpersonation = useCallback(async () => {
    setLoading(true);
    try {
      const logId = sessionStorage.getItem(STORAGE_KEY_LOG_ID);
      if (logId) {
        // Best-effort: mark session as ended in audit-log
        await supabase.rpc('end_impersonation_session', { p_log_id: logId }).then(() => undefined);
      }
    } finally {
      sessionStorage.removeItem(STORAGE_KEY_LOG_ID);
      sessionStorage.removeItem(STORAGE_KEY_TARGET_EMAIL);
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_EMAIL);
      await supabase.auth.signOut();
      window.location.href = '/login?reason=impersonation_ended';
    }
  }, []);

  return { startImpersonation, endImpersonation, loading, error };
}
