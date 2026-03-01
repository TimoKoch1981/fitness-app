/**
 * useChatHistory — Persistent chat history backed by Supabase.
 *
 * Enables cross-session conversation memory for the KI-Buddy.
 * Messages are saved to buddy_chat_messages after each conversation turn
 * and loaded on session init to hydrate the BuddyChatProvider.
 *
 * Design: Async, fire-and-forget saves. DB is source of truth across sessions.
 * sessionStorage remains the fast local cache for within-session use.
 */

import { useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import type { DisplayMessage } from './useBuddyChat';
import type { AgentType } from '../../../lib/ai/agents/types';

const MAX_MESSAGES_FROM_DB = 30; // per thread

interface ChatMessageRow {
  id: string;
  user_id: string;
  agent_type: string;
  role: 'user' | 'assistant';
  content: string;
  raw_content: string | null;
  agent_name: string | null;
  agent_icon: string | null;
  skill_versions: Record<string, string> | null;
  created_at: string;
}

/**
 * Convert a DB row to a DisplayMessage for the UI.
 */
function rowToDisplayMessage(row: ChatMessageRow): DisplayMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    rawContent: row.raw_content ?? undefined,
    timestamp: new Date(row.created_at),
    agentType: row.agent_type,
    agentName: row.agent_name ?? undefined,
    agentIcon: row.agent_icon ?? undefined,
    skillVersions: row.skill_versions ?? undefined,
    isLoading: false,
    isStreaming: false,
  };
}

export function useChatHistory() {
  // Track which threads have been loaded from DB (avoid duplicate loads)
  const loadedThreadsRef = useRef<Set<string>>(new Set());

  /**
   * Load chat history for a specific agent thread from the database.
   * Returns an array of DisplayMessages sorted by created_at ASC.
   */
  const loadChatHistory = useCallback(async (
    userId: string,
    agentType: AgentType,
  ): Promise<DisplayMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('buddy_chat_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('agent_type', agentType)
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES_FROM_DB);

      if (error) {
        console.warn('[ChatHistory] Failed to load:', error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Reverse to get chronological order (oldest first)
      return (data as ChatMessageRow[]).reverse().map(rowToDisplayMessage);
    } catch (err) {
      console.warn('[ChatHistory] Load error:', err);
      return [];
    }
  }, []);

  /**
   * Load chat history for ALL agent threads at once.
   * Used on initial session hydration.
   */
  const loadAllThreadHistory = useCallback(async (
    userId: string,
  ): Promise<Record<AgentType, DisplayMessage[]>> => {
    try {
      // Query all messages for the user, limited to recent ones
      const { data, error } = await supabase
        .from('buddy_chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES_FROM_DB * 8); // Up to 30 per thread × 8 threads

      if (error) {
        console.warn('[ChatHistory] Failed to load all threads:', error.message);
        return {} as Record<AgentType, DisplayMessage[]>;
      }

      if (!data || data.length === 0) return {} as Record<AgentType, DisplayMessage[]>;

      // Group by agent_type
      const grouped: Record<string, DisplayMessage[]> = {};
      for (const row of (data as ChatMessageRow[]).reverse()) {
        const agent = row.agent_type as AgentType;
        if (!grouped[agent]) grouped[agent] = [];
        if (grouped[agent].length < MAX_MESSAGES_FROM_DB) {
          grouped[agent].push(rowToDisplayMessage(row));
        }
      }

      // Mark all threads as loaded
      for (const agent of Object.keys(grouped)) {
        loadedThreadsRef.current.add(agent);
      }

      return grouped as Record<AgentType, DisplayMessage[]>;
    } catch (err) {
      console.warn('[ChatHistory] Load all error:', err);
      return {} as Record<AgentType, DisplayMessage[]>;
    }
  }, []);

  /**
   * Save a user message to the database (fire-and-forget).
   */
  const saveUserMessage = useCallback(async (
    userId: string,
    agentType: AgentType,
    message: DisplayMessage,
  ): Promise<void> => {
    try {
      await supabase.from('buddy_chat_messages').insert({
        id: message.id,
        user_id: userId,
        agent_type: agentType,
        role: 'user',
        content: message.content,
        raw_content: null,
        agent_name: null,
        agent_icon: null,
        skill_versions: null,
      });
    } catch (err) {
      console.warn('[ChatHistory] Save user message error:', err);
    }
  }, []);

  /**
   * Save an assistant message to the database (fire-and-forget).
   */
  const saveAssistantMessage = useCallback(async (
    userId: string,
    agentType: AgentType,
    message: DisplayMessage,
  ): Promise<void> => {
    try {
      await supabase.from('buddy_chat_messages').insert({
        id: message.id,
        user_id: userId,
        agent_type: agentType,
        role: 'assistant',
        content: message.content,
        raw_content: message.rawContent ?? null,
        agent_name: message.agentName ?? null,
        agent_icon: message.agentIcon ?? null,
        skill_versions: message.skillVersions ?? null,
      });
    } catch (err) {
      console.warn('[ChatHistory] Save assistant message error:', err);
    }
  }, []);

  /**
   * Check if a thread has already been loaded from DB this session.
   */
  const isThreadLoaded = useCallback((agentType: AgentType): boolean => {
    return loadedThreadsRef.current.has(agentType);
  }, []);

  /**
   * Mark a thread as loaded (e.g., after hydration).
   */
  const markThreadLoaded = useCallback((agentType: AgentType): void => {
    loadedThreadsRef.current.add(agentType);
  }, []);

  /**
   * Delete all chat messages for a user (e.g., on account deletion).
   */
  const deleteAllMessages = useCallback(async (userId: string): Promise<void> => {
    try {
      await supabase
        .from('buddy_chat_messages')
        .delete()
        .eq('user_id', userId);
    } catch (err) {
      console.warn('[ChatHistory] Delete all error:', err);
    }
  }, []);

  return {
    loadChatHistory,
    loadAllThreadHistory,
    saveUserMessage,
    saveAssistantMessage,
    isThreadLoaded,
    markThreadLoaded,
    deleteAllMessages,
  };
}
