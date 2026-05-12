/**
 * AI Provider Interface and Factory.
 * Supports swappable AI backends: Ollama (local), OpenAI, Supabase Proxy.
 *
 * Provider selection via environment variable VITE_AI_PROVIDER:
 *   'openai'    → OpenAI API direct (default for local development)
 *   'ollama'    → Local Ollama instance
 *   'supabase'  → Supabase Edge Function ai-proxy (recommended for cloud)
 *
 * Auto-detection: if VITE_SUPABASE_URL starts with https:// (= cloud),
 * the provider automatically switches to 'supabase' unless overridden.
 *
 * @see docs/ARCHITEKTUR.md - Section 4: KI-Provider Strategie
 */

import type { ChatMessage, AIResponse, AIProviderConfig, StreamCallback } from './types';
import type { HealthContext } from '../../types/health';
import type { ToolDefinition } from './tools/actionTools';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { SupabaseAIProvider } from './supabaseProxy';
import { AnthropicProxyProvider } from './anthropicProxy';

/** Options for chat/chatStream calls — enables Function Calling */
export interface ChatOptions {
  /** OpenAI Function Calling tool definitions */
  tools?: ToolDefinition[];
  /** Control tool usage: 'auto' (default), 'none', or force a specific function */
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
}

export interface AIProvider {
  /** Send a chat message and get a response (blocking — waits for full response) */
  chat(messages: ChatMessage[], context?: HealthContext, options?: ChatOptions): Promise<AIResponse>;
  /** Send a chat message and stream the response token by token */
  chatStream(messages: ChatMessage[], onChunk: StreamCallback, context?: HealthContext, options?: ChatOptions): Promise<AIResponse>;
  /** Check if the provider is available/connected */
  isAvailable(): Promise<boolean>;
  /** Get the provider name for display */
  getName(): string;
}

/**
 * Detect if we're running in a Supabase Cloud environment.
 * Cloud URLs start with https://, local URLs are http://127.0.0.1:54321.
 */
function isCloudEnvironment(): boolean {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  return supabaseUrl.startsWith('https://');
}

/**
 * Read provider config from environment variables.
 * VITE_AI_PROVIDER: 'openai' | 'ollama' | 'supabase' (default: auto-detect)
 * VITE_OPENAI_API_KEY: OpenAI API key (required for openai provider)
 * VITE_OPENAI_MODEL: OpenAI model name (default: 'gpt-4o-mini')
 * VITE_OLLAMA_URL: Ollama base URL (default: 'http://localhost:11434')
 * VITE_OLLAMA_MODEL: Ollama model name (default: 'llama3.1:8b')
 * VITE_SUPABASE_URL: Supabase project URL
 * VITE_SUPABASE_ANON_KEY: Supabase anonymous key
 */
function getConfigFromEnv(): AIProviderConfig {
  let provider = (import.meta.env.VITE_AI_PROVIDER as string) || '';

  // Auto-detect: if no explicit provider set, use 'supabase' in cloud, 'openai' locally
  if (!provider) {
    provider = isCloudEnvironment() ? 'supabase' : 'openai';
  }

  return {
    provider: provider as AIProviderConfig['provider'],
    apiKey: (import.meta.env.VITE_OPENAI_API_KEY as string) || '',
    baseUrl: (import.meta.env.VITE_OLLAMA_URL as string) || 'http://localhost:11434',
    model: provider === 'ollama'
      ? (import.meta.env.VITE_OLLAMA_MODEL as string) || 'llama3.1:8b'
      : (import.meta.env.VITE_OPENAI_MODEL as string) || 'gpt-4o-mini',
  };
}

let currentProvider: AIProvider | null = null;

/**
 * Get the configured AI provider instance.
 * Creates a singleton based on environment configuration.
 */
