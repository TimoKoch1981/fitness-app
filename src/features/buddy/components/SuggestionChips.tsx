/**
 * Suggestion Chips — proactive, tappable quick-action buttons below the chat input.
 *
 * Shows 2-4 context-aware suggestions (time-based, missing data, training plan).
 * Tapping a chip sends the associated message to the buddy.
 *
 * Design: Rounded pills, horizontal scrollable, subtle teal accent.
 */

import type { Suggestion } from '../hooks/useSuggestions';

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onTap: (message: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({ suggestions, onTap, disabled }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {suggestions.map((s) => (
        <button
          key={s.id}
          onClick={() => onTap(s.message)}
          disabled={disabled}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200 hover:bg-teal-100 hover:border-teal-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {s.text}
        </button>
      ))}
    </div>
  );
}
