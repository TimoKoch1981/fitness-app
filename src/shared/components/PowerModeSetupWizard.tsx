/**
 * PowerModeSetupWizard — Unified setup wizard triggered after activating Power/Power+ mode.
 * Guides users through: 1) Phase Selection  2) Nutrition Setup (Macros)  3) Training Hints  4) Confirm
 * Saves phase_started_at, phase_target_weeks, current_phase + optionally daily goals.
 */

import { useState, useMemo } from 'react';
import {
  X, ChevronRight, ChevronLeft, Target, Calendar, Zap, Dumbbell,
  TrendingUp, TrendingDown, Minus, RotateCcw, Sun, Trophy,
  Check, AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useProfile, useUpdateProfile } from '../../features/auth/hooks/useProfile';
import { useLatestBodyMeasurement } from '../../features/body/hooks/useBodyMeasurements';
import { calculatePhaseMacros, type PhaseMacros } from '../../features/nutrition/utils/phaseMacroCalculator';
import { calculateBMR, calculateAge } from '../../lib/calculations';
import type { TrainingPhase, TrainingMode } from '../../types/health';

interface PowerModeSetupWizardProps {
  open: boolean;
  onClose: () => void;
  mode: TrainingMode;
}

const PHASES: { value: TrainingPhase; de: string; en: string; icon: typeof TrendingUp; iconColor: string; descDe: string; descEn: string }[] = [
  { value: 'bulk', de: 'Aufbauphase', en: 'Bulk Phase', icon: TrendingUp, iconColor: 'text-emerald-500', descDe: 'Muskelmasse aufbauen mit kalorischem Überschuss (+300-500 kcal)', descEn: 'Build muscle with caloric surplus (+300-500 kcal)' },
  { value: 'cut', de: 'Definitionsphase', en: 'Cut Phase', icon: TrendingDown, iconColor: 'text-red-500', descDe: 'Körperfett reduzieren bei maximalem Muskelerhalt (-500 kcal)', descEn: 'Reduce body fat while maximizing muscle retention (-500 kcal)' },
  { value: 'maintenance', de: 'Erhaltung', en: 'Maintenance', icon: Minus, iconColor: 'text-blue-500', descDe: 'Gewicht und Körperkomposition halten', descEn: 'Maintain weight and body composition' },
  { value: 'reverse_diet', de: 'Reverse Diet', en: 'Reverse Diet', icon: RotateCcw, iconColor: 'text-purple-500', descDe: 'Kalorien nach Diät langsam steigern (+100 kcal/Woche)', descEn: 'Slowly increase calories after diet (+100 kcal/week)' },
  { value: 'peak_week', de: 'Peak Week', en: 'Peak Week', icon: Trophy, iconColor: 'text-amber-500', descDe: '7-Tage Wettkampf-Vorbereitung', descEn: '7-day competition prep' },
  { value: 'off_season', de: 'Off-Season', en: 'Off-Season', icon: Sun, iconColor: 'text-gray-500', descDe: 'Erholung und lockerer Aufbau', descEn: 'Recovery and relaxed building' },
];

const DURATION_PRESETS: Record<TrainingPhase, number[]> = {
  bulk: [8, 12, 16, 20],
  cut: [8, 12, 16, 20],
  maintenance: [4, 8, 12, 0],
  reverse_diet: [4, 6, 8, 12],
  peak_week: [1],
  off_season: [4, 8, 0],
};

const TOTAL_STEPS = 4;

