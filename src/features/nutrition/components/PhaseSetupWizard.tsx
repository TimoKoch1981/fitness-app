/**
 * PhaseSetupWizard — Bottom sheet wizard for setting up a training phase.
 * Steps: 1) Select phase  2) Duration + preview macros  3) Confirm & save
 * F15: Bodybuilder-Modus
 */

import { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Target, Calendar, Zap } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useProfile, useUpdateProfile } from '../../auth/hooks/useProfile';
import { useLatestBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { calculatePhaseMacros, type PhaseMacros } from '../utils/phaseMacroCalculator';
import { calculateBMR, calculateAge } from '../../../lib/calculations';
import type { TrainingPhase } from '../../../types/health';

interface PhaseSetupWizardProps {
  open: boolean;
  onClose: () => void;
}

const PHASES: { value: TrainingPhase; de: string; en: string; icon: string; descDe: string; descEn: string }[] = [
  { value: 'bulk', de: 'Aufbauphase', en: 'Bulk Phase', icon: '💪', descDe: 'Muskelmasse aufbauen mit kalorischem Überschuss (+300-500 kcal)', descEn: 'Build muscle with caloric surplus (+300-500 kcal)' },
  { value: 'cut', de: 'Definitionsphase', en: 'Cut Phase', icon: '🔥', descDe: 'Körperfett reduzieren bei maximalem Muskelerhalt (-500 kcal, adaptiv)', descEn: 'Reduce body fat while maximizing muscle retention (-500 kcal, adaptive)' },
  { value: 'maintenance', de: 'Erhaltungsphase', en: 'Maintenance', icon: '⚖️', descDe: 'Gewicht und Körperkomposition halten (TDEE)', descEn: 'Maintain weight and body composition (TDEE)' },
  { value: 'reverse_diet', de: 'Reverse Diet', en: 'Reverse Diet', icon: '📈', descDe: 'Kalorien nach Diät langsam steigern (+100 kcal/Woche)', descEn: 'Slowly increase calories after diet (+100 kcal/week)' },
  { value: 'peak_week', de: 'Peak Week', en: 'Peak Week', icon: '🏆', descDe: '7-Tage-Wettkampfvorbereitung (Carb Depletion → Loading)', descEn: '7-day competition prep (Carb Depletion → Loading)' },
  { value: 'off_season', de: 'Off-Season', en: 'Off-Season', icon: '🌴', descDe: 'Erholung und lockerer Aufbau ohne striktes Tracking', descEn: 'Recovery and relaxed building without strict tracking' },
];

const DURATION_PRESETS: Record<TrainingPhase, number[]> = {
  bulk: [8, 12, 16, 20],
  cut: [8, 12, 16, 20],
  maintenance: [4, 8, 12, 0], // 0 = indefinite
  reverse_diet: [4, 6, 8, 12],
  peak_week: [1, 1, 1, 1], // always 1 week
  off_season: [4, 8, 0, 0], // 0 = indefinite
};

export function PhaseSetupWizard({ open, onClose }: PhaseSetupWizardProps) {
  const { language } = useTranslation();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: latestBody } = useLatestBodyMeasurement();

  const [step, setStep] = useState(1);
  const [selectedPhase, setSelectedPhase] = useState<TrainingPhase>(profile?.current_phase ?? 'maintenance');
  const [targetWeeks, setTargetWeeks] = useState(12);
  const [saving, setSaving] = useState(false);

  const de = language === 'de';

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
      await updateProfile.mutateAsync({
        current_phase: selectedPhase,
        phase_started_at: new Date().toISOString(),
        phase_target_weeks: targetWeeks || undefined,
      });
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
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-600" />
            <h2 className="font-bold text-gray-900">
              {de ? 'Phase einrichten' : 'Setup Phase'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-4 pt-3 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-teal-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="px-4 pb-6 pt-3">
          {/* Step 1: Select Phase */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {de ? 'Wähle deine aktuelle Trainingsphase:' : 'Select your current training phase:'}
              </p>
              <div className="space-y-2">
                {PHASES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setSelectedPhase(p.value);
                      setTargetWeeks(DURATION_PRESETS[p.value][1] || DURATION_PRESETS[p.value][0]);
                    }}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                      selectedPhase === p.value
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{de ? p.de : p.en}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{de ? p.descDe : p.descEn}</div>
                      </div>
                      {selectedPhase === p.value && (
                        <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full mt-4 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
              >
                {de ? 'Weiter' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Duration + Macro Preview */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-teal-600" />
                <p className="text-sm text-gray-600">
                  {de ? 'Geplante Dauer:' : 'Planned duration:'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {DURATION_PRESETS[selectedPhase]
                  .filter((w, i, arr) => arr.indexOf(w) === i) // unique
                  .map((weeks) => (
                    <button
                      key={weeks}
                      onClick={() => setTargetWeeks(weeks)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        targetWeeks === weeks
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {weeks === 0
                        ? (de ? 'Unbegrenzt' : 'Indefinite')
                        : `${weeks} ${de ? 'Wochen' : 'weeks'}`
                      }
                    </button>
                  ))}
              </div>

              {/* Macro Preview */}
              {phaseMacros && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold text-sm text-gray-900">
                      {de ? 'Berechnete Makro-Ziele' : 'Calculated Macro Targets'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{phaseMacros.calories}</div>
                      <div className="text-[10px] text-gray-500 uppercase">kcal</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-rose-500">{phaseMacros.protein}g</div>
                      <div className="text-[10px] text-gray-500 uppercase">Protein</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber-500">{phaseMacros.carbs}g</div>
                      <div className="text-[10px] text-gray-500 uppercase">Carbs</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-500">{phaseMacros.fat}g</div>
                      <div className="text-[10px] text-gray-500 uppercase">{de ? 'Fett' : 'Fat'}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {phaseMacros.notes.slice(0, 3).map((note, i) => (
                      <p key={i} className="text-[10px] text-gray-500">
                        {de ? note.de : note.en}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {!phaseMacros && (
                <div className="bg-amber-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-amber-700">
                    {de
                      ? 'Makro-Vorschau nicht verfügbar. Bitte Körperdaten (Gewicht, Größe, Geburtsdatum) im Profil hinterlegen.'
                      : 'Macro preview unavailable. Please enter body data (weight, height, birth date) in your profile.'}
                  </p>
                </div>
              )}

              {selectedPhase === 'peak_week' && (
                <div className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
                  <p className="text-xs text-red-700 font-medium">
                    ⚠️ {de
                      ? 'Peak Week ist fortgeschritten und potenziell gesundheitsgefährdend. Nur unter Coach-Aufsicht durchführen.'
                      : 'Peak Week is advanced and potentially dangerous. Only perform under coach supervision.'}
                  </p>
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
                  className="flex-1 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                  {de ? 'Weiter' : 'Next'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm & Save */}
          {step === 3 && (
            <div>
              <div className="bg-teal-50 rounded-xl p-4 mb-4">
                <h3 className="font-semibold text-teal-900 mb-2">
                  {de ? 'Zusammenfassung' : 'Summary'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{de ? 'Phase' : 'Phase'}</span>
                    <span className="font-medium text-gray-900">
                      {PHASES.find((p) => p.value === selectedPhase)?.icon}{' '}
                      {de
                        ? PHASES.find((p) => p.value === selectedPhase)?.de
                        : PHASES.find((p) => p.value === selectedPhase)?.en}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{de ? 'Dauer' : 'Duration'}</span>
                    <span className="font-medium text-gray-900">
                      {targetWeeks === 0
                        ? (de ? 'Unbegrenzt' : 'Indefinite')
                        : `${targetWeeks} ${de ? 'Wochen' : 'weeks'}`}
                    </span>
                  </div>
                  {phaseMacros && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{de ? 'Kalorien' : 'Calories'}</span>
                      <span className="font-medium text-gray-900">{phaseMacros.calories} kcal</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">{de ? 'Start' : 'Start'}</span>
                    <span className="font-medium text-gray-900">{de ? 'Heute' : 'Today'}</span>
                  </div>
                </div>
              </div>

              {profile?.current_phase && profile.current_phase !== selectedPhase && (
                <div className="bg-amber-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-amber-700">
                    {de
                      ? `Aktuelle Phase "${PHASES.find((p) => p.value === profile.current_phase)?.de}" wird ersetzt.`
                      : `Current phase "${PHASES.find((p) => p.value === profile.current_phase)?.en}" will be replaced.`}
                  </p>
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
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
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
