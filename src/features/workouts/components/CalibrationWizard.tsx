/**
 * CalibrationWizard — 3-Screen Dialog fuer Startgewicht-Onboarding
 *
 * Screen 1: Erfahrungs-Level (Anfaenger / Fortgeschritten / Erfahren)
 * Screen 2: Gewichte-Vorschau (BW-Multiplier × Koerpergewicht) + manuelle Korrektur
 * Screen 3: Review-Einstellungen (Mesozyklus, Deload, KI-Trainer Toggle)
 *
 * Konzept: docs/KONZEPT_KI_TRAINER.md Block B
 */

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Dumbbell, Settings, User } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useProfile } from '../../auth/hooks/useProfile';
import { useLatestBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { useUpdateTrainingPlanCalibration } from '../hooks/useTrainingPlans';
import {
  calibrateAllExercises,
  getSmartPreset,
  getDefaultReviewTriggers,
  type ExperienceLevel,
  type CalibrationExercise,
} from '../hooks/useCalibration';
import type { TrainingPlan, ReviewConfig } from '../../../types/health';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CalibrationWizardProps {
  plan: TrainingPlan;
  onComplete: () => void;
  onSkip: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalibrationWizard({ plan, onComplete, onSkip }: CalibrationWizardProps) {
  const { t, language } = useTranslation();
  const { data: profile } = useProfile();
  const { data: latestBody } = useLatestBodyMeasurement();
  const updateCalibration = useUpdateTrainingPlanCalibration();

  // i18n helper (pattern from OnboardingWizardPage)
  const c = t.calibration as Record<string, unknown> | undefined;
  const label = (key: string, fallback: string): string =>
    c && typeof c[key] === 'string' ? (c[key] as string) : fallback;

  // Step management
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Screen 1: Experience
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);

  // Screen 2: Calibrated weights
  const [calibrationExercises, setCalibrationExercises] = useState<CalibrationExercise[]>([]);

  // Screen 3: Review settings
  const [mesocycleWeeks, setMesocycleWeeks] = useState(4);
  const [deloadWeek, setDeloadWeek] = useState(4);
  const [aiTrainerEnabled, setAiTrainerEnabled] = useState(true);

  // Derived
  const bodyWeight = latestBody?.weight_kg ?? null;
  const gender = profile?.gender ?? 'other';
  const trainingMode = profile?.training_mode ?? 'standard';

  // Progress bar
  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  // Step icons
  const stepIcons = [User, Dumbbell, Settings];

  // ── Navigation ──────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 1 && experienceLevel) {
      // Compute calibration exercises for Screen 2
      if (bodyWeight && plan.days) {
        const exercises = calibrateAllExercises(plan.days, bodyWeight, experienceLevel, gender);
        setCalibrationExercises(exercises);
      }
      // Apply smart preset for Screen 3
      const preset = getSmartPreset(experienceLevel, trainingMode);
      setMesocycleWeeks(preset.mesocycle_weeks);
      setDeloadWeek(preset.deload_week);
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!plan.days || !experienceLevel) return;
    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const reviewConfig: ReviewConfig = {
        mesocycle_weeks: mesocycleWeeks,
        deload_week: deloadWeek,
        review_triggers: getDefaultReviewTriggers(),
        current_week: 1,
        mesocycle_start: today,
        last_review: null,
        next_review: null,
        experience_level: experienceLevel,
        calibration_done: true,
      };

      // Merge calibrated weights into each day's exercises
      const dayUpdates = plan.days.map((day) => {
        const updatedExercises = day.exercises.map((ex, exIdx) => {
          const calibrated = calibrationExercises.find(
            (ce) => ce.planDayId === day.id && ce.exerciseIndex === exIdx,
          );
          if (calibrated && (calibrated.userWeight ?? calibrated.suggestedWeight)) {
            return { ...ex, weight_kg: calibrated.userWeight ?? calibrated.suggestedWeight ?? undefined };
          }
          return ex;
        });
        return { dayId: day.id, exercises: updatedExercises };
      });

      await updateCalibration.mutateAsync({
        planId: plan.id,
        ai_supervised: aiTrainerEnabled,
        review_config: reviewConfig,
        dayUpdates,
      });

      console.log('[CalibrationWizard] ✅ Calibration complete');
      onComplete();
    } catch (err) {
      console.error('[CalibrationWizard] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Update exercise weight ──────────────────────────────────────────────

  const updateExerciseWeight = (idx: number, value: string) => {
    const updated = [...calibrationExercises];
    updated[idx] = {
      ...updated[idx],
      userWeight: value ? parseFloat(value) : null,
    };
    setCalibrationExercises(updated);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  const experienceLevels: { key: ExperienceLevel; icon: string }[] = [
    { key: 'beginner', icon: '🌱' },
    { key: 'intermediate', icon: '💪' },
    { key: 'advanced', icon: '🏆' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onSkip} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        {/* ── Header ── */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <h3 className="font-semibold text-gray-900 text-sm">
            {label('title', 'Trainingsplan konfigurieren')}
          </h3>
          <button onClick={onSkip} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* ── Progress ── */}
        <div className="px-4 pt-3">
          {/* Step icons */}
          <div className="flex items-center justify-center gap-6 mb-2">
            {stepIcons.map((Icon, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  idx + 1 <= step
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>
              {label('stepOf', 'Schritt {step} von {total}')
                .replace('{step}', String(step))
                .replace('{total}', String(TOTAL_STEPS))}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-4">
          {/* ════════════ Screen 1: Experience Level ════════════ */}
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {label('experienceTitle', 'Wie erfahren bist du?')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {label('experienceSubtitle', 'Fuer die Berechnung deiner Startgewichte')}
                </p>
              </div>

              {experienceLevels.map(({ key, icon }) => (
                <button
                  key={key}
                  onClick={() => setExperienceLevel(key)}
                  className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
                    experienceLevel === key
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <span className="font-medium text-sm text-gray-900">
                        {label(key, key)}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {label(`${key}Desc`, '')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Navigation */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={onSkip}
                  className="flex-1 py-3 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all"
                >
                  {label('skipCalibration', 'Spaeter konfigurieren')}
                </button>
                <button
                  onClick={goNext}
                  disabled={!experienceLevel}
                  className="flex-1 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  {label('next', 'Weiter')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ════════════ Screen 2: Weight Preview ════════════ */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="mb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {label('weightsTitle', 'Startgewichte')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {bodyWeight
                    ? label('weightsSubtitle', 'Basierend auf deinem Koerpergewicht ({bw} kg).')
                        .replace('{bw}', String(bodyWeight))
                    : label('weightsNoBodyWeight', 'Bitte trage dein Koerpergewicht im Profil ein.')}
                </p>
              </div>

              {/* Column headers */}
              <div className="flex items-center gap-3 text-xs font-medium text-gray-400 border-b border-gray-100 pb-1">
                <div className="flex-1">{label('exerciseCol', 'Uebung')}</div>
                <div className="w-16 text-center">{label('suggestedCol', 'Vorschlag')}</div>
                <div className="w-20 text-center">{label('yourWeightCol', 'Dein Gewicht')}</div>
              </div>

              {/* Exercise rows */}
              {calibrationExercises.length > 0 ? (
                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                  {calibrationExercises.map((ex, idx) => (
                    <div
                      key={`${ex.planDayId}-${ex.exerciseIndex}`}
                      className="flex items-center gap-3 py-2 border-b border-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{ex.name}</p>
                        {ex.matchedReference ? (
                          <p className="text-[10px] text-teal-500">
                            ≈ {ex.matchedReference}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400">
                            {label('noMatch', 'Kein Vorschlag')}
                          </p>
                        )}
                      </div>
                      <div className="w-16 text-center text-xs text-gray-400">
                        {ex.suggestedWeight ? `${ex.suggestedWeight}` : '–'}
                      </div>
                      <div className="w-20 flex items-center gap-1">
                        <input
                          type="number"
                          inputMode="decimal"
                          step={2.5}
                          min={0}
                          value={ex.userWeight ?? ''}
                          onChange={(e) => updateExerciseWeight(idx, e.target.value)}
                          placeholder={ex.suggestedWeight?.toString() ?? '–'}
                          className="w-16 px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        />
                        <span className="text-[10px] text-gray-400">kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">
                  {bodyWeight
                    ? language === 'de' ? 'Keine Kraft-Uebungen im Plan gefunden.' : 'No strength exercises found in plan.'
                    : label('weightsNoBodyWeight', 'Bitte trage dein Koerpergewicht im Profil ein.')}
                </p>
              )}

              {/* Hint */}
              <p className="text-xs text-teal-600 bg-teal-50 px-3 py-2 rounded-lg">
                💡 {label('weightsHint', 'Keine Sorge — die Gewichte werden in den ersten Sessions automatisch angepasst.')}
              </p>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={goBack}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {label('back', 'Zurueck')}
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                >
                  {label('next', 'Weiter')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ════════════ Screen 3: Review Settings ════════════ */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="mb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {label('reviewTitle', 'KI-Trainer Einstellungen')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {label('reviewSubtitle', 'Wie soll der KI-Trainer deinen Fortschritt ueberwachen?')}
                </p>
              </div>

              {/* Mesocycle weeks */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  {label('mesocycleLabel', 'Mesozyklus-Laenge (Wochen)')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={8}
                    value={mesocycleWeeks}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMesocycleWeeks(v);
                      if (deloadWeek > v) setDeloadWeek(v);
                    }}
                    className="flex-1 accent-teal-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 w-8 text-center">
                    {mesocycleWeeks}
                  </span>
                </div>
              </div>

              {/* Deload week */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  {label('deloadLabel', 'Deload nach Woche')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={mesocycleWeeks}
                    value={deloadWeek}
                    onChange={(e) => setDeloadWeek(Number(e.target.value))}
                    className="flex-1 accent-teal-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 w-8 text-center">
                    {deloadWeek}
                  </span>
                </div>
              </div>

              {/* Smart preset hint */}
              <div className="bg-gray-50 px-3 py-2 rounded-lg">
                <p className="text-xs text-gray-500">
                  📊 {label('presetLabel', 'Empfehlung')}:{' '}
                  <span className="font-medium text-gray-700">
                    {mesocycleWeeks} {language === 'de' ? 'Wochen' : 'weeks'}, Deload {language === 'de' ? 'Woche' : 'week'} {deloadWeek}
                  </span>
                </p>
              </div>

              {/* AI Trainer toggle */}
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex-1 pr-3">
                  <p className="text-sm font-medium text-gray-700">
                    🤖 {label('aiTrainerLabel', 'KI-Trainer aktivieren')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {label('aiTrainerHint', 'Automatische Fortschrittsanalyse und Anpassungsvorschlaege nach jeder Session.')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={aiTrainerEnabled}
                    onChange={(e) => setAiTrainerEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500" />
                </label>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={goBack}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {label('back', 'Zurueck')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {saving
                    ? label('saving', 'Speichern...')
                    : label('save', 'Speichern & Starten')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
