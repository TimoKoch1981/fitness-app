/**
 * AI Provider types for the FitBuddy chat system.
 * Supports multiple providers: Ollama (local), OpenAI, Claude.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model?: string;
  tokensUsed?: number;
}

/** Callback for streaming responses — called with accumulated text on each chunk */
export type StreamCallback = (partialContent: string) => void;

/**
 * Parsed intent from user message.
 * Used to determine if the AI wants to perform an action (log meal, etc.)
 */
export type IntentType =
  | 'log_meal'
  | 'log_workout'
  | 'log_body'
  | 'log_blood_pressure'
  | 'log_substance'
  | 'question'
  | 'greeting'
  | 'unknown';

export interface ParsedIntent {
  type: IntentType;
  confidence: number; // 0-1
  data?: Record<string, unknown>;
  rawResponse: string;
}

export interface AIProviderConfig {
  provider: 'ollama' | 'openai' | 'claude';
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}
