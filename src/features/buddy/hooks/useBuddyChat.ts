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
import { parseAllActionsFromResponse, stripActionBlock } from '../../../lib/ai/actions/actionParser';
import { useBuddyChatMessages } from '../../../app/providers/BuddyChatProvider';
import { useLogAiUsage } from '../../admin/hooks/useAiUsageLog';
import { lookupProduct } from '../../../lib/ai/actions/productLookup';
import type { AgentContext } from '../../../lib/ai/agents/types';
import type { ParsedAction } from '../../../lib/ai/actions/types';
import type { HealthContext } from '../../../types/health';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Raw LLM output including ACTION blocks — used for conversation history so
   *  the agent knows what actions were already taken. Display uses `content`. */
  rawContent?: string;
  timestamp: Date;
  isLoading?: boolean;
  isStreaming?: boolean;
  isError?: boolean;
  // Agent attribution (filled by specialist agents)
  agentType?: string;
  agentName?: string;
  agentIcon?: string;
  skillVersions?: Record<string, string>;
  // Parsed actions from this message (if any — supports multiple per message)
  pendingActions?: ParsedAction[];
}

interface UseBuddyChatOptions {
  context?: Partial<HealthContext>;
  language?: 'de' | 'en';
}

export function useBuddyChat({ context, language = 'de' }: UseBuddyChatOptions = {}) {
  // Messages live in BuddyChatProvider context (survives route changes + page refresh)
  const { messages, setMessages, clearMessages } = useBuddyChatMessages();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const logAiUsage = useLogAiUsage();

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
          content: m.rawContent ?? m.content, // Use raw content (incl. ACTION blocks) so agent knows what was already done
        })),
        language,
      };

      // Track timing for usage logging
      const startTime = Date.now();

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

      const durationMs = Date.now() - startTime;

      // Log AI usage (fire-and-forget)
      logAiUsage({
        agentType: result.agentType,
        model: result.model ?? 'unknown',
        tokensTotal: result.tokensUsed,
        durationMs,
      });

      // Stream finished — parse ALL ACTION blocks from final content
      let parsedActions = parseAllActionsFromResponse(result.content);

      // Fallback: If the LLM said "Ich suche die Nährwerte für..." but the ACTION block
      // wasn't parsed (e.g. formatting issues), try to extract the query from the text
      if (parsedActions.length === 0 && /ACTION:search_product/i.test(result.content)) {
        console.warn(`[BuddyChat] ACTION:search_product found in text but not parsed! Trying JSON extraction...`);
        const jsonMatch = result.content.match(/\{[^}]*"query"\s*:\s*"([^"]+)"[^}]*\}/);
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[0]);
            parsedActions = [{ type: 'search_product', data, rawJson: jsonMatch[0] }];
            console.log(`[BuddyChat] Fallback extraction successful: query="${data.query}"`);
          } catch { /* ignore parse errors */ }
        }
      }

      // Second fallback: If the LLM says "Ich suche die Nährwerte für X" without any ACTION block
      if (parsedActions.length === 0) {
        const searchPhraseMatch = result.content.match(/(?:Ich suche|suche ich|recherchiere).*?(?:für|nach)\s+["""„]?(.+?)[""""]?\s*(?:\.\.\.|…|$)/i);
        if (searchPhraseMatch && searchPhraseMatch[1]?.length > 3) {
          const extractedQuery = searchPhraseMatch[1].trim().replace(/["""„…\.]+$/, '');
          console.warn(`[BuddyChat] No ACTION block found, but search phrase detected: "${extractedQuery}"`);
          parsedActions = [{ type: 'search_product', data: { query: extractedQuery }, rawJson: `{"query":"${extractedQuery}"}` }];
        }
      }

      // Check for search_product actions — auto-execute them and do a follow-up call
      const searchActions = parsedActions.filter(a => a.type === 'search_product');
      const regularActions = parsedActions.filter(a => a.type !== 'search_product');

      if (parsedActions.length > 0) {
        console.log(`[BuddyChat] Parsed actions: ${parsedActions.map(a => a.type).join(', ')}. search_product: ${searchActions.length}`);
      }

      if (searchActions.length > 0) {
        // Phase 1: Show "searching..." status
        const query = searchActions[0].data.query as string;
        const mealType = searchActions[0].data.meal_type as string | undefined;
        const portionG = searchActions[0].data.portion_g as number | undefined;

        console.log(`[BuddyChat] Phase 1: Showing search UI for "${query}"`);
        setMessages(prev => prev.map(m =>
          m.id === streamId
            ? {
                ...m,
                content: `🔍 Recherchiere "${query}"...`,
                isLoading: true,
                isStreaming: false,
                agentIcon: '🔍',
              }
            : m
        ));

        // Phase 2: Execute product lookup (OFF → Web Search fallback)
        console.log(`[BuddyChat] Phase 2: Starting lookupProduct("${query}")...`);
        const lookupResult = await lookupProduct(query);
        console.log(`[BuddyChat] Phase 2 done: found=${lookupResult.found}, source=${lookupResult.source}, summary=${lookupResult.summary.slice(0, 100)}...`);

        // Phase 3: Feed result back to the agent as a follow-up
        const followUpContext: AgentContext = {
          healthContext: context ?? {},
          conversationHistory: [
            ...messagesRef.current.slice(-6).map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            // Inject lookup result as system context
            {
              role: 'user' as const,
              content: userMessage.trim(),
            },
            {
              role: 'assistant' as const,
              content: stripActionBlock(result.content),
            },
            {
              role: 'user' as const,
              content: `[SYSTEM: Produkt-Recherche Ergebnis für "${query}"]\n${lookupResult.summary}\n${portionG ? `\nDer Nutzer hat ca. ${portionG}g angegeben.` : ''}${mealType ? `\nMahlzeit-Typ: ${mealType}` : ''}\n\nVerarbeite dieses Ergebnis jetzt: Erstelle ACTION:save_product mit den recherchierten Werten und ACTION:log_meal für die Mahlzeit. Zeige dem Nutzer die Nährwerte und den Tages-Stand.`,
            },
          ],
          language,
        };

        // Stream the follow-up response
        console.log(`[BuddyChat] Phase 3: Starting follow-up LLM call...`);
        const followUpResult = await routeAndExecuteStream(
          `[Produkt-Recherche Ergebnis verarbeiten]`,
          followUpContext,
          (partialContent: string) => {
            setMessages(prev => prev.map(m =>
              m.id === streamId
                ? { ...m, content: partialContent, isLoading: false, isStreaming: true }
                : m
            ));
          },
        );
        console.log(`[BuddyChat] Phase 3 done: agent=${followUpResult.agentType}, content=${followUpResult.content.slice(0, 100)}...`);

        // Log second call usage
        const followUpDuration = Date.now() - startTime;
        logAiUsage({
          agentType: followUpResult.agentType,
          model: followUpResult.model ?? 'unknown',
          tokensTotal: (result.tokensUsed ?? 0) + (followUpResult.tokensUsed ?? 0),
          durationMs: followUpDuration,
        });

        // Parse actions from follow-up
        const followUpActions = parseAllActionsFromResponse(followUpResult.content);
        const followUpClean = followUpActions.length > 0
          ? stripActionBlock(followUpResult.content)
          : followUpResult.content;

        setMessages(prev => prev.map(m =>
          m.id === streamId
            ? {
                ...m,
                content: followUpClean,
                rawContent: followUpResult.content,
                isLoading: false,
                isStreaming: false,
                agentType: followUpResult.agentType,
                agentName: followUpResult.agentName,
                agentIcon: followUpResult.agentIcon,
                skillVersions: followUpResult.skillVersions,
                pendingActions: followUpActions.length > 0 ? followUpActions : undefined,
              }
            : m
        ));
      } else {
        // Normal flow — no search_product, just show the response
        const cleanContent = regularActions.length > 0
          ? stripActionBlock(result.content)
          : result.content;

        // Finalize the message: remove streaming flag, add agent attribution
        // Keep rawContent with ACTION blocks so the agent can see its past actions
        setMessages(prev => prev.map(m =>
          m.id === streamId
            ? {
                ...m,
                content: cleanContent,
                rawContent: result.content, // Full content incl. ACTION blocks
                isLoading: false,
                isStreaming: false,
                agentType: result.agentType,
                agentName: result.agentName,
                agentIcon: result.agentIcon,
                skillVersions: result.skillVersions,
                pendingActions: regularActions.length > 0 ? regularActions : undefined,
              }
            : m
        ));
      }

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

  /** Clear the pending actions from a specific message (after execution/rejection) */
  const clearAction = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, pendingActions: undefined } : m
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
