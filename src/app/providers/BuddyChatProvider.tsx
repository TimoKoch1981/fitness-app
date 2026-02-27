/**
 * BuddyChatProvider — persists per-agent chat threads across route changes.
 *
 * Each of the 8 agents (nutrition, training, substance, analysis, beauty,
 * lifestyle, medical, general) gets its own message thread.
 * The active thread determines which messages are displayed and which
 * agent receives new messages.
 *
 * Backed by sessionStorage so threads survive full page refreshes.
 * Migration from the old single-array format is handled transparently.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react';
import type { DisplayMessage } from '../../features/buddy/hooks/useBuddyChat';
import type { AgentType } from '../../lib/ai/agents/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THREADS_STORAGE_KEY = 'fitbuddy_chat_threads';
const ACTIVE_THREAD_KEY = 'fitbuddy_chat_active_thread';
const OLD_STORAGE_KEY = 'fitbuddy_chat_messages'; // legacy single-array key
const MAX_MESSAGES_PER_THREAD = 50;

const ALL_AGENT_TYPES: AgentType[] = [
  'general', 'nutrition', 'training', 'substance',
  'analysis', 'beauty', 'lifestyle', 'medical',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThreadMessages = Record<AgentType, DisplayMessage[]>;

interface BuddyChatContextType {
  /** All threads (per-agent message arrays) */
  threads: ThreadMessages;
  /** Currently active agent thread */
  activeThread: AgentType;
  /** Switch the active thread */
  setActiveThread: (agent: AgentType) => void;
  /** Messages for the active thread (shorthand for threads[activeThread]) */
  messages: DisplayMessage[];
  /** Update messages for the active thread only */
  setMessages: React.Dispatch<React.SetStateAction<DisplayMessage[]>>;
  /** Clear messages in the active thread only */
  clearMessages: () => void;
  /** Clear all threads */
  clearAllThreads: () => void;
}

const BuddyChatContext = createContext<BuddyChatContextType | null>(null);

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function createEmptyThreads(): ThreadMessages {
  return {
    general: [], nutrition: [], training: [], substance: [],
    analysis: [], beauty: [], lifestyle: [], medical: [],
  };
}

/** Sanitize a single message loaded from storage */
function sanitizeMessage(m: Record<string, unknown>): DisplayMessage {
  const ts = new Date(m.timestamp as string);
  const validTs = isNaN(ts.getTime()) ? new Date() : ts;
  return {
    ...m,
    timestamp: validTs,
    isLoading: false,
    isStreaming: false,
    pendingActions: undefined,
  } as DisplayMessage;
}

/** Migrate old single-array messages into per-agent threads */
function migrateOldMessages(oldMessages: DisplayMessage[]): ThreadMessages {
  const threads = createEmptyThreads();

  for (let i = 0; i < oldMessages.length; i++) {
    const msg = sanitizeMessage(oldMessages[i] as unknown as Record<string, unknown>);

    if (msg.role === 'user') {
      // Look ahead: which agent responded?
      const nextMsg = oldMessages[i + 1];
      const threadKey = (nextMsg?.agentType as AgentType) || 'general';
      const validKey = ALL_AGENT_TYPES.includes(threadKey) ? threadKey : 'general';
      threads[validKey].push(msg);
    } else {
      const threadKey = (msg.agentType as AgentType) || 'general';
      const validKey = ALL_AGENT_TYPES.includes(threadKey) ? threadKey : 'general';
      threads[validKey].push(msg);
    }
  }

  return threads;
}

/** Load threads from sessionStorage (with migration from old format) */
function loadThreadsFromStorage(): ThreadMessages {
  try {
    // 1. Try new per-thread format
    const raw = sessionStorage.getItem(THREADS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const threads = createEmptyThreads();
        for (const agentType of ALL_AGENT_TYPES) {
          if (Array.isArray(parsed[agentType])) {
            threads[agentType] = parsed[agentType].map(
              (m: Record<string, unknown>) => sanitizeMessage(m)
            );
          }
        }
        return threads;
      }
    }

    // 2. Try migrating from old single-array format
    const oldRaw = sessionStorage.getItem(OLD_STORAGE_KEY);
    if (oldRaw) {
      const oldMessages = JSON.parse(oldRaw);
      if (Array.isArray(oldMessages)) {
        const threads = migrateOldMessages(oldMessages as DisplayMessage[]);
        // Clean up old key
        sessionStorage.removeItem(OLD_STORAGE_KEY);
        return threads;
      }
    }

    // 3. Fresh start
    return createEmptyThreads();
  } catch {
    try { sessionStorage.removeItem(THREADS_STORAGE_KEY); } catch { /* ignore */ }
    try { sessionStorage.removeItem(OLD_STORAGE_KEY); } catch { /* ignore */ }
    return createEmptyThreads();
  }
}

