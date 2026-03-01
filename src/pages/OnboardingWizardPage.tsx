/**
 * OnboardingWizardPage — Multi-step wizard for new users after registration.
 * Full-screen experience (no Navigation bar), 5 steps with progress indicator.
 *
 * Steps:
 *   1. Welcome
 *   2. Body Data (name, height, birth_date, gender, weight)
 *   3. Goal & Mode (primary_goal, activity_level, training_mode)
 *   4. Diet & Health (dietary_preferences, allergies, health_restrictions)
 *   5. Done (celebration + navigate to /cockpit)
 *
 * @version 1.0.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Target,
  Utensils,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useProfile, useUpdateProfile } from '../features/auth/hooks/useProfile';
import { useAddBodyMeasurement } from '../features/body/hooks/useBodyMeasurements';
import { TrainingModeSelector } from '../shared/components/TrainingModeSelector';
import { useTranslation } from '../i18n';
import { APP_NAME } from '../lib/constants';
import type { Gender, PrimaryGoal, TrainingMode } from '../types/health';

// ── Constants ──────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const STEP_ICONS = [Sparkles, User, Target, Utensils, Check] as const;

const ACTIVITY_LEVELS: { key: string; pal: number }[] = [
  { key: 'sedentary', pal: 1.2 },
  { key: 'lightly_active', pal: 1.375 },
  { key: 'moderately_active', pal: 1.55 },
  { key: 'very_active', pal: 1.725 },
  { key: 'extremely_active', pal: 1.9 },
];

const PRIMARY_GOALS: PrimaryGoal[] = [
  'muscle_gain',
  'fat_loss',
  'health',
  'performance',
  'body_recomp',
];

const DIET_OPTIONS = [
  'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'glutenFree', 'lactoseFree',
] as const;

const ALLERGY_OPTIONS = [
  'nuts', 'gluten', 'lactose', 'shellfish', 'soy', 'eggs', 'fructose',
] as const;

const HEALTH_RESTRICTION_OPTIONS = [
  'back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle', 'heart', 'neck', 'diastasis_recti',
] as const;

const GENDERS: Gender[] = ['male', 'female', 'other'];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Toggle a value in an array (add if absent, remove if present). */
function toggleChip<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// ── Component ──────────────────────────────────────────────────────────────────

