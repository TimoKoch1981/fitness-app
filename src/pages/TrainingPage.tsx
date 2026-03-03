/**
 * TrainingPage — Standalone page for workout tracking.
 * Contains WorkoutsTabContent with its own sub-tabs (Today, Plan, History).
 * Power mode widgets shown above content when training mode is Power/Power+.
 * Progress photos timeline and comparison available when posing photos are enabled.
 */

import { useState } from 'react';
import { Plus, Camera, TrendingUp, ArrowLeftRight } from 'lucide-react';
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
import { ProgressPhotosTimeline, useProgressPhotos } from '../features/body/components/ProgressPhotosTimeline';
import { ProgressComparison } from '../features/body/components/ProgressComparison';
import type { ProgressPhoto } from '../features/body/components/ProgressPhotosTimeline';

type PhotoTab = 'poses' | 'progress' | 'compare';

export function TrainingPage() {
  const { t, language } = useTranslation();
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

  const [photoTab, setPhotoTab] = useState<PhotoTab>('poses');
  const [compareInitial, setCompareInitial] = useState<{ before?: ProgressPhoto; after?: ProgressPhoto }>({});
  const { data: progressPhotos = [] } = useProgressPhotos();

  const showPowerWidgets = showCompetitionFeatures || showPhaseProgress || showNaturalLimits || showRefeedPlanner;
  const showPowerPlusWidgets = showCycleTracker || showPCTCountdown || showHematocritAlert || showBloodWorkDashboard;

  const handleSelectForCompare = (photo: ProgressPhoto) => {
    setCompareInitial(prev => {
      if (!prev.before) return { before: photo };
      return { before: prev.before, after: photo };
    });
    setPhotoTab('compare');
  };

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

      {/* Posing Photos Section with Tabs — Power/Power+ */}
      {showPosingPhotos && (
        <div className="mb-4 space-y-3">
          {/* Photo Sub-Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setPhotoTab('poses')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                photoTab === 'poses'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              {t.powerPlus?.posingPhotos ?? 'Posing'}
            </button>
            <button
              onClick={() => setPhotoTab('progress')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                photoTab === 'progress'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {t.progress?.timeline ?? (language === 'de' ? 'Fortschritt' : 'Progress')}
            </button>
            <button
              onClick={() => setPhotoTab('compare')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
                photoTab === 'compare'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              {t.progress?.compare ?? (language === 'de' ? 'Vergleich' : 'Compare')}
            </button>
          </div>

          {/* Tab Content */}
          {photoTab === 'poses' && <PosingPhotos />}
          {photoTab === 'progress' && (
            <ProgressPhotosTimeline onSelectForCompare={handleSelectForCompare} />
          )}
          {photoTab === 'compare' && (
            <ProgressComparison
              photos={progressPhotos}
              initialBefore={compareInitial.before}
              initialAfter={compareInitial.after}
              onClose={() => {
                setCompareInitial({});
                setPhotoTab('progress');
              }}
            />
          )}
        </div>
      )}

      <WorkoutsTabContent
        showAddDialog={showWorkoutDialog}
        onOpenAddDialog={() => setShowWorkoutDialog(true)}
        onCloseAddDialog={() => setShowWorkoutDialog(false)}
      />
    </PageShell>
  );
}
