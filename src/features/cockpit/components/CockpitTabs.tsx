/**
 * CockpitTabs — Heute / Woche / Monat — v14.28 Stufe 2c.
 *
 * Loest das Affordance-Problem aus Phase 8 §3 (User-Feedback "Pills sehen
 * aus wie Tabs"): Die echten Tabs bekommen jetzt den prominenten Tab-Look
 * mit Underline-Indikator. Die ModeBar wird daneben sekundaer / kleiner.
 *
 * Verhalten:
 *  - Heute: bestehender Cockpit-Tagesinhalt (Hero, Macros, Energy, Insights)
 *  - Woche: 7-Tage-Aggregat (Avg-Kalorien, Workouts-Anzahl, Gewicht-Delta)
 *  - Monat: 30-Tage-Aggregat (Avg-Kalorien, Workouts-Anzahl, Gewicht-Delta)
 *
 * Sub-Tabs sind Cockpit-spezifisch, nicht global geteilt — sie navigieren
 * nicht zu anderen Pages, sondern wechseln nur die Daten-Aggregation
 * innerhalb des Cockpit.
 */

import type { Language } from '../../../i18n';

export type CockpitTab = 'today' | 'week' | 'month';

interface CockpitTabsProps {
  active: CockpitTab;
  onChange: (tab: CockpitTab) => void;
  language: Language;
}

const TAB_LABELS: Record<CockpitTab, { de: string; en: string }> = {
  today: { de: 'Heute', en: 'Today' },
  week:  { de: 'Woche', en: 'Week' },
  month: { de: 'Monat', en: 'Month' },
};

const TAB_ORDER: CockpitTab[] = ['today', 'week', 'month'];

export function CockpitTabs({ active, onChange, language }: CockpitTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={language === 'de' ? 'Zeitraum' : 'Time range'}
      className="flex gap-0 border-b border-theme-line bg-theme-surface -mx-5 px-5 mb-1"
    >
      {TAB_ORDER.map((tab) => {
        const isActive = active === tab;
        const label = TAB_LABELS[tab][language === 'de' ? 'de' : 'en'];
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`cockpit-panel-${tab}`}
            id={`cockpit-tab-${tab}`}
            onClick={() => onChange(tab)}
            className={`
              relative px-1 py-3 mr-7 text-[15px] font-semibold tracking-[-0.005em]
              transition-colors cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-1
              ${isActive ? 'text-theme-primary' : 'text-theme-ink-3 hover:text-theme-ink-2'}
            `}
          >
            {label}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 bottom-0 h-0.5 bg-theme-primary rounded-t-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