export function OnboardingWizardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const addBody = useAddBodyMeasurement();

  const o = t.onboarding as Record<string, unknown> | undefined;
  const label = (key: string, fallback: string): string =>
    (o && typeof o[key] === 'string' ? o[key] as string : fallback);

  // ── Step state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 2 — Body Data
  const [name, setName] = useState(profile?.display_name ?? '');
  const [heightCm, setHeightCm] = useState<number | ''>(profile?.height_cm ?? '');
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? '');
  const [gender, setGender] = useState<Gender | ''>(profile?.gender ?? '');
  const [weightKg, setWeightKg] = useState<number | ''>('');

  // Step 3 — Goal & Mode
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>('health');
  const [activityLevel, setActivityLevel] = useState(1.55);
  const [trainingMode, setTrainingMode] = useState<TrainingMode>('standard');
  const [powerPlusAccepted, setPowerPlusAccepted] = useState(false);

  // Step 4 — Diet & Health
  const [dietPrefs, setDietPrefs] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [healthRestrictions, setHealthRestrictions] = useState<string[]>([]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const step2Valid = heightCm !== '' && heightCm > 0 && birthDate !== '' && gender !== '';

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = async () => {
    // Step 2 → 3: save initial body measurement
    if (step === 2 && typeof weightKg === 'number' && weightKg > 0) {
      addBody.mutate({ weight_kg: weightKg });
    }

    // Step 4 → 5: save all profile data
    if (step === 4) {
      setSaving(true);
      try {
        await updateProfile.mutateAsync({
          display_name: name || undefined,
          height_cm: typeof heightCm === 'number' ? heightCm : undefined,
          birth_date: birthDate || undefined,
          gender: gender || undefined,
          activity_level: activityLevel,
          training_mode: trainingMode,
          personal_goals: { primary_goal: primaryGoal },
          dietary_preferences: dietPrefs,
          allergies,
          health_restrictions: healthRestrictions,
        });
      } catch {
        // Proceed to step 5 even on error — profile can be updated later
      } finally {
        setSaving(false);
      }
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── Progress Bar ───────────────────────────────────────────────────────────
  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-gradient-to-b from-teal-50 to-white flex flex-col">
      {/* Progress header */}
      {step < TOTAL_STEPS && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>
              {label('stepOf', 'Schritt')} {step} / {TOTAL_STEPS - 1}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => {
                const Icon = STEP_ICONS[i + 1];
                const active = i + 1 <= step;
                return (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      i + 1 === step
                        ? 'bg-teal-500 text-white'
                        : active
                          ? 'bg-teal-200 text-teal-700'
                          : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">

          {/* ── Step 1: Welcome ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="text-center space-y-6 animate-in fade-in">
              <div className="w-20 h-20 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {label('welcomeTitle', `Willkommen bei ${APP_NAME}!`)}
                </h1>
                <p className="text-gray-500 mt-2">
                  {label('welcomeSubtitle', 'Lass uns dein Profil einrichten — dauert nur 2 Minuten.')}
                </p>
              </div>
              <button
                onClick={goNext}
                className="w-full py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {label('start', "Los geht's")}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ── Step 2: Body Data ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {label('bodyTitle', 'Deine Koerperdaten')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {label('bodySubtitle', 'Fuer personalisierte Empfehlungen')}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label('name', 'Name')} <span className="text-gray-400 text-xs">({label('optional', 'optional')})</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={label('namePlaceholder', 'Dein Name')}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>

              {/* Height & Weight row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label('height', 'Groesse (cm)')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                    placeholder="175"
                    min={100}
                    max={250}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label('weight', 'Gewicht (kg)')}
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                    placeholder="80"
                    min={30}
                    max={300}
                    step={0.1}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Birth date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label('birthDate', 'Geburtsdatum')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>

              {/* Gender cards */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {label('gender', 'Geschlecht')} <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        gender === g
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label(`gender_${g}`, g === 'male' ? 'Maennlich' : g === 'female' ? 'Weiblich' : 'Divers')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Goal & Mode ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {label('goalTitle', 'Dein Ziel')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {label('goalSubtitle', 'Was moechtest du erreichen?')}
                </p>
              </div>

              {/* Primary Goal */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {label('primaryGoal', 'Hauptziel')}
                </label>
                {PRIMARY_GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setPrimaryGoal(goal)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      primaryGoal === goal
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-sm">
                      {label(`goal_${goal}`, goal.replace(/_/g, ' '))}
                    </span>
                  </button>
                ))}
              </div>

              {/* Activity Level */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {label('activityLevel', 'Aktivitaetslevel')}
                </label>
                {ACTIVITY_LEVELS.map(({ key, pal }) => (
                  <button
                    key={key}
                    onClick={() => setActivityLevel(pal)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      activityLevel === pal
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-sm">
                      {label(`activity_${key}`, key.replace(/_/g, ' '))}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">PAL {pal}</span>
                  </button>
                ))}
              </div>

              {/* Training Mode */}
              <TrainingModeSelector
                value={trainingMode}
                onChange={setTrainingMode}
                powerPlusAccepted={powerPlusAccepted}
                onAcceptPowerPlus={() => setPowerPlusAccepted(true)}
              />
            </div>
          )}

          {/* ── Step 4: Diet & Health ───────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {label('dietTitle', 'Ernaehrung & Gesundheit')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {label('dietSubtitle', 'Alles optional — hilft dem Buddy, dich besser zu beraten.')}
                </p>
              </div>

              {/* Dietary Preferences */}
              <ChipSection
                title={label('dietaryPreferences', 'Ernaehrungspraeferenzen')}
                icon={<Utensils className="w-4 h-4 text-emerald-500" />}
                options={DIET_OPTIONS}
                selected={dietPrefs}
                onToggle={(v) => setDietPrefs(toggleChip(dietPrefs, v))}
                labelFn={(key) => label(`diet_${key}`, key)}
              />

              {/* Allergies */}
              <ChipSection
                title={label('allergies', 'Allergien / Unvertraeglichkeiten')}
                icon={<Heart className="w-4 h-4 text-red-400" />}
                options={ALLERGY_OPTIONS}
                selected={allergies}
                onToggle={(v) => setAllergies(toggleChip(allergies, v))}
                labelFn={(key) => label(`allergy_${key}`, key)}
              />

              {/* Health Restrictions */}
              <ChipSection
                title={label('healthRestrictions', 'Einschraenkungen / Verletzungen')}
                icon={<Heart className="w-4 h-4 text-amber-500" />}
                options={HEALTH_RESTRICTION_OPTIONS}
                selected={healthRestrictions}
                onToggle={(v) => setHealthRestrictions(toggleChip(healthRestrictions, v))}
                labelFn={(key) => label(`restriction_${key}`, key)}
              />
            </div>
          )}

          {/* ── Step 5: Done ────────────────────────────────────────────────── */}
          {step === 5 && (
            <div className="text-center space-y-6 animate-in fade-in">
              <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                <Check className="w-12 h-12 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {label('doneTitle', 'Alles fertig!')}
                </h1>
                <p className="text-gray-500 mt-2">
                  {label('doneSubtitle', 'Dein Profil ist eingerichtet. Der Buddy kennt dich jetzt.')}
                </p>
              </div>
              <button
                onClick={() => navigate('/cockpit', { replace: true })}
                className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {label('startApp', `${APP_NAME} starten`)}
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Navigation (Steps 2-4) ───────────────────────────────────── */}
      {step >= 2 && step <= 4 && (
        <div className="px-4 pb-6 pt-2">
          <div className="w-full max-w-md mx-auto flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-5 h-5" />
              {label('back', 'Zurueck')}
            </button>
            <button
              onClick={goNext}
              disabled={(step === 2 && !step2Valid) || saving}
              className="flex-1 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === 4 ? label('finish', 'Fertig') : label('next', 'Weiter')}
                  {step < 4 ? <ChevronRight className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ChipSection (inline helper) ────────────────────────────────────────────────

function ChipSection({
  title,
  icon,
  options,
  selected,
  onToggle,
  labelFn,
}: {
  title: string;
  icon: React.ReactNode;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  labelFn: (key: string) => string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                active
                  ? 'bg-teal-100 border-teal-400 text-teal-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {labelFn(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
