import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Shield, HelpCircle, Check, AlertCircle, Calculator, FileText, MessageSquare, Lightbulb, Download } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation, LANGUAGE_OPTIONS, type Language, type FontSize } from '../i18n';
import { useProfile, useUpdateProfile } from '../features/auth/hooks/useProfile';
import { AvatarUpload } from '../features/auth/components/AvatarUpload';
import { NotificationSettings } from '../features/notifications/components/NotificationSettings';
import { EquipmentSelector } from '../features/equipment/components/EquipmentSelector';
import { FeedbackDialog } from '../features/feedback/components/FeedbackDialog';
import { useDebouncedCallback } from '../shared/hooks/useDebounce';
import { calculateRecommendedGoals } from '../lib/calculations';
import type { RecommendedGoals } from '../lib/calculations';
import { useLatestBodyMeasurement } from '../features/body/hooks/useBodyMeasurements';
import { PAL_FACTORS } from '../lib/constants';
import { DisclaimerModal as DisclaimerModalView } from '../shared/components/DisclaimerModal';
import { DeleteAccountDialog } from '../features/auth/components/DeleteAccountDialog';
import { DataExportDialog } from '../features/auth/components/DataExportDialog';
import { PrivacySettings } from '../features/auth/components/PrivacySettings';
import type { Gender, BMRFormula, PrimaryGoal, TrainingMode } from '../types/health';
import { TrainingModeSelector } from '../shared/components/TrainingModeSelector';

