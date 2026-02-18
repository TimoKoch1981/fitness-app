/**
 * Chat hook for the FitBuddy Multi-Agent AI system.
 *
 * Routes user messages through the Agent Router, which selects the
 * appropriate specialist agent (Nutrition, Training, Substance, Analysis, General).
 * Each agent loads only its required skills for token-efficient responses.
 *
 * Uses STREAMING mode — tokens appear in real-time as Ollama generates them.
 * This prevents the "hanging" feeling of blocking requests (which can take 15-60s).
 *
 * After receiving a response, the hook parses any ACTION blocks from the
 * agent's text and makes them available for execution.
 *
 * @see lib/ai/agents/router.ts — Intent detection + dispatch
 * @see lib/ai/actions/actionParser.ts — ACTION block extraction
 */

import { useState, useCallback, useRef } from 'react';
import { getAIProvider } from '../../../lib/ai/provider';
import { routeAndExecuteStream } from '../../../lib/ai/agents/router';
import { parseActionFromResponse, stripActionBlock } from '../../../lib/ai/actions/actionParser';
import type { AgentContext } from '../../../lib/ai/agents/types';
import type { ParsedAction } from '../../../lib/ai/actions/types';
import type { HealthContext } from '../../../types/health';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isStreaming?: boolean;
  isError?: boolean;
  // Agent attribution (filled by specialist agents)
  agentType?: string;
  agentName?: string;
  agentIcon?: string;
  skillVersions?: Record<string, string>;
  // Parsed action from this message (if any)
  pendingAction?: ParsedAction;
}

interface UseBuddyChatOptions {
  context?: Partial<HealthContext>;
  language?: 'de' | 'en';
}

export function useBuddyChat({ context, language = 'de' }: UseBuddyChatOptions = {}) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Refs to avoid stale closures in sendMessage (#7, #8)
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const provider = getAIProvider();

  /** Check if AI provider is available */
  const checkConnection = useCallback(async () => {
    const available = await provider.isAvailable();
    setIsConnected(available);
    return available;
  }, [provider]);

  /** Send a message to the AI buddy via the agent router (STREAMING) */
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoadingRef.current) return;

    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage.trim(),
      timestamp: new Date(),
    };

    // Add user message
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Add streaming placeholder (shows "thinking..." initially)
    const streamId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: streamId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
      isStreaming: true,
    }]);

    try {
      // Build agent context from health data + conversation history
      const agentContext: AgentContext = {
        healthContext: context ?? {},
        conversationHistory: messagesRef.current.slice(-8).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        language,
      };

      // Route to the best agent and STREAM the response
      const result = await routeAndExecuteStream(
        userMessage.trim(),
        agentContext,
        // onChunk callback — update the message content in real-time
        (partialContent: string) => {
          setMessages(prev => prev.map(m =>
            m.id === streamId
              ? { ...m, content: partialContent, isLoading: false }
              : m
          ));
        },
      );

      // Stream finished — parse ACTION block from final content
      const parsedAction = parseActionFromResponse(result.content);
      const cleanContent = parsedAction
        ? stripActionBlock(result.content)
        : result.content;

      // Finalize the message: remove streaming flag, add agent attribution
      setMessages(prev => prev.map(m =>
        m.id === streamId
          ? {
              ...m,
              content: cleanContent,
              isLoading: false,
              isStreaming: false,
              agentType: result.agentType,
              agentName: result.agentName,
              agentIcon: result.agentIcon,
              skillVersions: result.skillVersions,
              pendingAction: parsedAction ?? undefined,
            }
          : m
      ));
      setIsConnected(true);
    } catch (error) {
      // Replace streaming message with error
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setMessages(prev => prev.map(m =>
        m.id === streamId
          ? {
              ...m,
              content: language === 'de'
                ? `Verbindungsfehler: ${errorMsg}. Läuft Ollama? (ollama serve)`
                : `Connection error: ${errorMsg}. Is Ollama running? (ollama serve)`,
              isLoading: false,
              isStreaming: false,
              isError: true,
            }
          : m
      ));
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [context, language]);

  /** Clear the pending action from a specific message (after execution/rejection) */
  const clearAction = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, pendingAction: undefined } : m
    ));
  }, []);

  /** Add a system/confirmation message (e.g. "✅ Mahlzeit gespeichert!") */
  const addSystemMessage = useCallback((content: string, icon?: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      agentIcon: icon,
    }]);
  }, []);

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
    clearAction,
    addSystemMessage,
    checkConnection,
    providerName: provider.getName(),
  };
}