/** Load active thread from sessionStorage */
function loadActiveThreadFromStorage(): AgentType {
  try {
    const raw = sessionStorage.getItem(ACTIVE_THREAD_KEY);
    if (raw && ALL_AGENT_TYPES.includes(raw as AgentType)) {
      return raw as AgentType;
    }
  } catch { /* ignore */ }
  return 'general';
}

/** Save threads to sessionStorage (with message limit per thread) */
function saveThreadsToStorage(threads: ThreadMessages): void {
  try {
    const toSave: Record<string, DisplayMessage[]> = {};
    for (const agentType of ALL_AGENT_TYPES) {
      const msgs = threads[agentType]
        .filter(m => !m.isLoading && !m.isStreaming)
        .slice(-MAX_MESSAGES_PER_THREAD); // keep only last N
      toSave[agentType] = msgs;
    }
    sessionStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // sessionStorage full or unavailable
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function BuddyChatProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<ThreadMessages>(loadThreadsFromStorage);
  const [activeThread, setActiveThreadState] = useState<AgentType>(loadActiveThreadFromStorage);

  // Derived: messages for the active thread
  const messages = useMemo(() => threads[activeThread], [threads, activeThread]);

  // Persist active thread to sessionStorage
  const setActiveThread = useCallback((agent: AgentType) => {
    setActiveThreadState(agent);
    try { sessionStorage.setItem(ACTIVE_THREAD_KEY, agent); } catch { /* ignore */ }
  }, []);

  // setMessages that only updates the active thread — kept compatible with React.Dispatch<SetStateAction>
  const setMessages: React.Dispatch<React.SetStateAction<DisplayMessage[]>> = useCallback(
    (action: React.SetStateAction<DisplayMessage[]>) => {
      setThreads(prev => {
        const currentMessages = prev[activeThread];
        const newMessages = typeof action === 'function' ? action(currentMessages) : action;
        if (newMessages === currentMessages) return prev;
        return { ...prev, [activeThread]: newMessages };
      });
    },
    [activeThread]
  );

  // Clear only active thread
  const clearMessages = useCallback(() => {
    setThreads(prev => ({ ...prev, [activeThread]: [] }));
  }, [activeThread]);

  // Clear all threads
  const clearAllThreads = useCallback(() => {
    setThreads(createEmptyThreads());
    try {
      sessionStorage.removeItem(THREADS_STORAGE_KEY);
      sessionStorage.removeItem(ACTIVE_THREAD_KEY);
    } catch { /* ignore */ }
  }, []);

  // Debounced persistence to sessionStorage
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveThreadsToStorage(threads);
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [threads]);

  const contextValue = useMemo(() => ({
    threads,
    activeThread,
    setActiveThread,
    messages,
    setMessages,
    clearMessages,
    clearAllThreads,
  }), [threads, activeThread, setActiveThread, messages, setMessages, clearMessages, clearAllThreads]);

  return (
    <BuddyChatContext.Provider value={contextValue}>
      {children}
    </BuddyChatContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Fallback & Hook
// ---------------------------------------------------------------------------

const FALLBACK: BuddyChatContextType = {
  threads: createEmptyThreads(),
  activeThread: 'general',
  setActiveThread: () => {},
  messages: [],
  setMessages: () => {},
  clearMessages: () => {},
  clearAllThreads: () => {},
};

/** Hook to access chat messages and thread state from context */
export function useBuddyChatMessages() {
  const ctx = useContext(BuddyChatContext);
  if (!ctx) {
    console.error('useBuddyChatMessages: BuddyChatProvider not found — using empty fallback');
    return FALLBACK;
  }
  return ctx;
}
