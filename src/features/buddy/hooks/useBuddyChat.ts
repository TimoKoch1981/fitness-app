/**
 * Chat hook for the FitBuddy Multi-Agent AI system.
 *
 * Routes user messages through the Agent Router, which selects the
 * appropriate specialist agent (Nutrition, Training, Substance, Analysis, General).
 * Each agent loads only its required skills for token-efficient responses.
 *
 * @see lib/ai/agents/router.ts — Intent detection + dispatch
 */

import { useState, useCallback } from 'react';
import { getAIProvider } from '../../../lib/ai/provider';
import { routeAndExecute } from '../../../lib/ai/agents/router';
import type { AgentContext } from '../../../lib/ai/agents/types';
import type { HealthContext } from '../../../types/health';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  // Agent attribution (filled by specialist agents)
  agentType?: string;
  agentName?: string;
  agentIcon?: string;
  skillVersions?: Record<string, string>;
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

  /** Send a message to the AI buddy via the agent router */
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
      // Build agent context from health data + conversation history
      const agentContext: AgentContext = {
        healthContext: context ?? {},
        conversationHistory: messages.slice(-8).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        language,
      };

      // Route to the best agent and get response
      const result = await routeAndExecute(userMessage.trim(), agentContext);

      // Replace loading message with actual response + agent attribution
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? {
              ...m,
              content: result.content,
              isLoading: false,
              agentType: result.agentType,
              agentName: result.agentName,
              agentIcon: result.agentIcon,
              skillVersions: result.skillVersions,
            }
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
  }, [messages, isLoading, context, language]);

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
