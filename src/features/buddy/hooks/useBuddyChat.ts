/**
 * Chat hook for the FitBuddy AI assistant.
 * Manages chat state, sends messages to the AI provider,
 * and injects health context for personalized responses.
 */

import { useState, useCallback } from 'react';
import { getAIProvider } from '../../../lib/ai/provider';
import { buildSystemPrompt } from '../lib/systemPrompt';
import type { ChatMessage } from '../../../lib/ai/types';
import type { HealthContext } from '../../../types/health';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
}

interface UseBuddyChatOptions {
  context?: Partial<HealthContext>;
  language?: 'de' | 'en';
}

export function useBuddyChat({ context, language = 'de' }: UseBuddyChatOptions = {}) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const provider = getAIProvider();

  /** Check if AI provider is available */
  const checkConnection = useCallback(async () => {
    const available = await provider.isAvailable();
    setIsConnected(available);
    return available;
  }, [provider]);

  /** Send a message to the AI buddy */
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage.trim(),
      timestamp: new Date(),
    };

    // Add user message
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Add loading placeholder
    const loadingId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }]);

    try {
      // Build message history for AI
      const systemPrompt = buildSystemPrompt(context, language);
      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        // Include last 10 messages for context
        ...messages.slice(-10).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userMessage.trim() },
      ];

      const response = await provider.chat(chatMessages, context as HealthContext);

      // Replace loading message with actual response
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: response.content, isLoading: false }
          : m
      ));
      setIsConnected(true);
    } catch (error) {
      // Replace loading message with error
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? {
              ...m,
              content: language === 'de'
                ? `Verbindungsfehler: ${errorMsg}. Läuft Ollama? (ollama serve)`
                : `Connection error: ${errorMsg}. Is Ollama running? (ollama serve)`,
              isLoading: false,
              isError: true,
            }
          : m
      ));
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, context, language, provider]);

  /** Clear all messages */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    clearMessages,
    checkConnection,
    providerName: provider.getName(),
  };
}
