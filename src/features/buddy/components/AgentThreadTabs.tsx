/**
 * AgentThreadTabs — horizontal scrollable tab bar for switching agent threads.
 *
 * Renders one tab per agent with emoji icon and short name.
 * Active tab gets a colored underline matching the agent's color scheme.
 * Unread dot shown for threads that have messages but are not active.
 */

import { useRef, useEffect } from 'react';
import { useTranslation } from '../../../i18n';
import { THREAD_TAB_ORDER, getAgentDisplayConfig } from '../../../lib/ai/agents/agentDisplayConfig';
import type { AgentType } from '../../../lib/ai/agents/types';
import type { ThreadMessages } from '../../../app/providers/BuddyChatProvider';

interface AgentThreadTabsProps {
  activeThread: AgentType;
  onSelectThread: (agent: AgentType) => void;
  threads: ThreadMessages;
  /** Compact mode for InlineBuddyChat (smaller padding/text) */
  compact?: boolean;
}

export function AgentThreadTabs({ activeThread, onSelectThread, threads, compact }: AgentThreadTabsProps) {
  const { language } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active tab when it changes
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeThread]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-gray-100"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {THREAD_TAB_ORDER.map((agentType) => {
        const config = getAgentDisplayConfig(agentType);
        const isActive = activeThread === agentType;
        const hasMessages = threads[agentType]?.length > 0;
        const label = language === 'de' ? config.shortName : config.shortNameEN;

        return (
          <button
            key={agentType}
            ref={isActive ? activeTabRef : undefined}
            onClick={() => onSelectThread(agentType)}
            className={`
              flex-shrink-0 flex items-center gap-1 transition-all relative
              ${compact ? 'px-2 py-1.5 text-[10px]' : 'px-2.5 py-2 text-xs'}
              ${isActive
                ? 'text-gray-900 font-semibold'
                : 'text-gray-400 hover:text-gray-600'
              }
            `}
          >
            {/* Agent icon */}
            <span className={compact ? 'text-xs' : 'text-sm'}>{config.icon}</span>

            {/* Short name */}
            <span className="whitespace-nowrap">{label}</span>

            {/* Unread dot — only if thread has messages and is NOT active */}
            {!isActive && hasMessages && (
              <span className="absolute top-1 right-0.5 w-1.5 h-1.5 bg-teal-500 rounded-full" />
            )}

            {/* Active indicator — colored bottom border */}
            {isActive && (
              <span
                className={`absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-gradient-to-r ${config.color}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
