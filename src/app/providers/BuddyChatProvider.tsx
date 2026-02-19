/**
 * BuddyChatProvider — persists chat messages across route changes.
 *
 * Problem: `useState` in `useBuddyChat` was destroyed on route change
 * (BuddyPage unmounts when navigating to Dashboard/Meals/etc.).
 *
 * Solution: Hold messages in a React Context at App level + backup
 * to sessionStorage so messages survive even full page refreshes.
 *
 * The hook `useBuddyChat` reads/writes via this context instead of local state.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { DisplayMessage } from '../../features/buddy/hooks/useBuddyChat';

const STORAGE_KEY = 'fitbuddy_chat_messages';

interface BuddyChatContextType {
  messages: DisplayMessage[];
  setMessages: React.Dispatch<React.SetStateAction<DisplayMessage[]>>;
  clearMessages: () => void;
}

const BuddyChatContext = createContext<BuddyChatContextType | null>(null);

/** Load messages from sessionStorage (if any) */
function loadFromStorage(): DisplayMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Validate: must be an array (corrupt data → crash without this check)
    if (!Array.isArray(parsed)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return parsed.map((m: Record<string, unknown>) => {
      // Validate timestamp — Invalid Date would break sorting/display
      const ts = new Date(m.timestamp as string);
      const validTs = isNaN(ts.getTime()) ? new Date() : ts;
      return {
        ...m,
        timestamp: validTs,
        // Clear transient flags that shouldn't survive a refresh
        isLoading: false,
        isStreaming: false,
        pendingActions: undefined,
      };
    }) as DisplayMessage[];
  } catch {
    // Corrupt data → remove and start fresh
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return [];
  }
}

/** Save messages to sessionStorage (debounced via caller) */
function saveToStorage(messages: DisplayMessage[]): void {
  try {
    // Only persist finalized messages (not loading/streaming placeholders)
    const toSave = messages.filter(m => !m.isLoading && !m.isStreaming);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

export function BuddyChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<DisplayMessage[]>(loadFromStorage);

  // Persist to sessionStorage whenever messages change (skip transient updates)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Debounce: save 300ms after last change (avoids saving during every streaming chunk)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToStorage(messages);
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <BuddyChatContext.Provider value={{ messages, setMessages, clearMessages }}>
      {children}
    </BuddyChatContext.Provider>
  );
}

/** Graceful fallback — prevents white-screen crash if provider is missing */
const FALLBACK: BuddyChatContextType = {
  messages: [],
  setMessages: () => {},
  clearMessages: () => {},
};

/** Hook to access chat messages from context */
export function useBuddyChatMessages() {
  const ctx = useContext(BuddyChatContext);
  if (!ctx) {
    console.error('useBuddyChatMessages: BuddyChatProvider not found — using empty fallback');
    return FALLBACK;
  }
  return ctx;
}
