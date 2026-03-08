/**
 * CyclePage — Standalone page for menstrual cycle tracking.
 *
 * Dedicated navigation item for female/other users with cycle tracking enabled.
 * Contains: Cycle log list, timeline visualization, pattern insights, add dialog.
 * Previously part of MedicalPage — moved to its own page for better discoverability.
 */

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useMenstrualCycleLogs, useDeleteCycleLog, getCyclePhaseEmoji } from '../features/medical/hooks/useMenstrualCycle';
import { AddCycleLogDialog } from '../features/medical/components/AddCycleLogDialog';
import { CycleTimeline } from '../features/medical/components/CycleTimeline';
import { CycleInsightsCard } from '../features/medical/components/CycleInsightsCard';
import { CyclePhaseWidget } from '../features/medical/components/CyclePhaseWidget';
import { formatDate } from '../lib/utils';

export function CyclePage() {
  const { t, language } = useTranslation();
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  const [showCycleDialog, setShowCycleDialog] = useState(false);

  const { data: cycleLogs, isLoading: cycleLoading } = useMenstrualCycleLogs(30);
  const deleteCycle = useDeleteCycleLog();

  return (
    <PageShell
      title={t.cycle?.title ?? (language === 'de' ? 'Zyklus-Tracker' : 'Cycle Tracker')}
      actions={
        <button
          onClick={() => setShowCycleDialog(true)}
          className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      <div className="space-y-4">
        {/* Current Phase Widget with Prediction */}
        <CyclePhaseWidget cycleTrackingEnabled />

        {/* Cycle Timeline Visualization */}
        <CycleTimeline cycleTrackingEnabled />

        {/* Pattern Insights */}
        <CycleInsightsCard cycleTrackingEnabled />

        {/* Cycle Log List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900 text-sm">
              {language === 'de' ? 'Einträge' : 'Entries'}
            </h3>
          </div>

          {cycleLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto" />
            </div>
          ) : cycleLogs && cycleLogs.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {cycleLogs.map((log) => {
                const phaseEmoji = getCyclePhaseEmoji(log.phase);
                const phaseLabel = t.cycle?.[log.phase as keyof typeof t.cycle] ?? log.phase;
                const flowLabel = log.flow_intensity && log.phase === 'menstruation'
                  ? t.cycle?.[`flow${log.flow_intensity.charAt(0).toUpperCase()}${log.flow_intensity.slice(1)}` as keyof typeof t.cycle]
                  : null;
                const symptomCount = (log.symptoms ?? []).length;
                return (
                  <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 group">
                    <span className="text-lg flex-shrink-0">{phaseEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {phaseLabel}
                        {flowLabel && <span className="text-gray-400 font-normal"> · {flowLabel}</span>}
                        {symptomCount > 0 && <span className="text-gray-400 font-normal"> · {symptomCount} {t.cycle?.symptoms ?? 'Symptoms'}</span>}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatDate(log.date, locale)}
                        {log.mood && ` · ${['\u{1F622}', '\u{1F615}', '\u{1F610}', '\u{1F642}', '\u{1F60A}'][log.mood - 1]} ${t.cycle?.mood ?? 'Mood'}`}
                        {log.energy_level && ` · ${['\u{1FAB6}', '\u{1F634}', '\u{1F610}', '\u{26A1}', '\u{1F525}'][log.energy_level - 1]} ${t.cycle?.energyLevel ?? 'Energy'}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteCycle.mutate(log.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-400">{t.cycle?.noData ?? (language === 'de' ? 'Noch kein Zyklus eingetragen' : 'No cycle data yet')}</p>
              <button
                onClick={() => setShowCycleDialog(true)}
                className="mt-2 text-xs text-rose-600 hover:underline"
              >
                {t.cycle?.logCycle ?? (language === 'de' ? 'Zyklus eintragen' : 'Log cycle')}
              </button>
            </div>
          )}
        </div>
      </div>

      <AddCycleLogDialog
        open={showCycleDialog}
        onClose={() => setShowCycleDialog(false)}
      />
    </PageShell>
  );
}
