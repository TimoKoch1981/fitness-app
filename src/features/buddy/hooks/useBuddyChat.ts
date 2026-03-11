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
import { routeAndExecuteStream, detectIntent } from '../../../lib/ai/agents/router';
import { getAgent } from '../../../lib/ai/agents';
import { parseAllActionsFromResponse, stripActionBlock } from '../../../lib/ai/actions/actionParser';
import { useBuddyChatMessages } from '../../../app/providers/BuddyChatProvider';
import { useLogAiUsage } from '../../admin/hooks/useAiUsageLog';
import { lookupProduct } from '../../../lib/ai/actions/productLookup';
import {
  loadPersistentContext,
  extractFromUserMessage,
  extractFromAgentResponse,
  saveContextNotes,
  cleanupExpiredNotes,
} from '../../../lib/ai/contextExtractor';
import { resetTourState } from '../../../shared/hooks/useGuidedTour';
import { useChatHistory } from './useChatHistory';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { AgentContext, AgentType, CommunicationStyle } from '../../../lib/ai/agents/types';
import type { ParsedAction } from '../../../lib/ai/actions/types';
import { extractActionRequest, stripActionRequest, executeSystemAgent, providerSupportsTools } from '../../../lib/ai/agents/systemAgent';
import type { ActionType } from '../../../lib/ai/actions/types';
import { validateAction } from '../../../lib/ai/actions/schemas';
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
  language?: string;
  communicationStyle?: CommunicationStyle;
}

