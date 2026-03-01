/**
 * useProactiveWarnings — Auto-inject critical health warnings into buddy chat.
 *
 * Monitors deviations from analyzeDeviations() and, when critical (priority ≤ 2)
 * warnings are detected, automatically adds a proactive warning message to the
 * buddy chat. This ensures users see health alerts even if they don't visit the
 * Cockpit or manually ask the buddy.
 *
 * Deduplication:
 * - Per-session: sessionStorage tracks which warnings have already been shown.
 * - Per-day: sessionStorage key includes today's date, so warnings reset daily.
 * - Per-deviation: Each warning is identified by agent + message prefix.
 *
 * Timing:
 * - Only fires after health data has loaded (checks for non-empty context).
 * - Debounced via setTimeout to avoid firing during initial data hydration.
 * - Uses ref to prevent duplicate calls on re-renders.
 *
 * @see lib/ai/deviations.ts — Deviation analysis engine
 * @see shared/components/ProactiveWarningCard.tsx — Cockpit warning cards
 */

import { useEffect, useRef } from 'react';
import type { Deviation } from '../../../lib/ai/deviations';
import { today } from '../../../lib/utils';

const STORAGE_KEY = 'fitbuddy_proactive_warned';

/**
 * Get the session-aware storage key (resets daily).
 */
function getStorageKey(): string {
  return `${STORAGE_KEY}_${today()}`;
}

/**
 * Auto-inject critical health warnings into the buddy chat.
 *
 * @param deviations - Current deviations from analyzeDeviations()
 * @param addSystemMessage - BuddyChat's addSystemMessage callback
 * @param language - Current language ('de' | 'en')
 * @param isDataReady - Whether health data has loaded (prevents premature firing)
 */
export function useProactiveWarnings(
  deviations: Deviation[],
  addSystemMessage: (content: string, icon?: string) => void,
  language: 'de' | 'en',
  isDataReady: boolean,
) {
  const hasFiredRef = useRef(false);
  const addSystemMessageRef = useRef(addSystemMessage);
  addSystemMessageRef.current = addSystemMessage;

  useEffect(() => {
    // Don't fire until data is ready or if we already fired this mount
    if (!isDataReady || hasFiredRef.current) return;

    // Filter for critical warnings (priority 1-2, type 'warning')
    const critical = deviations.filter(
      d => d.priority <= 2 && d.type === 'warning',
    );

    if (critical.length === 0) return;

    // Check sessionStorage for already-shown warnings
    const storageKey = getStorageKey();
    const warned = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]') as string[];
    const newWarnings = critical.filter(
      d => !warned.includes(`${d.agent}_${d.message.slice(0, 40)}`),
    );

    if (newWarnings.length === 0) return;

    // Mark as fired to prevent duplicate calls during this render cycle
    hasFiredRef.current = true;

    // Debounce: wait 1.5s after data loads to avoid flashing during hydration
    const timeout = setTimeout(() => {
      const de = language === 'de';

      const header = de
        ? '⚠️ **Proaktiver Gesundheitshinweis**\nIch habe auffaellige Werte in deinen Daten erkannt:'
        : '⚠️ **Proactive Health Alert**\nI detected concerning patterns in your data:';

      const items = newWarnings
        .map(d => {
          const msg = de ? d.message : d.messageEN;
          return `• ${d.icon} ${msg}`;
        })
        .join('\n');

      const footer = de
        ? '\n\n_Frag mich zu einem der Hinweise — ich erklaere dir, was du tun kannst._'
        : "\n\n_Ask me about any of these alerts — I'll explain what you can do._";

      addSystemMessageRef.current(header + '\n' + items + footer, '⚠️');

      // Persist to sessionStorage
      const allWarned = [
        ...warned,
        ...newWarnings.map(d => `${d.agent}_${d.message.slice(0, 40)}`),
      ];
      sessionStorage.setItem(storageKey, JSON.stringify(allWarned));
    }, 1500);

    return () => clearTimeout(timeout);
  }, [deviations, language, isDataReady]);
}
