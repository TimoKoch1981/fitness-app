/**
 * Ollama AI Provider - Local LLM integration.
 * Communicates with Ollama REST API at localhost:11434.
 *
 * CORS: Ollama needs OLLAMA_ORIGINS=* environment variable
 * or run with: OLLAMA_ORIGINS="http://localhost:5173" ollama serve
 *
 * @see https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import type { AIProvider } from './provider';
import type { ChatMessage, AIResponse } from './types';
import type { HealthContext } from '../../types/health';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.1:8b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  getName(): string {
    return `Ollama (${this.model})`;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: ChatMessage[], _context?: HealthContext): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 512,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
      content: data.message?.content ?? '',
      model: data.model ?? this.model,
      tokensUsed: data.eval_count,
    };
  }
}