export function PowerModeSetupWizard({ open, onClose, mode }: PowerModeSetupWizardProps) {
  const { language } = useTranslation();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: latestBody } = useLatestBodyMeasurement();

  const [step, setStep] = useState(1);
  const [selectedPhase, setSelectedPhase] = useState<TrainingPhase>(profile?.current_phase ?? 'maintenance');
  const [targetWeeks, setTargetWeeks] = useState(12);
  const [applyMacros, setApplyMacros] = useState(true);
  const [saving, setSaving] = useState(false);

  const de = language === 'de';
  const isPowerPlus = mode === 'power_plus';

  // Calculate TDEE for macro preview
  const tdee = useMemo(() => {
    if (!profile?.height_cm || !profile?.birth_date || !latestBody?.weight_kg) return null;
    const age = calculateAge(profile.birth_date);
    const bmrResult = calculateBMR(
      {
        weight_kg: latestBody.weight_kg,
        height_cm: profile.height_cm,
        age,
        gender: (profile.gender as 'male' | 'female') ?? 'male',
        body_fat_pct: latestBody.body_fat_pct ?? undefined,
      },
      (profile.preferred_bmr_formula as 'mifflin' | 'katch' | 'auto') ?? 'auto',
    );
    const pal = profile.activity_level ?? 1.55;
    return Math.round(bmrResult.bmr * pal);
  }, [profile, latestBody]);

  // Phase macro preview
  const phaseMacros: PhaseMacros | null = useMemo(() => {
    if (!tdee || !latestBody?.weight_kg) return null;
    return calculatePhaseMacros({
      tdee,
      phase: selectedPhase,
      weeksIntoPhase: 0,
      bodyWeight: latestBody.weight_kg,
      bodyFatPct: latestBody.body_fat_pct ?? undefined,
    });
  }, [tdee, selectedPhase, latestBody]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        current_phase: selectedPhase,
        phase_started_at: new Date().toISOString(),
        phase_target_weeks: targetWeeks || undefined,
      };

      // Optionally apply macro goals to profile
      if (applyMacros && phaseMacros) {
        updates.daily_calories_goal = phaseMacros.calories;
        updates.daily_protein_goal = phaseMacros.protein;
      }

      await updateProfile.mutateAsync(updates);
      onClose();
    } catch {
      // Error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isPowerPlus ? 'bg-red-50' : 'bg-amber-50'}`}>
              <Zap className={`h-5 w-5 ${isPowerPlus ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                {de ? `${isPowerPlus ? 'Power+' : 'Power'} Setup` : `${isPowerPlus ? 'Power+' : 'Power'} Setup`}
              </h2>
              <p className="text-[10px] text-gray-400">
                {de ? 'Phase, Ernährung & Training konfigurieren' : 'Configure phase, nutrition & training'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-4 pt-3 flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? (isPowerPlus ? 'bg-red-400' : 'bg-amber-400') : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="px-4 mt-1 text-[10px] text-gray-400">
          {de ? `Schritt ${step} von ${TOTAL_STEPS}` : `Step ${step} of ${TOTAL_STEPS}`}
        </p>

        <div className="px-4 pb-6 pt-3">
          {/* ── Step 1: Welcome + Phase Selection ── */}
          {step === 1 && (
            <div>
              <div className="bg-gradient-to-r from-amber-50 to-teal-50 rounded-xl p-3 mb-4">
                <p className="text-sm text-gray-700">
                  {de
                    ? `${isPowerPlus ? 'Power+' : 'Power'} Modus aktiviert! Konfiguriere jetzt deine Trainingsphase für optimale KI-Empfehlungen und Makro-Ziele.`
                    : `${isPowerPlus ? 'Power+' : 'Power'} Mode activated! Configure your training phase for optimal AI recommendations and macro targets.`}
                </p>
              </div>

              <p className="text-sm font-medium text-gray-700 mb-3">
                {de ? 'In welcher Phase bist du aktuell?' : 'What phase are you currently in?'}
              </p>

              <div className="space-y-2">
                {PHASES.map((p) => {
                  const PhaseIcon = p.icon;
                  return (
                    <button
                      key={p.value}
                      onClick={() => {
                        setSelectedPhase(p.value);
                        setTargetWeeks(DURATION_PRESETS[p.value][1] ?? DURATION_PRESETS[p.value][0]);
                      }}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        selectedPhase === p.value
                          ? (isPowerPlus ? 'border-red-400 bg-red-50/50' : 'border-amber-400 bg-amber-50/50')
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedPhase === p.value ? 'bg-white shadow-sm' : 'bg-gray-50'
                        }`}>
                          <PhaseIcon className={`h-4 w-4 ${p.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900">{de ? p.de : p.en}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{de ? p.descDe : p.descEn}</div>
                        </div>
                        {selectedPhase === p.value && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPowerPlus ? 'bg-red-400' : 'bg-amber-400'}`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                className={`w-full mt-4 py-3 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  isPowerPlus ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {de ? 'Weiter' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Duration ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-teal-600" />
                <p className="text-sm font-medium text-gray-700">
                  {de ? 'Geplante Dauer:' : 'Planned duration:'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {DURATION_PRESETS[selectedPhase]
                  .filter((w, i, arr) => arr.indexOf(w) === i)
                  .map((weeks) => (
                    <button
                      key={weeks}
                      onClick={() => setTargetWeeks(weeks)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        targetWeeks === weeks
                          ? (isPowerPlus ? 'bg-red-500 text-white shadow-md' : 'bg-amber-500 text-white shadow-md')
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {weeks === 0
                        ? (de ? 'Unbegrenzt' : 'Indefinite')
                        : `${weeks} ${de ? 'Wochen' : 'weeks'}`}
                    </button>
                  ))}
              </div>

              {/* Peak Week warning */}
              {selectedPhase === 'peak_week' && (
                <div className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      {de
                        ? 'Peak Week ist fortgeschritten und potenziell gesundheitsgefährdend. Nur unter Coach-Aufsicht durchführen.'
                        : 'Peak Week is advanced and potentially dangerous. Only perform under coach supervision.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {de ? 'Zurück' : 'Back'}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className={`flex-1 py-3 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    isPowerPlus ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {de ? 'Weiter' : 'Next'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Nutrition + Macro Preview ── */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-teal-600" />
                <p className="text-sm font-medium text-gray-700">
                  {de ? 'Ernährungsziele' : 'Nutrition Targets'}
                </p>
              </div>

              {phaseMacros ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-3">
                      {de
                        ? 'Basierend auf deinem TDEE, Körpergewicht und Phase berechnet:'
                        : 'Calculated from your TDEE, body weight and phase:'}
                    </p>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-white rounded-lg py-2 shadow-sm">
                        <div className="text-lg font-bold text-gray-900">{phaseMacros.calories}</div>
                        <div className="text-[10px] text-gray-500 uppercase">kcal</div>
                      </div>
                      <div className="bg-white rounded-lg py-2 shadow-sm">
                        <div className="text-lg font-bold text-rose-500">{phaseMacros.protein}g</div>
                        <div className="text-[10px] text-gray-500 uppercase">Protein</div>
                      </div>
                      <div className="bg-white rounded-lg py-2 shadow-sm">
                        <div className="text-lg font-bold text-amber-500">{phaseMacros.carbs}g</div>
                        <div className="text-[10px] text-gray-500 uppercase">Carbs</div>
                      </div>
                      <div className="bg-white rounded-lg py-2 shadow-sm">
                        <div className="text-lg font-bold text-blue-500">{phaseMacros.fat}g</div>
                        <div className="text-[10px] text-gray-500 uppercase">{de ? 'Fett' : 'Fat'}</div>
                      </div>
                    </div>

                    {phaseMacros.notes.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {phaseMacros.notes.slice(0, 3).map((note, i) => (
                          <p key={i} className="text-[10px] text-gray-500">
                            • {de ? note.de : note.en}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Apply macros toggle */}
                  <label className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={applyMacros}
                      onChange={(e) => setApplyMacros(e.target.checked)}
                      className="rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {de ? 'Makro-Ziele übernehmen' : 'Apply macro targets'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {de
                          ? 'Kalorien- und Protein-Ziel im Profil aktualisieren'
                          : 'Update calorie and protein goals in your profile'}
                      </p>
                    </div>
                  </label>
                </>
              ) : (
                <div className="bg-amber-50 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {de ? 'Makro-Vorschau nicht verfügbar' : 'Macro preview unavailable'}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        {de
                          ? 'Bitte hinterlege Körperdaten (Gewicht, Größe, Geburtsdatum) im Profil für automatische Berechnung.'
                          : 'Please enter body data (weight, height, birth date) in your profile for automatic calculation.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {de ? 'Zurück' : 'Back'}
                </button>
                <button
                  onClick={() => setStep(4)}
                  className={`flex-1 py-3 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    isPowerPlus ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {de ? 'Weiter' : 'Next'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Training Hints + Confirm ── */}
          {step === 4 && (
            <div>
              {/* Training recommendations based on phase */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="h-4 w-4 text-teal-600" />
                  <p className="text-sm font-medium text-gray-700">
                    {de ? 'Training-Empfehlung' : 'Training Recommendation'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {selectedPhase === 'bulk' && (
                    <>
                      <TrainingHint isDE={de} emoji="💪" de="Progressiver Overload priorisieren — Gewicht/Wiederholungen stetig steigern" en="Prioritize progressive overload — steadily increase weight/reps" />
                      <TrainingHint isDE={de} emoji="📊" de="4-6x Training pro Woche, hohes Volumen (15-25 Sätze pro Muskelgruppe)" en="4-6x training per week, high volume (15-25 sets per muscle group)" />
                      <TrainingHint isDE={de} emoji="⏱️" de="Mesozyklus: 4-6 Wochen Aufbau, dann Deload" en="Mesocycle: 4-6 weeks building, then deload" />
                    </>
                  )}
                  {selectedPhase === 'cut' && (
                    <>
                      <TrainingHint isDE={de} emoji="🛡️" de="Trainingsintensität halten, Volumen um ~20-30% reduzieren" en="Maintain training intensity, reduce volume by ~20-30%" />
                      <TrainingHint isDE={de} emoji="🥩" de="Protein-Priorität: 2.5-3.1g/kg Körpergewicht (Helms 2014)" en="Protein priority: 2.5-3.1g/kg body weight (Helms 2014)" />
                      <TrainingHint isDE={de} emoji="🔄" de="Refeeds einplanen: 1x/Woche High-Carb Tag für Leptin + Leistung" en="Schedule refeeds: 1x/week high-carb day for leptin + performance" />
                    </>
                  )}
                  {selectedPhase === 'maintenance' && (
                    <>
                      <TrainingHint isDE={de} emoji="⚖️" de="Volumen und Intensität auf aktuellem Level halten" en="Maintain volume and intensity at current level" />
                      <TrainingHint isDE={de} emoji="🧘" de="Gute Phase für Technik-Arbeit und Schwachstellen" en="Good phase for technique work and weak points" />
                      <TrainingHint isDE={de} emoji="😴" de="Fokus auf Erholung und Schlafqualität" en="Focus on recovery and sleep quality" />
                    </>
                  )}
                  {selectedPhase === 'reverse_diet' && (
                    <>
                      <TrainingHint isDE={de} emoji="📈" de="Trainingsvolumen schrittweise wieder steigern (+1-2 Sätze/Woche)" en="Gradually increase training volume (+1-2 sets/week)" />
                      <TrainingHint isDE={de} emoji="⚡" de="Leistungssteigerungen erwarten — mehr Energie für Training" en="Expect performance gains — more energy for training" />
                    </>
                  )}
                  {selectedPhase === 'peak_week' && (
                    <>
                      <TrainingHint isDE={de} emoji="⚠️" de="Sehr leichtes Training nur zur Pumpe, kein schweres Heben" en="Very light training for pump only, no heavy lifting" />
                      <TrainingHint isDE={de} emoji="💧" de="Carb-Depletion → Loading → Show Day Protokoll folgen" en="Follow Carb-Depletion → Loading → Show Day protocol" />
                    </>
                  )}
                  {selectedPhase === 'off_season' && (
                    <>
                      <TrainingHint isDE={de} emoji="🌴" de="Reduzierte Frequenz (2-4x/Woche), genussvolles Training" en="Reduced frequency (2-4x/week), enjoyable training" />
                      <TrainingHint isDE={de} emoji="🔋" de="Körper und Gelenke regenerieren, neue Übungen ausprobieren" en="Let body and joints recover, try new exercises" />
                    </>
                  )}
                </div>
              </div>

              {/* Features that are now active */}
              <div className="bg-teal-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-teal-800 mb-2">
                  {de ? 'Jetzt freigeschaltet:' : 'Now unlocked:'}
                </p>
                <div className="space-y-1.5">
                  <FeatureItem isDE={de} de="Phase-basierte Makro-Ziele" en="Phase-based macro targets" />
                  <FeatureItem isDE={de} de="Makro-Cycling Planner (High/Low Carb)" en="Macro Cycling Planner (High/Low Carb)" />
                  <FeatureItem isDE={de} de="Meal-Timing Empfehlungen" en="Meal Timing Recommendations" />
                  <FeatureItem isDE={de} de="Phase-Fortschrittsanzeige" en="Phase Progress Indicator" />
                  <FeatureItem isDE={de} de="Automatische Phasen-Wechsel-Empfehlungen" en="Automatic Phase Transition Recommendations" />
                  {isPowerPlus && (
                    <>
                      <FeatureItem isDE={de} de="Substanz-Zyklus Tracker" en="Substance Cycle Tracker" />
                      <FeatureItem isDE={de} de="Erweiterte Blutbild-Analyse" en="Advanced Blood Work Analysis" />
                      <FeatureItem isDE={de} de="PCT Countdown" en="PCT Countdown" />
                    </>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{de ? 'Phase' : 'Phase'}</span>
                    <span className="font-medium text-gray-900">
                      {de
                        ? PHASES.find((p) => p.value === selectedPhase)?.de
                        : PHASES.find((p) => p.value === selectedPhase)?.en}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{de ? 'Dauer' : 'Duration'}</span>
                    <span className="font-medium text-gray-900">
                      {targetWeeks === 0
                        ? (de ? 'Unbegrenzt' : 'Indefinite')
                        : `${targetWeeks} ${de ? 'Wochen' : 'weeks'}`}
                    </span>
                  </div>
                  {phaseMacros && applyMacros && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{de ? 'Kalorien' : 'Calories'}</span>
                      <span className="font-medium text-gray-900">{phaseMacros.calories} kcal</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">{de ? 'Start' : 'Start'}</span>
                    <span className="font-medium text-gray-900">{de ? 'Heute' : 'Today'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {de ? 'Zurück' : 'Back'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 py-3 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                    isPowerPlus ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {saving
                    ? (de ? 'Speichern...' : 'Saving...')
                    : (de ? 'Phase starten' : 'Start Phase')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small helper components — use `de` prop to pick language */
function TrainingHint({ emoji, de: deTxt, en: enTxt, isDE }: { emoji: string; de: string; en: string; isDE: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm flex-shrink-0">{emoji}</span>
      <p className="text-xs text-gray-700">{isDE ? deTxt : enTxt}</p>
    </div>
  );
}

function FeatureItem({ de: deTxt, en: enTxt, isDE }: { de: string; en: string; isDE: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="h-3 w-3 text-teal-500 flex-shrink-0" />
      <span className="text-xs text-teal-700">{isDE ? deTxt : enTxt}</span>
    </div>
  );
}