export function ProfilePage() {
  const { user, signOut, isAdmin } = useAuth();
  const { t, language, setLanguage, fontSize, setFontSize } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Local form state
  const [displayName, setDisplayName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [activityLevel, setActivityLevel] = useState(PAL_FACTORS.lightly_active.toString());
  const [bmrFormula, setBmrFormula] = useState<BMRFormula>('auto');
  const [caloriesGoal, setCaloriesGoal] = useState('2000');
  const [proteinGoal, setProteinGoal] = useState('150');
  const [waterGoal, setWaterGoal] = useState('8');
  // Personal goals
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | ''>('');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetBodyFat, setTargetBodyFat] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goalNotes, setGoalNotes] = useState('');
  // Dietary & Health
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [healthRestrictions, setHealthRestrictions] = useState<string[]>([]);
  // BMR Help toggle
  const [showBmrHelp, setShowBmrHelp] = useState(false);
  // Disclaimer viewer
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  // Delete account dialog
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  // Data export dialog
  const [showDataExport, setShowDataExport] = useState(false);
  // Feedback dialog
  const [showFeedback, setShowFeedback] = useState(false);
  // Goal recommendation
  const [recommendedGoals, setRecommendedGoals] = useState<RecommendedGoals | null>(null);
  const { data: latestBody } = useLatestBodyMeasurement();
  // Auto-save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if initial hydration from server is done — prevent auto-save on first load
  const isHydratedRef = useRef(false);

  // Sync profile data into form (hydration)
  useEffect(() => {
    if (profile) {
      isHydratedRef.current = false; // Pause auto-save during hydration
      setDisplayName(profile.display_name ?? '');
      setHeightCm(profile.height_cm?.toString() ?? '');
      setBirthDate(profile.birth_date ?? '');
      setGender(profile.gender ?? 'male');
      setActivityLevel(profile.activity_level?.toString() ?? PAL_FACTORS.lightly_active.toString());
      setBmrFormula(profile.preferred_bmr_formula ?? 'auto');
      setCaloriesGoal(profile.daily_calories_goal?.toString() ?? '2000');
      setProteinGoal(profile.daily_protein_goal?.toString() ?? '150');
      setWaterGoal(profile.daily_water_goal?.toString() ?? '8');
      setPrimaryGoal(profile.personal_goals?.primary_goal ?? '');
      setTargetWeight(profile.personal_goals?.target_weight_kg?.toString() ?? '');
      setTargetBodyFat(profile.personal_goals?.target_body_fat_pct?.toString() ?? '');
      setTargetDate(profile.personal_goals?.target_date ?? '');
      setGoalNotes(profile.personal_goals?.notes ?? '');
      setDietaryPreferences(profile.dietary_preferences ?? []);
      setAllergies(profile.allergies ?? []);
      setHealthRestrictions(profile.health_restrictions ?? []);
      // Mark hydrated after a longer delay so all React state batching + renders complete.
      // requestAnimationFrame was too short (single frame) and could race with auto-save.
      setTimeout(() => {
        isHydratedRef.current = true;
      }, 300);
    }
  }, [profile]);

  // Refs that hold the latest form values (for the debounced save to read)
  const formRef = useRef({
    displayName: '', heightCm: '', birthDate: '', gender: 'male' as Gender,
    activityLevel: '', bmrFormula: 'auto' as BMRFormula,
    caloriesGoal: '', proteinGoal: '', waterGoal: '',
    primaryGoal: '' as PrimaryGoal | '', targetWeight: '', targetBodyFat: '',
    targetDate: '', goalNotes: '',
    dietaryPreferences: [] as string[], allergies: [] as string[], healthRestrictions: [] as string[],
  });

  // Keep formRef in sync
  formRef.current = {
    displayName, heightCm, birthDate, gender, activityLevel, bmrFormula,
    caloriesGoal, proteinGoal, waterGoal,
    primaryGoal, targetWeight, targetBodyFat, targetDate, goalNotes,
    dietaryPreferences, allergies, healthRestrictions,
  };

  const showSaveStatus = useCallback((status: 'saved' | 'error') => {
    setSaveStatus(status);
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
  }, []);

  // Single auto-save function that saves ALL form state at once
  const autoSave = useDebouncedCallback(async () => {
    if (!isHydratedRef.current) return;
    const f = formRef.current;
    try {
      await updateProfile.mutateAsync({
        display_name: f.displayName || undefined,
        height_cm: f.heightCm ? parseFloat(f.heightCm) : undefined,
        birth_date: f.birthDate || undefined,
        gender: f.gender,
        activity_level: parseFloat(f.activityLevel),
        preferred_bmr_formula: f.bmrFormula,
        daily_calories_goal: parseInt(f.caloriesGoal) || 2000,
        daily_protein_goal: parseInt(f.proteinGoal) || 150,
        daily_water_goal: parseInt(f.waterGoal) || 8,
        personal_goals: {
          primary_goal: f.primaryGoal || undefined,
          target_weight_kg: f.targetWeight ? parseFloat(f.targetWeight) : undefined,
          target_body_fat_pct: f.targetBodyFat ? parseFloat(f.targetBodyFat) : undefined,
          target_date: f.targetDate || undefined,
          notes: f.goalNotes || undefined,
        },
        dietary_preferences: f.dietaryPreferences,
        allergies: f.allergies,
        health_restrictions: f.healthRestrictions,
      });
      showSaveStatus('saved');
    } catch {
      showSaveStatus('error');
    }
  }, 800);

  // Wrapper: update local state + trigger auto-save
  const handleChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (value: T) => {
      setter(value);
      // Trigger save after state update (next tick so formRef is updated)
      requestAnimationFrame(() => autoSave());
    };

  const palOptions = [
    { value: PAL_FACTORS.sedentary.toString(), label: language === 'de' ? 'Sitzend (1.4)' : 'Sedentary (1.4)' },
    { value: PAL_FACTORS.lightly_active.toString(), label: language === 'de' ? 'Leicht aktiv (1.55)' : 'Lightly Active (1.55)' },
    { value: PAL_FACTORS.moderately_active.toString(), label: language === 'de' ? 'Moderat aktiv (1.7)' : 'Moderately Active (1.7)' },
    { value: PAL_FACTORS.very_active.toString(), label: language === 'de' ? 'Sehr aktiv (1.9)' : 'Very Active (1.9)' },
    { value: PAL_FACTORS.extremely_active.toString(), label: language === 'de' ? 'Extrem aktiv (2.2)' : 'Extremely Active (2.2)' },
  ];

  return (
    <PageShell title={t.profile.title}>
      <div className="space-y-4">
        {/* Auto-Save Status Indicator */}
        {saveStatus !== 'idle' && (
          <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-all ${
            saveStatus === 'saved'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {saveStatus === 'saved' ? (
              <><Check className="h-3.5 w-3.5" />{t.profile.autoSaved}</>
            ) : (
              <><AlertCircle className="h-3.5 w-3.5" />{t.common.saveError}</>
            )}
          </div>
        )}

        {/* User Info + Avatar */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <AvatarUpload
            avatarUrl={profile?.avatar_url}
            displayName={profile?.display_name}
          />
          <div>
            <p className="font-semibold text-gray-900">
              {profile?.display_name ?? user?.email ?? 'Benutzer'}
            </p>
            <p className="text-xs text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Language Switch */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t.profile.settings}</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t.profile.language}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.flag} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-gray-600">{t.profile.fontSize}</span>
            <div className="flex gap-1">
              {([
                ['small', t.profile.fontSizeSmall],
                ['normal', t.profile.fontSizeNormal],
                ['large', t.profile.fontSizeLarge],
                ['xlarge', t.profile.fontSizeXLarge],
              ] as const).map(([size, label]) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size as FontSize)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    fontSize === size
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Personal Data */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t.profile.personalData}</h3>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {language === 'de' ? 'Anzeigename' : 'Display Name'}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => handleChange(setDisplayName)(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t.profile.height} (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => handleChange(setHeightCm)(e.target.value)}
                    placeholder="180"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="100"
                    max="250"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t.profile.birthDate}
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => handleChange(setBirthDate)(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t.profile.gender}
                  </label>
                  <div className="flex gap-1">
                    {([['male', t.profile.male], ['female', t.profile.female], ['other', t.profile.other]] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleChange(setGender)(val as Gender)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          gender === val
                            ? 'bg-teal-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t.profile.bmrFormula}
                  </label>
                  <select
                    value={bmrFormula}
                    onChange={(e) => handleChange(setBmrFormula)(e.target.value as BMRFormula)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm bg-white"
                  >
                    <option value="auto">{t.profile.auto}</option>
                    <option value="mifflin">{t.profile.mifflin}</option>
                    <option value="katch">{t.profile.katch}</option>
                  </select>
                </div>
              </div>

              {/* BMR Formula Help */}
              <button
                type="button"
                onClick={() => setShowBmrHelp(!showBmrHelp)}
                className="flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {t.profile.bmrHelpToggle}
              </button>
              {showBmrHelp && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-[10px] text-gray-600 leading-relaxed">
                  <p><span className="font-semibold text-gray-700">{t.profile.auto}:</span> {t.profile.bmrHelpAuto.split(': ').slice(1).join(': ')}</p>
                  <p><span className="font-semibold text-gray-700">{t.profile.mifflin}:</span> {t.profile.bmrHelpMifflin.split(': ').slice(1).join(': ')}</p>
                  <p><span className="font-semibold text-gray-700">{t.profile.katch}:</span> {t.profile.bmrHelpKatch.split(': ').slice(1).join(': ')}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.profile.activityLevel}
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => handleChange(setActivityLevel)(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm bg-white"
                >
                  {palOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Dietary & Health */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">
            {language === 'de' ? 'Ernährung & Gesundheit' : 'Diet & Health'}
          </h3>

          <div className="space-y-4">
            {/* Dietary Preferences */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {language === 'de' ? 'Ernährungsform' : 'Dietary Preferences'}
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'vegetarian', de: 'Vegetarisch', en: 'Vegetarian' },
                  { value: 'vegan', de: 'Vegan', en: 'Vegan' },
                  { value: 'pescatarian', de: 'Pescatarisch', en: 'Pescatarian' },
                  { value: 'halal', de: 'Halal', en: 'Halal' },
                  { value: 'kosher', de: 'Koscher', en: 'Kosher' },
                  { value: 'lactose_free', de: 'Laktosefrei', en: 'Lactose-free' },
                  { value: 'gluten_free', de: 'Glutenfrei', en: 'Gluten-free' },
                ] as const).map((opt) => {
                  const isSelected = dietaryPreferences.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const next = isSelected
                          ? dietaryPreferences.filter(v => v !== opt.value)
                          : [...dietaryPreferences, opt.value];
                        handleChange(setDietaryPreferences)(next);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {language === 'de' ? opt.de : opt.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {language === 'de' ? 'Allergien & Unverträglichkeiten' : 'Allergies & Intolerances'}
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'nuts', de: 'Nüsse', en: 'Nuts' },
                  { value: 'gluten', de: 'Gluten', en: 'Gluten' },
                  { value: 'lactose', de: 'Laktose', en: 'Lactose' },
                  { value: 'shellfish', de: 'Schalentiere', en: 'Shellfish' },
                  { value: 'eggs', de: 'Eier', en: 'Eggs' },
                  { value: 'soy', de: 'Soja', en: 'Soy' },
                  { value: 'wheat', de: 'Weizen', en: 'Wheat' },
                ] as const).map((opt) => {
                  const isSelected = allergies.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const next = isSelected
                          ? allergies.filter(v => v !== opt.value)
                          : [...allergies, opt.value];
                        handleChange(setAllergies)(next);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {language === 'de' ? opt.de : opt.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Health Restrictions */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {language === 'de' ? 'Gesundheitliche Einschränkungen' : 'Health Restrictions'}
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'back', de: 'Rücken', en: 'Back' },
                  { value: 'shoulder', de: 'Schulter', en: 'Shoulder' },
                  { value: 'knee', de: 'Knie', en: 'Knee' },
                  { value: 'hip', de: 'Hüfte', en: 'Hip' },
                  { value: 'wrist', de: 'Handgelenk', en: 'Wrist' },
                  { value: 'neck', de: 'Nacken', en: 'Neck' },
                  { value: 'diastasis_recti', de: 'Rektusdiastase', en: 'Diastasis Recti' },
                ] as const).map((opt) => {
                  const isSelected = healthRestrictions.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const next = isSelected
                          ? healthRestrictions.filter(v => v !== opt.value)
                          : [...healthRestrictions, opt.value];
                        handleChange(setHealthRestrictions)(next);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {language === 'de' ? opt.de : opt.en}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                {language === 'de'
                  ? 'Der KI-Assistent berücksichtigt diese Einschränkungen bei Trainingsempfehlungen.'
                  : 'The AI assistant considers these restrictions when recommending exercises.'}
              </p>
            </div>
          </div>
        </div>

        {/* Daily Goals */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t.profile.goals}</h3>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.profile.caloriesGoal}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={caloriesGoal}
                    onChange={(e) => handleChange(setCaloriesGoal)(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="1000"
                    max="10000"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">kcal</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.profile.proteinGoal}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={proteinGoal}
                    onChange={(e) => handleChange(setProteinGoal)(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="50"
                    max="500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">g</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.profile.waterGoal}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={waterGoal}
                    onChange={(e) => handleChange(setWaterGoal)(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="1"
                    max="20"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {t.dashboard.glasses}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculate Recommended Goals */}
            <button
              type="button"
              onClick={() => {
                const hCm = parseFloat(heightCm);
                if (!latestBody?.weight_kg || !hCm || !birthDate) {
                  setRecommendedGoals(null);
                  return;
                }
                const result = calculateRecommendedGoals({
                  weight_kg: latestBody.weight_kg,
                  height_cm: hCm,
                  birth_date: birthDate,
                  gender: gender,
                  activity_level: parseFloat(activityLevel) || 1.55,
                  preferred_bmr_formula: bmrFormula,
                  body_fat_pct: latestBody.body_fat_pct,
                  primary_goal: (primaryGoal || undefined) as PrimaryGoal | undefined,
                  lean_mass_kg: latestBody.lean_mass_kg,
                });
                setRecommendedGoals(result);
              }}
              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
            >
              <Calculator className="h-3.5 w-3.5" />
              {t.profile.calculateGoals}
            </button>

            {/* Recommendation Card */}
            {recommendedGoals === null && !latestBody?.weight_kg && (
              <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                {t.profile.insufficientData}
              </p>
            )}
            {recommendedGoals && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-teal-800">{t.profile.recommendedValues}</p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-teal-700">
                  <div>
                    <span className="block text-teal-500">{t.profile.caloriesGoal}</span>
                    <span className="font-bold">{recommendedGoals.calories} kcal</span>
                  </div>
                  <div>
                    <span className="block text-teal-500">{t.profile.proteinGoal}</span>
                    <span className="font-bold">{recommendedGoals.protein}g</span>
                  </div>
                  <div>
                    <span className="block text-teal-500">{t.profile.waterGoal}</span>
                    <span className="font-bold">{recommendedGoals.water_glasses} {t.dashboard.glasses}</span>
                  </div>
                </div>
                <div className="text-[9px] text-teal-500">
                  BMR: {recommendedGoals.bmr} kcal ({recommendedGoals.bmr_formula === 'katch' ? t.profile.katch : t.profile.mifflin}) | TDEE: {recommendedGoals.tdee} kcal
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleChange(setCaloriesGoal)(recommendedGoals.calories.toString());
                    handleChange(setProteinGoal)(recommendedGoals.protein.toString());
                    handleChange(setWaterGoal)(recommendedGoals.water_glasses.toString());
                    setRecommendedGoals(null);
                  }}
                  className="w-full mt-1 py-1.5 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600 transition-colors"
                >
                  {t.profile.applyRecommendation}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Personal Goals */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t.profile.personalGoals}</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.profile.goalType}
              </label>
              <div className="flex gap-1 flex-wrap">
                {([
                  ['muscle_gain', t.profile.goalMuscle],
                  ['fat_loss', t.profile.goalFatLoss],
                  ['health', t.profile.goalHealth],
                  ['performance', t.profile.goalPerformance],
                  ['body_recomp', t.profile.goalRecomp],
                ] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleChange(setPrimaryGoal)(primaryGoal === val ? '' : val)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      primaryGoal === val
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.profile.targetWeight}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={(e) => handleChange(setTargetWeight)(e.target.value)}
                    placeholder="85"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="30"
                    max="300"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">kg</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.profile.targetBodyFat}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetBodyFat}
                    onChange={(e) => handleChange(setTargetBodyFat)(e.target.value)}
                    placeholder="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="3"
                    max="50"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.profile.targetDate}
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => handleChange(setTargetDate)(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.profile.goalNotes}
              </label>
              <input
                type="text"
                value={goalNotes}
                onChange={(e) => handleChange(setGoalNotes)(e.target.value)}
                placeholder={language === 'de' ? 'z.B. Sixpack bis Sommer' : 'e.g. Get a sixpack by summer'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Training Mode Selector (Standard / Power / Power+) */}
        <TrainingModeSelector
          value={(profile?.training_mode as TrainingMode) ?? 'standard'}
          onChange={async (mode: TrainingMode) => {
            try {
              await updateProfile.mutateAsync({ training_mode: mode });
              showSaveStatus('saved');
            } catch {
              showSaveStatus('error');
            }
          }}
          powerPlusAccepted={!!profile?.power_plus_accepted_at}
          onAcceptPowerPlus={async () => {
            try {
              await updateProfile.mutateAsync({ power_plus_accepted_at: new Date().toISOString() });
            } catch {
              showSaveStatus('error');
            }
          }}
        />

        {/* Equipment / Gerätepark */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t.equipment.title}</h3>
          <p className="text-xs text-gray-500 mb-3">{t.equipment.subtitle}</p>
          <EquipmentSelector />
        </div>

        {/* Feedback & Feature Requests */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowFeedback(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-50 text-teal-600 rounded-xl font-medium hover:bg-teal-100 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            {t.feedback.feedbackButton}
          </button>
          <Link
            to="/features"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-600 rounded-xl font-medium hover:bg-amber-100 transition-colors"
          >
            <Lightbulb className="h-4 w-4" />
            {t.feedback.featureRequests}
          </Link>
        </div>

        <FeedbackDialog open={showFeedback} onClose={() => setShowFeedback(false)} />

        {/* Admin Link (only visible for admins) */}
        {isAdmin && (
          <Link
            to="/admin"
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
          >
            <Shield className="h-4 w-4" />
            {t.admin.adminLink}
          </Link>
        )}

        {/* Privacy Settings (DSGVO Art. 7 Abs. 3 — Widerrufsrecht) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <PrivacySettings />
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t.auth.logout}
        </button>

        {/* Disclaimer Link */}
        <button
          onClick={() => setShowDisclaimer(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FileText className="h-3 w-3" />
          {t.disclaimer.viewLink}
        </button>

        {showDisclaimer && (
          <DisclaimerModalView
            readOnly
            onAccepted={() => {}}
            onClose={() => setShowDisclaimer(false)}
          />
        )}

        {/* Legal Links */}
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <Link to="/impressum" className="hover:text-teal-600 transition-colors">
            {t.legal.impressumTitle}
          </Link>
          <span>|</span>
          <Link to="/datenschutz" className="hover:text-teal-600 transition-colors">
            {t.legal.privacyPolicy}
          </Link>
        </div>

        {/* Data Export (DSGVO Art. 20) */}
        <button
          onClick={() => setShowDataExport(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-teal-500 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          {t.dataExport.profileButton}
        </button>

        {showDataExport && (
          <DataExportDialog open={showDataExport} onClose={() => setShowDataExport(false)} />
        )}

        {/* Delete Account */}
        <button
          onClick={() => setShowDeleteAccount(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          {t.deleteAccount.profileButton}
        </button>

        {showDeleteAccount && (
          <DeleteAccountDialog onClose={() => setShowDeleteAccount(false)} />
        )}
      </div>
    </PageShell>
  );
}
