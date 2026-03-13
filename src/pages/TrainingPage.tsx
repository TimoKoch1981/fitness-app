/**
 * TrainingPage — Standalone page for workout tracking.
 * Contains WorkoutsTabContent with its own sub-tabs (Today, Plan, History).
 * Power mode widgets shown above content when training mode is Power/Power+.
 * Progress photos timeline and comparison available when posing photos are enabled.
 */

import { useState } from 'react';
import { Plus, Sparkles, Heart } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useTrainingMode } from '../shared/hooks/useTrainingMode';
import { useProfile, useUpdateProfile } from '../features/auth/hooks/useProfile';
// RestTimerWidget removed from main page — full multi-timer is inside ActiveWorkoutPage

import { WorkoutsTabContent } from '../features/workouts/components/WorkoutsTabContent';
import { WorkoutStartDialog } from '../features/workouts/components/WorkoutStartDialog';
import { CompetitionCountdown } from '../features/workouts/components/power/CompetitionCountdown';
import { PhaseProgressBar } from '../features/workouts/components/power/PhaseProgressBar';
import { NaturalLimitCalc } from '../features/workouts/components/power/NaturalLimitCalc';
import { RefeedPlanner } from '../features/workouts/components/power/RefeedPlanner';
import { CycleWidget } from '../features/workouts/components/powerplus/CycleWidget';
import { PCTCountdown } from '../features/workouts/components/powerplus/PCTCountdown';
import { HematocritAlert } from '../features/workouts/components/powerplus/HematocritAlert';
import { BloodWorkDashboard } from '../features/workouts/components/powerplus/BloodWorkDashboard';

export function TrainingPage() {
  const { t, language } = useTranslation();
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  // U2: Force switch to Plan tab when "Plan erstellen" is clicked
  const [forceTab, setForceTab] = useState<'plan' | null>(null);
  // Open CreatePlanDialog directly from WorkoutStartDialog
  const [openCreatePlan, setOpenCreatePlan] = useState(false);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const showCycleToggle = profile?.gender === 'female' || profile?.gender === 'other';
  const {
    showCompetitionFeatures,
    showPhaseProgress,
    showNaturalLimits,
    showRefeedPlanner,
    showCycleTracker,
    showPCTCountdown,
    showHematocritAlert,
    showBloodWorkDashboard,
  } = useTrainingMode();

  const showPowerWidgets = showCompetitionFeatures || showPhaseProgress || showNaturalLimits || showRefeedPlanner;
  const showPowerPlusWidgets = showCycleTracker || showPCTCountdown || showHematocritAlert || showBloodWorkDashboard;


  return (
    <PageShell
      title={t.tracking.training}
      actions={
        <button
          onClick={() => setShowStartDialog(true)}
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

      {/* ── KI-Trainer & Zyklus-Training Toggles ─────────────────────── */}
      <div className="space-y-2 mb-4">
        {/* KI-Trainer Toggle — prominent on Training page */}
        <div className="bg-white rounded-xl shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                  {language === 'de' ? 'KI-Trainer' : 'AI Trainer'}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {language === 'de'
                    ? 'Automatische Reviews, Deload & Progression'
                    : 'Automatic reviews, deload & progression'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
              <input
                type="checkbox"
                checked={!!profile?.ai_trainer_enabled}
                onChange={async (e) => {
                  try {
                    await updateProfile.mutateAsync({ ai_trainer_enabled: e.target.checked });
                  } catch { /* handled by mutation */ }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
            </label>
          </div>
        </div>

        {/* Zyklus-Training Toggle — nur bei weiblich/divers */}
        {showCycleToggle && (
          <div className="bg-white rounded-xl shadow-sm p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="h-4 w-4 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">
                    {language === 'de' ? 'Zyklusabhängiges Training' : 'Cycle-Based Training'}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {language === 'de'
                      ? 'Intensität & Volumen an Zyklusphase anpassen'
                      : 'Adjust intensity & volume to cycle phase'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={!!profile?.cycle_tracking_enabled}
                  onChange={async (e) => {
                    try {
                      await updateProfile.mutateAsync({ cycle_tracking_enabled: e.target.checked });
                    } catch { /* handled by mutation */ }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
              </label>
            </div>
          </div>
        )}
      </div>

      <WorkoutsTabContent
        showAddDialog={showWorkoutDialog}
        onOpenAddDialog={() => setShowWorkoutDialog(true)}
        onCloseAddDialog={() => setShowWorkoutDialog(false)}
        forceTab={forceTab}
        onForceTabApplied={() => setForceTab(null)}
        openCreatePlan={openCreatePlan}
        onCreatePlanOpened={() => setOpenCreatePlan(false)}
      />

      {/* Workout Start Dialog — Freies Training, Quick-Log, Plan erstellen (U2) */}
      <WorkoutStartDialog
        open={showStartDialog}
        onClose={() => setShowStartDialog(false)}
        onQuickLog={() => setShowWorkoutDialog(true)}
        onCreatePlan={() => {
          setForceTab('plan');
          setOpenCreatePlan(true);
        }}
      />
    </PageShell>
  );
}
