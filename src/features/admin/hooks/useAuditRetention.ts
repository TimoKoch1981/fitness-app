/**
 * Hook for audit log retention management.
 * Provides static retention policy data and ability to trigger cleanup.
 *
 * Calls the audit-cleanup Edge Function when cleanup is requested.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export interface RetentionPolicyEntry {
  category: string;
  retentionDays: number;
  description: string;
}

export interface CleanupResult {
  deletedCounts: Record<string, number>;
  totalDeleted: number;
  timestamp: string;
}

/**
 * Static retention policy — matches the Edge Function's RETENTION_RULES.
 */
export const RETENTION_POLICY: RetentionPolicyEntry[] = [
  {
    category: 'login',
    retentionDays: 90,
    description: 'Login/Logout events',
  },
  {
    category: 'dataChange',
    retentionDays: 365,
    description: 'Data changes (INSERT/UPDATE/DELETE)',
  },
  {
    category: 'security',
    retentionDays: 730,
    description: 'Security events (password, MFA)',
  },
  {
    category: 'consent',
    retentionDays: 3650,
    description: 'Consent changes (legal requirement)',
  },
];

async function executeCleanup(): Promise<CleanupResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  const response = await fetch(`${supabaseUrl}/functions/v1/audit-cleanup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error || `HTTP ${response.status}`);
  }

  return (await response.json()) as CleanupResult;
}

export function useAuditRetention() {
  const [lastResult, setLastResult] = useState<CleanupResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const runCleanup = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    try {
      const result = await executeCleanup();
      setLastResult(result);
      return result;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsRunning(false);
    }
  }, []);

  return {
    retentionPolicy: RETENTION_POLICY,
    runCleanup,
    lastResult,
    isRunning,
    error,
  };
}
