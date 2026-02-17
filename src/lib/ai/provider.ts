/**
 * AI Provider Interface and Factory.
 * Supports swappable AI backends: Ollama (local), OpenAI, Claude.
 *
 * @see docs/ARCHITEKTUR.md - Section 4: KI-Provider Strategie
 */

import type { ChatMessage, AIResponse, AIProviderConfig } from './types';
import type { HealthContext } from '../../types/health';
import { OllamaProvider } from './ollama';

export interface AIProvider {
  /** Send a chat message and get a response */
  chat(messages: ChatMessage[], context?: HealthContext): Promise<AIResponse>;
  /** Check if the provider is available/connected */
  isAvailable(): Promise<boolean>;
  /** Get the provider name for display */
  getName(): string;
}

/** Current provider configuration */
const defaultConfig: AIProviderConfig = {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'llama3.1:8b',
};

let currentProvider: AIProvider | null = null;

/**
 * Get the configured AI provider instance.
 * Creates a singleton based on configuration.
 */
export function getAIProvider(config?: Partial<AIProviderConfig>): AIProvider {
  const mergedConfig = { ...defaultConfig, ...config };

  if (!currentProvider || (config && Object.keys(config).length > 0)) {
    switch (mergedConfig.provider) {
      case 'ollama':
        currentProvider = new OllamaProvider(
          mergedConfig.baseUrl ?? 'http://localhost:11434',
          mergedConfig.model ?? 'llama3.1:8b'
        );
        break;
      // Future providers:
      // case 'openai':
      //   currentProvider = new OpenAIProvider(mergedConfig.apiKey!, mergedConfig.model ?? 'gpt-4o-mini');
      //   break;
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
