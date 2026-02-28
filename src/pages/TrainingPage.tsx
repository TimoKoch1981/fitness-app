/**
 * TrainingPage — Standalone page for workout tracking.
 * Contains WorkoutsTabContent with its own sub-tabs (Today, Plan, History).
 * Power mode widgets shown above content when training mode is Power/Power+.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useTrainingMode } from '../shared/hooks/useTrainingMode';

import { WorkoutsTabContent } from '../features/workouts/components/WorkoutsTabContent';
import { CompetitionCountdown } from '../features/workouts/components/power/CompetitionCountdown';
import { PhaseProgressBar } from '../features/workouts/components/power/PhaseProgressBar';
import { NaturalLimitCalc } from '../features/workouts/components/power/NaturalLimitCalc';
import { RefeedPlanner } from '../features/workouts/components/power/RefeedPlanner';
import { CycleWidget } from '../features/workouts/components/powerplus/CycleWidget';
import { PCTCountdown } from '../features/workouts/components/powerplus/PCTCountdown';
import { HematocritAlert } from '../features/workouts/components/powerplus/HematocritAlert';
import { BloodWorkDashboard } from '../features/workouts/components/powerplus/BloodWorkDashboard';
import { PosingPhotos } from '../features/workouts/components/powerplus/PosingPhotos';

export function TrainingPage() {
  const { t } = useTranslation();
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const {
    showCompetitionFeatures,
    showPhaseProgress,
    showNaturalLimits,
    showRefeedPlanner,
    showCycleTracker,
    showPCTCountdown,
    showHematocritAlert,
    showBloodWorkDashboard,
    showPosingPhotos,
  } = useTrainingMode();

  const showPowerWidgets = showCompetitionFeatures || showPhaseProgress || showNaturalLimits || showRefeedPlanner;
  const showPowerPlusWidgets = showCycleTracker || showPCTCountdown || showHematocritAlert || showBloodWorkDashboard;

  return (
    <PageShell
      title={t.tracking.training}
      actions={
        <button
          onClick={() => setShowWorkoutDialog(true)}
          className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      {/* Power Mode Widgets */}
      {showPowerWidgets && (
        <div className="space-y-3 mb-4">
          {showCompetitionFeatures && <CompetitionCountdown />}
          {showPhaseProgress && <PhaseProgressBar />}
          {showNaturalLimits && <NaturalLimitCalc />}
          {showRefeedPlanner && <RefeedPlanner />}
        </div>
      )}

      {/* Power+ Mode Widgets */}
      {showPowerPlusWidgets && (
        <div className="space-y-3 mb-4">
          {showHematocritAlert && <HematocritAlert />}
          {showCycleTracker && <CycleWidget />}
          {showPCTCountdown && <PCTCountdown />}
          {showBloodWorkDashboard && <BloodWorkDashboard />}
        </div>
      )}

      {/* Posing Photos — Power/Power+ */}
      {showPosingPhotos && <PosingPhotos />}

      <WorkoutsTabContent
        showAddDialog={showWorkoutDialog}
        onOpenAddDialog={() => setShowWorkoutDialog(true)}
        onCloseAddDialog={() => setShowWorkoutDialog(false)}
      />
    </PageShell>
  );
}
