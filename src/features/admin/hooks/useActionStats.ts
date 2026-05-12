/**
 * Hook: fetches the 24h reliability stats per ActionType
 * + the parsing-path-usage breakdown from useBuddyChat.
 *
 * Reads from the views defined in 20260512000001_ai_action_logs.sql.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export interface ActionStat24h {
  action_type: string;
  attempted: number;
  succeeded: number;
  failed: number;
  validation_failed: number;
  parse_failed: number;
  success_rate_pct: number | null;
  avg_latency_ms: number | null;
}

export interface ParsingPathStat24h {
  parsing_path: string;
  uses: number;
  distinct_action_types: number;
}

export interface ActionFailure {
  created_at: string;
  action_type: string;
  phase: string;
  error_code: string | null;
  error_detail: string | null;
  agent_type: string | null;
  latency_ms: number | null;
  metadata: Record<string, unknown> | null;
}

export function useActionStats24h() {
  return useQuery<ActionStat24h[]>({
    queryKey: ['ai_action_stats_24h'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_action_stats_24h')
        .select('*');
      if (error) throw error;
      return (data ?? []) as ActionStat24h[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useParsingPathStats24h() {
  return useQuery<ParsingPathStat24h[]>({
    queryKey: ['ai_parsing_path_stats_24h'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_parsing_path_stats_24h')
        .select('*');
      if (error) throw error;
      return (data ?? []) as ParsingPathStat24h[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useRecentActionFailures(limit = 50) {
  return useQuery<ActionFailure[]>({
    queryKey: ['ai_action_recent_failures', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_action_recent_failures')
        .select('*')
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ActionFailure[];
    },
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
}