export function getAIProvider(config?: Partial<AIProviderConfig>): AIProvider {
  const envConfig = getConfigFromEnv();
  const mergedConfig = { ...envConfig, ...config };

  if (!currentProvider || (config && Object.keys(config).length > 0)) {
    switch (mergedConfig.provider) {
      case 'supabase': {
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
        const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
        if (!supabaseUrl || !anonKey) {
          console.warn('[FitBuddy] Supabase URL/Key missing. Falling back to OpenAI direct.');
          if (mergedConfig.apiKey) {
            currentProvider = new OpenAIProvider(mergedConfig.apiKey, mergedConfig.model ?? 'gpt-4o-mini');
          } else {
            console.warn('[FitBuddy] No OpenAI key either. Falling back to Ollama.');
            currentProvider = new OllamaProvider(
              mergedConfig.baseUrl ?? 'http://localhost:11434',
              mergedConfig.model ?? 'llama3.1:8b',
            );
          }
        } else {
          currentProvider = new SupabaseAIProvider(supabaseUrl, anonKey, mergedConfig.model ?? 'gpt-4o-mini');
        }
        break;
      }
      case 'openai':
        if (!mergedConfig.apiKey) {
          console.warn('[FitBuddy] VITE_OPENAI_API_KEY is not set. Falling back to Ollama.');
          currentProvider = new OllamaProvider(
            mergedConfig.baseUrl ?? 'http://localhost:11434',
            mergedConfig.model ?? 'llama3.1:8b'
          );
        } else {
          currentProvider = new OpenAIProvider(
            mergedConfig.apiKey,
            mergedConfig.model ?? 'gpt-4o-mini'
          );
        }
        break;
      case 'ollama':
        currentProvider = new OllamaProvider(
          mergedConfig.baseUrl ?? 'http://localhost:11434',
          mergedConfig.model ?? 'llama3.1:8b'
        );
        break;
      default:
        currentProvider = new OllamaProvider(
          mergedConfig.baseUrl ?? 'http://localhost:11434',
          mergedConfig.model ?? 'llama3.1:8b'
        );
    }
  }

  return currentProvider;
}

/**
 * Check if the current environment uses the Supabase proxy.
 * Useful for call sites that need to decide between direct API calls
 * and proxy calls (vision, email extractor).
 */
export function isUsingProxy(): boolean {
  const provider = (import.meta.env.VITE_AI_PROVIDER as string) || '';
  return provider === 'supabase' || (!provider && isCloudEnvironment());
}

// ── Per-call-type provider selection ───────────────────────────────────
//
// Different call types have different reasoning requirements:
//   - Expert agents (Nutrition/Training/...): chat, streaming, cheap → gpt-4o-mini
//   - System Agent (Function Calling):       structured tool-call, costs little → can afford Sonnet
//   - Vision (meal/body photo):              multimodal → gpt-4o-mini (Claude vision is fine too but $$)
//
// Driven by env vars so we can flip per call-type without redeploy:
//   VITE_AI_SYSTEM_PROVIDER       'openai' | 'anthropic'  (default: 'openai')
//   VITE_ANTHROPIC_MODEL_SYSTEM   default: 'claude-sonnet-4-5'
//   VITE_OPENAI_MODEL_SYSTEM      default: VITE_OPENAI_MODEL or 'gpt-4o-mini'

let systemAgentProvider: AIProvider | null = null;
let systemAgentProviderKey: string = ''; // cache invalidation key

/**
 * Get the AI provider to use for the System Agent (Function Calling layer).
 *
 * Falls back gracefully:
 *   1. If VITE_AI_SYSTEM_PROVIDER='anthropic' → AnthropicProxyProvider via ai-proxy
 *   2. Otherwise → same provider as expert agents (typically Supabase/OpenAI)
 *
 * If the Anthropic call fails at runtime (e.g. server key missing), the
 * caller (executeSystemAgent) catches AnthropicUnavailableError and retries
 * with the expert-agent provider.
 */
export function getSystemAgentProvider(): AIProvider {
  const requested = (import.meta.env.VITE_AI_SYSTEM_PROVIDER as string) || '';
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  const claudeModel = (import.meta.env.VITE_ANTHROPIC_MODEL_SYSTEM as string) || 'claude-sonnet-4-5';

  // Cache key includes the requested provider AND model so changes invalidate
  const key = `${requested}|${claudeModel}|${supabaseUrl}`;
  if (systemAgentProvider && systemAgentProviderKey === key) {
    return systemAgentProvider;
  }

  if (requested === 'anthropic' && supabaseUrl && anonKey) {
    systemAgentProvider = new AnthropicProxyProvider(supabaseUrl, anonKey, claudeModel);
    systemAgentProviderKey = key;
    return systemAgentProvider;
  }

  // Default: same as expert agents (OpenAI via Supabase Proxy in production)
  systemAgentProvider = getAIProvider();
  systemAgentProviderKey = key;
  return systemAgentProvider;
}

/**
 * True when a separate Anthropic provider is configured for the System Agent.
 * The caller uses this to decide whether to set up fallback logic.
 */
export function systemAgentUsesAnthropic(): boolean {
  return (import.meta.env.VITE_AI_SYSTEM_PROVIDER as string) === 'anthropic';
}
