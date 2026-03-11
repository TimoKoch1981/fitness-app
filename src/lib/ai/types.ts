/**
 * AI Provider types for the FitBuddy chat system.
 * Supports multiple providers: Ollama (local), OpenAI, Supabase Proxy, Claude.
 */

/** OpenAI Function Calling tool_call from a response */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** Tool calls requested by the assistant (Function Calling) */
  tool_calls?: ToolCall[];
  /** For role='tool' — the ID of the tool call this response belongs to */
  tool_call_id?: string;
}

export interface AIResponse {
  content: string;
  model?: string;
  tokensUsed?: number;
  /** Tool calls from OpenAI Function Calling (present when tools were requested) */
  tool_calls?: ToolCall[];
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
  provider: 'ollama' | 'openai' | 'supabase' | 'claude';
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}
