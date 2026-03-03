/**
 * Hook for checking API key rotation status.
 * Calls the key-rotation-check Edge Function and returns per-key status.
 *
 * Uses TanStack Query with 1-hour stale time (keys don't change often).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface KeyRotationEntry {
  name: string;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
  daysOld: number | null;
  rotatedAt: string | null;
}

interface KeyRotationResponse {
  keys: KeyRotationEntry[];
}

async function fetchKeyRotationStatus(): Promise<KeyRotationEntry[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  const response = await fetch(`${supabaseUrl}/functions/v1/key-rotation-check`, {
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

  const data = (await response.json()) as KeyRotationResponse;
  return data.keys;
}

export function useKeyRotation() {
  const query = useQuery<KeyRotationEntry[]>({
    queryKey: ['admin', 'key-rotation'],
    queryFn: fetchKeyRotationStatus,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  return {
    keys: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
