/**
 * llmCost — Cost-Schaetzung pro LLM-Modell.
 *
 * Quellen:
 * - OpenAI: https://openai.com/api/pricing/
 * - Anthropic: https://www.anthropic.com/pricing
 *
 * Preise in USD per 1M tokens, umgerechnet zu EUR Cent (1 USD ~ 0.92 EUR Stand 2026-05).
 * Werte sind grobe Schaetzung — fuer exakte Abrechnung Provider-Invoices nutzen.
 */

interface ModelCostUSD {
  /** USD per 1M input tokens */
  input: number;
  /** USD per 1M output tokens */
  output: number;
}

const PRICING_USD_PER_1M_TOKENS: Record<string, ModelCostUSD> = {
  // OpenAI
  'gpt-4o-mini':    { input: 0.15,  output: 0.60 },
  'gpt-4o':         { input: 2.50,  output: 10.00 },
  'gpt-4-turbo':    { input: 10.00, output: 30.00 },
  // Anthropic
  'claude-sonnet-4-6':    { input: 3.00, output: 15.00 },
  'claude-opus-4-7':      { input: 15.00, output: 75.00 },
  'claude-haiku-4-5':     { input: 1.00, output: 5.00 },
  'claude-haiku-4-5-20251001': { input: 1.00, output: 5.00 },
};

const USD_TO_EUR_RATE = 0.92;

/**
 * Berechnet die LLM-Kosten in 1/100 Cent (integer fuer DB-Praezision).
 * Beispiel: 1000 prompt tokens + 200 completion tokens mit gpt-4o-mini:
 *  (1000 * 0.15 + 200 * 0.60) / 1_000_000 = 0.000270 USD
 *  ~= 0.000248 EUR = 24.8 Cent x100 = 25 (round)
 */
export function computeLLMCostCentsX100(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number | undefined {
  const pricing = PRICING_USD_PER_1M_TOKENS[model];
  if (!pricing) return undefined; // Unknown model — don't lie about cost
  const costUSD =
    (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000;
  const costEUR = costUSD * USD_TO_EUR_RATE;
  // 1/100 cents: e.g. 1 EUR = 10000
  return Math.round(costEUR * 10000);
}

export function knownModels(): string[] {
  return Object.keys(PRICING_USD_PER_1M_TOKENS);
}
