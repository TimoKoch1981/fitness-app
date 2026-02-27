/**
 * BuddyQuickAccess — reusable card that provides page-specific buddy access.
 *
 * Renders a compact card with the buddy icon, a "Frag den Buddy" header,
 * and 2-3 tappable suggestion chips. Tapping a chip opens the inline
 * buddy chat bottom-sheet overlay directly on the current page.
 *
 * Placed inline on every feature page (Meals, Workouts, Body, Medical, Cockpit).
 */

import { MessageCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useInlineBuddyChat } from './InlineBuddyChatContext';
import type { BuddySuggestion } from '../../features/buddy/hooks/usePageBuddySuggestions';

interface BuddyQuickAccessProps {
  suggestions: BuddySuggestion[];
}

export function BuddyQuickAccess({ suggestions }: BuddyQuickAccessProps) {
  const { openBuddyChat } = useInlineBuddyChat();
  const { t } = useTranslation();

  if (suggestions.length === 0) return null;

  const goToBuddy = (suggestion?: BuddySuggestion) => {
    openBuddyChat(suggestion?.message, suggestion?.targetAgent);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
      {/* Header row — tapping opens buddy chat */}
      <button
        onClick={() => goToBuddy(undefined)}
        className="w-full flex items-center gap-2 mb-2 group"
      >
        <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
          <MessageCircle className="h-3 w-3 text-white" />
        </div>
        <span className="text-xs font-semibold text-gray-700 flex-1 text-left">
          {t.buddyAccess.title}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-teal-500 transition-colors" />
      </button>

      {/* Suggestion chips — horizontal scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => goToBuddy(s)}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200 hover:bg-teal-100 hover:border-teal-300 transition-colors whitespace-nowrap"
          >
            {s.icon && <span className="mr-1">{s.icon}</span>}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