export function useBuddyChat({ context, language = 'de', communicationStyle }: UseBuddyChatOptions = {}) {
  // Messages live in BuddyChatProvider context (survives route changes + page refresh)
  const { messages, setMessages, clearMessages, activeThread, setActiveThread, threads } = useBuddyChatMessages();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const logAiUsage = useLogAiUsage();
  const { user } = useAuth();
  const { saveUserMessage, saveAssistantMessage } = useChatHistory();

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

    // Safety timeout: reset isLoading after 90s max (prevents stuck UI)
    const safetyTimeout = setTimeout(() => {
      if (isLoadingRef.current) {
        console.warn('[BuddyChat] Safety timeout: resetting isLoading after 90s');
        setIsLoading(false);
      }
    }, 90_000);

    // Persist user message to DB (fire-and-forget)
    if (user?.id) {
      saveUserMessage(user.id, activeThread, userMsg).catch(() => {});
    }

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
      // Load persistent context from previous sessions (fire-and-forget on failure)
      let persistedCtx: string | null = null;
      if (user?.id) {
        try {
          persistedCtx = await loadPersistentContext(user.id, activeThread, language as 'de' | 'en');
        } catch {
          // Non-critical — continue without persistent context
        }
      }

      // Build agent context from health data + conversation history
      const agentContext: AgentContext = {
        healthContext: context ?? {},
        conversationHistory: messagesRef.current.slice(-8).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.rawContent ?? m.content, // Use raw content (incl. ACTION blocks) so agent knows what was already done
        })),
        language,
        communicationStyle,
        persistentContext: persistedCtx,
      };

      // Context with user message appended (needed for direct agent calls)
      const fullContext: AgentContext = {
        ...agentContext,
        conversationHistory: [
          ...agentContext.conversationHistory,
          { role: 'user', content: userMessage.trim() },
        ],
      };

      // Track timing for usage logging
      const startTime = Date.now();

      // Route to the best agent and STREAM the response
      // If a specific agent thread is active (not 'general'), bypass the router
      // and go directly to that agent. 'general' still uses auto-routing.
      const onChunk = (partialContent: string) => {
        setMessages(prev => prev.map(m =>
          m.id === streamId
            ? { ...m, content: partialContent, isLoading: false }
            : m
        ));
      };

      // Smart routing: even on a specific thread, check if the message belongs to a different agent.
      // If the router detects a different agent with high confidence, use that instead.
      // This prevents the Substance Agent from answering training questions (and vice versa).
      let agentToUse = activeThread;
      if (activeThread !== 'general') {
        const routerHint = detectIntent(userMessage.trim());
        if (routerHint.targetAgent !== activeThread
          && routerHint.targetAgent !== 'general'
          && routerHint.confidence > 0.3) {
          console.log(`[BuddyChat] Thread ${activeThread} but router says ${routerHint.targetAgent} (${routerHint.confidence.toFixed(2)}) — switching agent`);
          agentToUse = routerHint.targetAgent;
        }
      }

      const result = agentToUse !== 'general'
        ? await getAgent(agentToUse).executeStream(fullContext, onChunk)
        : await routeAndExecuteStream(
            userMessage.trim(),
            agentContext,
            onChunk,
          );

      const durationMs = Date.now() - startTime;

      // Log AI usage (fire-and-forget)
      logAiUsage({
        agentType: result.agentType,
        model: result.model ?? 'unknown',
        tokensTotal: result.tokensUsed,
        durationMs,
      });

      // Stream finished — parse actions from final content
      let parsedActions: ParsedAction[] = [];
      let fcErrorMessage: string | undefined;

      // Path 1: Function Calling via System Agent (OpenAI/Supabase only)
      const provider = getAIProvider();
      if (providerSupportsTools(provider)) {
        const actionRequests = extractActionRequest(result.content);
        if (actionRequests) {
          console.log(`[BuddyChat] FC path: ${actionRequests.length} action_request(s) found, calling System Agent...`);
          const fcResult = await executeSystemAgent(actionRequests, provider, language);
          if (fcResult.success && fcResult.actions) {
            parsedActions = fcResult.actions;
            console.log(`[BuddyChat] FC path: ${parsedActions.length} validated action(s)`);
          } else if (fcResult.error) {
            console.warn(`[BuddyChat] FC path failed: ${fcResult.error}`, fcResult.details);
            fcErrorMessage = fcResult.userMessage;
            // Fall through to legacy regex path
          }
        }
      }

      // Path 2a: Non-FC provider with ACTION_REQUEST blocks (Ollama direct JSON parse)
      if (parsedActions.length === 0 && !providerSupportsTools(getAIProvider())) {
        const actionRequests = extractActionRequest(result.content);
        if (actionRequests) {
          for (const req of actionRequests) {
            try {
              const data = JSON.parse(req.description);
              const validation = validateAction(req.type as ActionType, data);
              if (validation.success) {
                parsedActions.push({ type: req.type as ActionType, data: validation.data, rawJson: req.description });
              }
            } catch { /* JSON parse failed — fallback to regex */ }
          }
          if (parsedActions.length > 0) {
            console.log(`[BuddyChat] Non-FC path: ${parsedActions.length} actions from ACTION_REQUEST blocks`);
          }
        }
      }

      // Path 2: Legacy regex fallback (Ollama, transition period, FC failure)
      if (parsedActions.length === 0) {
        parsedActions = parseAllActionsFromResponse(result.content);
      }

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
          const extractedQuery = searchPhraseMatch[1].trim().replace(/["""„….]+$/, '');
          console.warn(`[BuddyChat] No ACTION block found, but search phrase detected: "${extractedQuery}"`);
          parsedActions = [{ type: 'search_product', data: { query: extractedQuery }, rawJson: `{"query":"${extractedQuery}"}` }];
        }
      }

      // Fallback: detect tour restart from text if no ACTION block was generated
      if (parsedActions.length === 0 || !parsedActions.some(a => a.type === 'restart_tour')) {
        const tourTextMatch = /(?:Produkttour|Tour|Guided Tour|starte.*Tour|Tour.*start)/i.test(result.content)
          && /(?:starte|start|los|weitergeleit|redirect)/i.test(result.content);
        if (tourTextMatch) {
          console.warn('[BuddyChat] No ACTION:restart_tour block, but tour-related text detected — injecting action');
          parsedActions.push({ type: 'restart_tour', data: {}, rawJson: '{}' });
        }
      }

      // Fallback: detect log_body from text if LLM claims to have saved weight but no ACTION block
      if (parsedActions.length === 0) {
        const bodyTextMatch = /(?:Gewicht|weight|Körpergewicht|body\s*weight).*?(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:kg|kilogramm)/i.test(result.content)
          || /(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:kg|kilogramm).*?(?:eintrag|eingetragen|gespeichert|aktualisier|notier|sav|record|updat|log)/i.test(result.content);
        if (bodyTextMatch) {
          // Extract weight value
          const weightMatch = result.content.match(/(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:kg|kilogramm)/i);
          if (weightMatch) {
            const weightKg = parseFloat(weightMatch[1].replace(',', '.'));
            if (weightKg >= 30 && weightKg <= 300) {
              console.warn(`[BuddyChat] No ACTION:log_body block, but weight text detected: ${weightKg} kg — injecting action`);
              const today = new Date().toISOString().split('T')[0];
              parsedActions = [{ type: 'log_body', data: { weight_kg: weightKg, date: today }, rawJson: JSON.stringify({ weight_kg: weightKg, date: today }) }];
            }
          }
        }
      }

      // Check for auto-execute actions
      const searchActions = parsedActions.filter(a => a.type === 'search_product');
      const tourActions = parsedActions.filter(a => a.type === 'restart_tour');
      const regularActions = parsedActions.filter(a => a.type !== 'search_product' && a.type !== 'restart_tour');

      // Auto-execute restart_tour (no user confirmation needed)
      if (tourActions.length > 0) {
        resetTourState();
        // Navigate to cockpit after a short delay so the user sees the buddy's message
        setTimeout(() => { window.location.href = '/cockpit'; }, 1500);
      }

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
          communicationStyle,
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

        // Parse actions from follow-up (FC → Non-FC → Legacy regex)
        let followUpActions: ParsedAction[] = [];
        if (providerSupportsTools(getAIProvider())) {
          const followUpRequests = extractActionRequest(followUpResult.content);
          if (followUpRequests) {
            const fcFollowUp = await executeSystemAgent(followUpRequests, getAIProvider(), language);
            if (fcFollowUp.success && fcFollowUp.actions) {
              followUpActions = fcFollowUp.actions;
            }
          }
        }
        if (followUpActions.length === 0) {
          followUpActions = parseAllActionsFromResponse(followUpResult.content);
        }
        const followUpClean = followUpActions.length > 0
          ? stripActionRequest(stripActionBlock(followUpResult.content))
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

        // Persist assistant message to DB (fire-and-forget)
        if (user?.id) {
          saveAssistantMessage(user.id, followUpResult.agentType as AgentType ?? activeThread, {
            id: streamId,
            role: 'assistant',
            content: followUpClean,
            rawContent: followUpResult.content,
            timestamp: new Date(),
            agentType: followUpResult.agentType,
            agentName: followUpResult.agentName,
            agentIcon: followUpResult.agentIcon,
            skillVersions: followUpResult.skillVersions,
          }).catch(() => {});
        }
      } else {
        // Normal flow — no search_product, just show the response
        const cleanContent = regularActions.length > 0
          ? stripActionRequest(stripActionBlock(result.content))
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

        // Show FC error to user (no silent failure!)
        if (fcErrorMessage) {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `\u26A0\uFE0F ${fcErrorMessage}`,
            timestamp: new Date(),
            agentIcon: '\u26A0\uFE0F',
            isError: true,
          }]);
        }
        // Persist assistant message to DB (fire-and-forget)
        if (user?.id) {
          saveAssistantMessage(user.id, (result.agentType as AgentType) ?? activeThread, {
            id: streamId,
            role: 'assistant',
            content: cleanContent,
            rawContent: result.content,
            timestamp: new Date(),
            agentType: result.agentType,
            agentName: result.agentName,
            agentIcon: result.agentIcon,
            skillVersions: result.skillVersions,
          }).catch(() => {});
        }
      }

      // Extract and persist context from this conversation turn (fire-and-forget)
      if (user?.id) {
        try {
          const lang = language as 'de' | 'en';
          const agentType = result.agentType ?? activeThread;
          const userNotes = extractFromUserMessage(userMessage.trim(), lang, agentType);
          const agentNotes = extractFromAgentResponse(
            result.content,
            lang,
            agentType,
          );
          const allNotes = [...userNotes, ...agentNotes];
          if (allNotes.length > 0) {
            saveContextNotes(user.id, allNotes); // fire-and-forget
          }
          // Cleanup expired notes occasionally (1 in 10 chance)
          if (Math.random() < 0.1) {
            cleanupExpiredNotes(user.id); // fire-and-forget
          }
        } catch {
          // Non-critical
        }
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
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  }, [context, language, user?.id, activeThread]);

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
    // Thread management
    activeThread,
    setActiveThread,
    threads,
  };
}
