/**
 * Hook: AI Usage Logging — writes token usage to ai_usage_logs after each API call.
 * Called from the buddy chat hook after every agent response.
 *
 * Cost estimation based on OpenAI pricing (gpt-4o-mini):
 *   Input:  $0.15 / 1M tokens
 *   Output: $0.60 / 1M tokens
 */

import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';

interface LogAiUsageParams {
  agentType: string;
  model: string;
  tokensInput?: number;
  tokensOutput?: number;
  tokensTotal?: number;
  durationMs?: number;
}

/** Cost per token by model (USD) */
const COST_MAP: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  'gpt-4o': { input: 2.50 / 1_000_000, output: 10.0 / 1_000_000 },
  'llama3.1:8b': { input: 0, output: 0 }, // local = free
};

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const rates = COST_MAP[model] ?? COST_MAP['gpt-4o-mini'];
  return tokensIn * rates.input + tokensOut * rates.output;
}

/**
 * Returns a function to log AI usage to supabase.
 * Fire-and-forget — errors are logged to console, not thrown.
 */
export function useLogAiUsage() {
  const { user } = useAuth();

  const logUsage = useCallback(async (params: LogAiUsageParams) => {
    if (!user) return;

    const tokensInput = params.tokensInput ?? 0;
    const tokensOutput = params.tokensOutput ?? 0;
    const tokensTotal = params.tokensTotal ?? (tokensInput + tokensOutput);
    const cost = estimateCost(params.model, tokensInput, tokensOutput);

    try {
      const { error } = await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        agent_type: params.agentType,
        model: params.model,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        tokens_total: tokensTotal,
        estimated_cost_usd: cost,
        duration_ms: params.durationMs ?? null,
      });

      if (error) {
        console.warn('[AiUsageLog] Failed to log usage:', error.message);
      }
    } catch (err) {
      console.warn('[AiUsageLog] Unexpected error:', err);
    }
  }, [user]);

  return logUsage;
}

/**
 * Standalone function for logging usage outside React components.
 * Used by the AI provider or agent router directly.
 */
export async function logAiUsageDirect(
  userId: string,
  params: LogAiUsageParams,
): Promise<void> {
  const tokensInput = params.tokensInput ?? 0;
  const tokensOutput = params.tokensOutput ?? 0;
  const tokensTotal = params.tokensTotal ?? (tokensInput + tokensOutput);
  const cost = estimateCost(params.model, tokensInput, tokensOutput);

  try {
    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      agent_type: params.agentType,
      model: params.model,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      tokens_total: tokensTotal,
      estimated_cost_usd: cost,
      duration_ms: params.durationMs ?? null,
    });

    if (error) {
      console.warn('[AiUsageLog] Failed to log usage:', error.message);
    }
  } catch (err) {
    console.warn('[AiUsageLog] Unexpected error:', err);
  }
}
