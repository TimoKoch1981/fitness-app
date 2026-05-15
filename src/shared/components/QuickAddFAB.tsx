/**
 * QuickAddFAB — global "+" action that opens a 6-way action picker (v14.16 / P1-2).
 *
 * IST-Analyse §3.D.4: "Eine zentrale Eingabe-Pforte (Sprache/Text/Foto) statt
 * 35 verstreuter Plus-Buttons." This is that pforte.
 *
 * Placement: bottom-right, just left of the FloatingBuddyAvatar (right-24 vs
 * right-4). Both are 56×56 with `bottom-20` to clear the bottom navigation bar.
 *
 * Behaviour:
 *   - Tap FAB → opens a bottom-sheet with 6 action chips
 *   - Tap chip → opens the corresponding existing dialog (re-uses the proven
 *     forms; no duplication of save logic)
 *   - All chips dispatch to global state via small refs so we don't need a
 *     new context for this. The dialogs live in this component too.
 *
 * Why not replace the 35 per-page Plus buttons immediately? The per-page
 * buttons stay for now — they're the in-context way (e.g. Plus on Medical
 * → BP dialog with sensible defaults). This FAB is the SHORTCUT, not the
 * replacement. After two weeks of telemetry we'll see which per-page
 * buttons fall to <5% usage and can be deleted.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Utensils, Dumbbell, Pill, Heart, Scale, Camera,
} from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useTranslation } from '../../i18n';
import { AddMealDialog } from '../../features/meals/components/AddMealDialog';
import { AddWorkoutDialog } from '../../features/workouts/components/AddWorkoutDialog';
import { WorkoutStartDialog } from '../../features/workouts/components/WorkoutStartDialog';
import { LogSubstanceDialog } from '../../features/medical/components/LogSubstanceDialog';
import { AddBloodPressureDialog } from '../../features/medical/components/AddBloodPressureDialog';
import { AddBodyMeasurementDialog } from '../../features/body/components/AddBodyMeasurementDialog';

type QuickAction = 'meal' | 'workout' | 'substance' | 'blood_pressure' | 'body' | 'meal_photo';
// v14.20: 'workout' opens WorkoutStartDialog (3-way: Free / Quick-Log / Create-Plan)
// so users find the "Freies Training" entry that exists on the Training page
// but was hidden in the QuickAdd path. Consistent with TrainingPage's plus button.
type ActiveOverlay = QuickAction | 'workout_quicklog' | null;

interface ActionDef {
  key: QuickAction;
  Icon: typeof Plus;
  labelDE: string;
  labelEN: string;
  tone: string;
}

// Studio: einheitliche Card-Tone, Domain-Tint nur ueber Border-Left-Akzent
// (Phase 7 §3 — keine 6 Hintergrund-Pastell-Farben mehr).
const ACTIONS: ActionDef[] = [
  { key: 'meal',           Icon: Utensils, labelDE: 'Mahlzeit',  labelEN: 'Meal',      tone: 'border-l-[3px] border-l-theme-success' },
  { key: 'meal_photo',     Icon: Camera,   labelDE: 'Foto-Meal', labelEN: 'Photo meal', tone: 'border-l-[3px] border-l-theme-success' },
  { key: 'workout',        Icon: Dumbbell, labelDE: 'Workout',   labelEN: 'Workout',   tone: 'border-l-[3px] border-l-theme-primary' },
  { key: 'substance',      Icon: Pill,     labelDE: 'Einnahme',  labelEN: 'Dose',      tone: 'border-l-[3px] border-l-violet-600' },
  { key: 'blood_pressure', Icon: Heart,    labelDE: 'Blutdruck', labelEN: 'BP',        tone: 'border-l-[3px] border-l-theme-danger' },
  { key: 'body',           Icon: Scale,    labelDE: 'Gewicht',   labelEN: 'Weight',    tone: 'border-l-[3px] border-l-theme-accent' },
];

export function QuickAddFAB() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const isDE = language === 'de';
  const navigate = useNavigate();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);

  // Don't show before auth resolves
  if (!user) return null;

  const closeOverlay = () => setActiveOverlay(null);

  const handlePick = (action: QuickAction) => {
    setSheetOpen(false);
    // 'workout' → 3-way picker (Free / Quick-Log / Plan). All others go
    // straight to their dedicated dialog (single intent).
    setActiveOverlay(action);
  };

  // WorkoutStartDialog → Quick-Log: switch from the picker to AddWorkoutDialog.
  const handleQuickLog = () => setActiveOverlay('workout_quicklog');

  // WorkoutStartDialog → Create Plan: send user to TrainingPage so the
  // existing CreatePlanDialog flow takes over (no duplicate plan UI here).
  const handleCreatePlan = () => {
    closeOverlay();
    navigate('/training?tab=plan&action=create');
  };

  return (
    <>
      {/* FAB — bottom-right, just left of the Buddy avatar (right-4) */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label={isDE ? 'Schnell-Eintrag' : 'Quick add'}
        className="fixed bottom-20 right-24 z-[51] w-14 h-14 rounded-full shadow-md flex items-center justify-center bg-theme-primary text-theme-primary-on hover:bg-theme-primary-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 active:scale-95 transition-all"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>

      {/* Bottom Sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          onClick={() => setSheetOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-theme-surface border border-theme-line rounded-t-theme-lg sm:rounded-theme-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme-line">
              <h2 className="text-base font-semibold text-theme-ink">
                {isDE ? 'Schnell-Eintrag' : 'Quick add'}
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="p-1 text-theme-ink-3 hover:text-theme-ink-2 transition-colors"
                aria-label={isDE ? 'Schliessen' : 'Close'}
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {ACTIONS.map((a) => {
                  const Icon = a.Icon;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => handlePick(a.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-theme-md border border-theme-line bg-theme-surface-2 text-theme-ink hover:bg-theme-surface-3 active:scale-95 transition-all ${a.tone}`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                      <span className="text-xs font-medium">
                        {isDE ? a.labelDE : a.labelEN}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-theme-ink-3 text-center mt-4">
                {isDE
                  ? 'Tipp: Spr im Buddy-Chat reicht oft — der erkennt was du loggen willst.'
                  : 'Tip: Just tell the Buddy chat what you ate — it picks the right action.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs — re-use the existing per-page forms */}
      <AddMealDialog open={activeOverlay === 'meal'} onClose={closeOverlay} />
      <AddMealDialog open={activeOverlay === 'meal_photo'} onClose={closeOverlay} />

      {/* Workout: 3-way picker mirrors TrainingPage's plus-button. The
          QuickAddFAB previously dumped users straight into Quick-Log, hiding
          the "Freies Training" entry that exists on the Training page. */}
      <WorkoutStartDialog
        open={activeOverlay === 'workout'}
        onClose={closeOverlay}
        onQuickLog={handleQuickLog}
        onCreatePlan={handleCreatePlan}
      />
      <AddWorkoutDialog open={activeOverlay === 'workout_quicklog'} onClose={closeOverlay} />

      <LogSubstanceDialog open={activeOverlay === 'substance'} onClose={closeOverlay} />
      <AddBloodPressureDialog open={activeOverlay === 'blood_pressure'} onClose={closeOverlay} />
      <AddBodyMeasurementDialog open={activeOverlay === 'body'} onClose={closeOverlay} />
    </>
  );
}
