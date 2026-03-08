/**
 * CycleInsightsCard — Zeigt Zyklus-Muster-Erkennung auf der MedicalPage.
 *
 * Nur sichtbar wenn >= 2 vollstaendige Zyklen vorhanden sind.
 * Zeigt Phase-Durchschnitte (Energie/Stimmung), Top-Symptome und Insights.
 */

import { useTranslation } from '../../../i18n';
import { useCyclePatterns } from '../hooks/useCyclePatterns';
import { getCyclePhaseEmoji, getSymptomKey } from '../hooks/useMenstrualCycle';
import type { CyclePhase } from '../../../types/health';

interface CycleInsightsCardProps {
  cycleTrackingEnabled?: boolean;
}

const ENERGY_EMOJI = ['', '\u{1FAB6}', '\u{1F634}', '\u{1F610}', '\u{26A1}', '\u{1F525}']; // 🪫😴😐⚡🔥
const MOOD_EMOJI = ['', '\u{1F622}', '\u{1F615}', '\u{1F610}', '\u{1F642}', '\u{1F60A}'];   // 😢😕😐🙂😊

const INSIGHT_ICONS: Record<string, string> = {
  positive: '\u{2705}', // ✅
  info: '\u{1F4A1}',    // 💡
  warning: '\u{26A0}\u{FE0F}',  // ⚠️
};

const PHASE_NAMES: Record<CyclePhase, { de: string; en: string }> = {
  menstruation: { de: 'Menstruation', en: 'Menstruation' },
  follicular: { de: 'Follikelphase', en: 'Follicular' },
  ovulation: { de: 'Eisprung', en: 'Ovulation' },
  luteal: { de: 'Lutealphase', en: 'Luteal' },
  spotting: { de: 'Schmierblutung', en: 'Spotting' },
};

export function CycleInsightsCard({ cycleTrackingEnabled }: CycleInsightsCardProps) {
  const { t, language } = useTranslation();
  const patterns = useCyclePatterns();
  const de = language === 'de';

  if (!cycleTrackingEnabled || !patterns.hasSufficientData) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        {de ? 'Zyklus-Muster' : 'Cycle Patterns'}
        <span className="text-[10px] text-gray-400 ml-2 font-normal">
          {patterns.completeCycleCount} {de ? 'Zyklen analysiert' : 'cycles analyzed'}
        </span>
      </h3>

      {/* Phase Averages Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {patterns.phaseAverages
          .filter(pa => pa.logCount > 0)
          .map(pa => (
            <div key={pa.phase} className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm">{getCyclePhaseEmoji(pa.phase)}</span>
                <span className="text-[10px] font-medium text-gray-700">
                  {de ? PHASE_NAMES[pa.phase].de : PHASE_NAMES[pa.phase].en}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                {pa.avgEnergy != null && (
                  <span title={de ? 'Durchschn. Energie' : 'Avg. Energy'}>
                    {ENERGY_EMOJI[Math.round(pa.avgEnergy)]} {pa.avgEnergy}
                  </span>
                )}
                {pa.avgMood != null && (
                  <span title={de ? 'Durchschn. Stimmung' : 'Avg. Mood'}>
                    {MOOD_EMOJI[Math.round(pa.avgMood)]} {pa.avgMood}
                  </span>
                )}
              </div>
              {pa.topSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {pa.topSymptoms.slice(0, 3).map(ts => {
                    const symKey = getSymptomKey(ts.symptom);
                    const cycle = t.cycle as Record<string, string>;
                    const label = cycle[symKey] ?? ts.symptom.replace(/_/g, ' ');
                    return (
                      <span
                        key={ts.symptom}
                        className="text-[8px] bg-rose-50 text-rose-600 px-1 py-0.5 rounded"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Top Overall Symptoms */}
      {patterns.overallTopSymptoms.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-gray-500 mb-1">
            {de ? 'Haeufigste Symptome' : 'Most Common Symptoms'}
          </p>
          <div className="flex flex-wrap gap-1">
            {patterns.overallTopSymptoms.slice(0, 6).map(ts => {
              const symKey = getSymptomKey(ts.symptom);
              const cycle = t.cycle as Record<string, string>;
              const label = cycle[symKey] ?? ts.symptom.replace(/_/g, ' ');
              return (
                <span
                  key={ts.symptom}
                  className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full"
                >
                  {label} ({ts.count})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      {patterns.insights.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          {patterns.insights.map(insight => (
            <div key={insight.key} className="flex items-start gap-1.5">
              <span className="text-xs flex-shrink-0">{INSIGHT_ICONS[insight.type]}</span>
              <p className={`text-[11px] leading-snug ${
                insight.type === 'warning' ? 'text-amber-700' :
                insight.type === 'positive' ? 'text-green-700' :
                'text-gray-600'
              }`}>
                {de ? insight.de : insight.en}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
