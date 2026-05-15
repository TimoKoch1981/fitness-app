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
  /** Optional: intercept a suggestion click. Return true to prevent default buddy navigation. */
  onSuggestionClick?: (suggestion: BuddySuggestion) => boolean;
}

export function BuddyQuickAccess({ suggestions, onSuggestionClick }: BuddyQuickAccessProps) {
  const { openBuddyChat } = useInlineBuddyChat();
  const { t } = useTranslation();

  if (suggestions.length === 0) return null;

  const goToBuddy = (suggestion?: BuddySuggestion) => {
    // If a custom handler is provided AND it returns true, skip buddy navigation
    if (suggestion && onSuggestionClick?.(suggestion)) return;
    openBuddyChat(suggestion?.message, suggestion?.targetAgent);
  };

  return (
    <div className="bg-theme-surface border border-theme-line rounded-theme-md p-3 mb-4">
      {/* Header row — tapping opens buddy chat */}
      <button
        onClick={() => goToBuddy(undefined)}
        className="w-full flex items-center gap-2 mb-2 group"
      >
        <div className="w-6 h-6 bg-theme-primary rounded-theme-sm flex items-center justify-center flex-shrink-0">
          <MessageCircle className="h-3 w-3 text-theme-primary-on" strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold text-theme-ink flex-1 text-left">
          {t.buddyAccess.title}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-theme-ink-3 group-hover:text-theme-primary transition-colors" strokeWidth={1.5} />
      </button>

      {/* Suggestion chips — horizontal scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => goToBuddy(s)}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-theme-surface-2 text-theme-ink rounded-theme-sm border border-theme-line hover:border-theme-primary hover:text-theme-primary transition-colors whitespace-nowrap"
          >
            {s.icon && <span className="mr-1">{s.icon}</span>}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
