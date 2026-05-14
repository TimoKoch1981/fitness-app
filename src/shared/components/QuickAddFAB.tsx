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
import {
  Plus, X, Utensils, Dumbbell, Pill, Heart, Scale, Camera,
} from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useTranslation } from '../../i18n';
import { AddMealDialog } from '../../features/meals/components/AddMealDialog';
import { AddWorkoutDialog } from '../../features/workouts/components/AddWorkoutDialog';
import { LogSubstanceDialog } from '../../features/medical/components/LogSubstanceDialog';
import { AddBloodPressureDialog } from '../../features/medical/components/AddBloodPressureDialog';
import { AddBodyMeasurementDialog } from '../../features/body/components/AddBodyMeasurementDialog';

type QuickAction = 'meal' | 'workout' | 'substance' | 'blood_pressure' | 'body' | 'meal_photo';

interface ActionDef {
  key: QuickAction;
  Icon: typeof Plus;
  labelDE: string;
  labelEN: string;
  tone: string;
}

const ACTIONS: ActionDef[] = [
  { key: 'meal',           Icon: Utensils, labelDE: 'Mahlzeit',  labelEN: 'Meal',      tone: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'meal_photo',     Icon: Camera,   labelDE: 'Foto-Meal', labelEN: 'Photo meal', tone: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'workout',        Icon: Dumbbell, labelDE: 'Workout',   labelEN: 'Workout',   tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'substance',      Icon: Pill,     labelDE: 'Einnahme',  labelEN: 'Dose',      tone: 'bg-violet-50 text-violet-700 border-violet-200' },
  { key: 'blood_pressure', Icon: Heart,    labelDE: 'Blutdruck', labelEN: 'BP',        tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  { key: 'body',           Icon: Scale,    labelDE: 'Gewicht',   labelEN: 'Weight',    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export function QuickAddFAB() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<QuickAction | null>(null);

  // Don't show before auth resolves
  if (!user) return null;

  const handlePick = (action: QuickAction) => {
    setSheetOpen(false);
    setActiveDialog(action);
  };

  return (
    <>
      {/* FAB — bottom-right, just left of the Buddy avatar (right-4) */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label={isDE ? 'Schnell-Eintrag' : 'Quick add'}
        className="fixed bottom-20 right-24 z-[51] w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom Sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          onClick={() => setSheetOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-base font-semibold text-gray-900">
                {isDE ? 'Schnell-Eintrag' : 'Quick add'}
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label={isDE ? 'Schliessen' : 'Close'}
              >
                <X className="h-5 w-5" />
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
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${a.tone}`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium">
                        {isDE ? a.labelDE : a.labelEN}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-4">
                {isDE
                  ? 'Tipp: Spr im Buddy-Chat reicht oft — der erkennt was du loggen willst.'
                  : 'Tip: Just tell the Buddy chat what you ate — it picks the right action.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs — re-use the existing per-page forms */}
      <AddMealDialog open={activeDialog === 'meal'} onClose={() => setActiveDialog(null)} />
      <AddMealDialog open={activeDialog === 'meal_photo'} onClose={() => setActiveDialog(null)} />
      <AddWorkoutDialog open={activeDialog === 'workout'} onClose={() => setActiveDialog(null)} />
      <LogSubstanceDialog open={activeDialog === 'substance'} onClose={() => setActiveDialog(null)} />
      <AddBloodPressureDialog open={activeDialog === 'blood_pressure'} onClose={() => setActiveDialog(null)} />
      <AddBodyMeasurementDialog open={activeDialog === 'body'} onClose={() => setActiveDialog(null)} />
    </>
  );
}
