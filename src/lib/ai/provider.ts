/**
 * AI Provider Interface and Factory.
 * Supports swappable AI backends: Ollama (local), OpenAI, Claude.
 *
 * Provider selection via environment variable VITE_AI_PROVIDER:
 *   'openai'  → OpenAI API (default for development)
 *   'ollama'  → Local Ollama instance
 *
 * @see docs/ARCHITEKTUR.md - Section 4: KI-Provider Strategie
 */

import type { ChatMessage, AIResponse, AIProviderConfig, StreamCallback } from './types';
import type { HealthContext } from '../../types/health';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';

export interface AIProvider {
  /** Send a chat message and get a response (blocking — waits for full response) */
  chat(messages: ChatMessage[], context?: HealthContext): Promise<AIResponse>;
  /** Send a chat message and stream the response token by token */
  chatStream(messages: ChatMessage[], onChunk: StreamCallback, context?: HealthContext): Promise<AIResponse>;
  /** Check if the provider is available/connected */
  isAvailable(): Promise<boolean>;
  /** Get the provider name for display */
  getName(): string;
}

/**
 * Read provider config from environment variables.
 * VITE_AI_PROVIDER: 'openai' | 'ollama' (default: 'openai')
 * VITE_OPENAI_API_KEY: OpenAI API key (required for openai provider)
 * VITE_OPENAI_MODEL: OpenAI model name (default: 'gpt-4o-mini')
 * VITE_OLLAMA_URL: Ollama base URL (default: 'http://localhost:11434')
 * VITE_OLLAMA_MODEL: Ollama model name (default: 'llama3.1:8b')
 */
function getConfigFromEnv(): AIProviderConfig {
  const provider = (import.meta.env.VITE_AI_PROVIDER as string) || 'openai';

  return {
    provider: provider as AIProviderConfig['provider'],
    apiKey: (import.meta.env.VITE_OPENAI_API_KEY as string) || '',
    baseUrl: (import.meta.env.VITE_OLLAMA_URL as string) || 'http://localhost:11434',
    model: provider === 'openai'
      ? (import.meta.env.VITE_OPENAI_MODEL as string) || 'gpt-4o-mini'
      : (import.meta.env.VITE_OLLAMA_MODEL as string) || 'llama3.1:8b',
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
      // Future providers:
      // case 'claude':
      //   currentProvider = new ClaudeProvider(mergedConfig.apiKey!, mergedConfig.model ?? 'claude-sonnet-4-20250514');
      //   break;
      default:
        currentProvider = new OllamaProvider(
          mergedConfig.baseUrl ?? 'http://localhost:11434',
          mergedConfig.model ?? 'llama3.1:8b'
        );
    }
  }

  return currentProvider;
}
