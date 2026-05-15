import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Shield, HelpCircle, Check, AlertCircle, Calculator, FileText, MessageSquare, Lightbulb, Download, BarChart3, Upload, Info } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation, LANGUAGE_OPTIONS, type Language, type FontSize, type BuddyVerbosity, type BuddyExpertise } from '../i18n';
import { useProfile, useUpdateProfile } from '../features/auth/hooks/useProfile';
import { AvatarUpload } from '../features/auth/components/AvatarUpload';
import { NotificationSettings } from '../features/notifications/components/NotificationSettings';
import { CloudPushSettings } from '../features/notifications/components/CloudPushSettings';
import { EquipmentSelector } from '../features/equipment/components/EquipmentSelector';
import { FeedbackDialog } from '../features/feedback/components/FeedbackDialog';
import { useDebouncedCallback } from '../shared/hooks/useDebounce';
import { resetTourState } from '../shared/hooks/useGuidedTour';
import { calculateRecommendedGoals } from '../lib/calculations';
import type { RecommendedGoals } from '../lib/calculations';
import { useLatestBodyMeasurement } from '../features/body/hooks/useBodyMeasurements';
import { PAL_FACTORS } from '../lib/constants';
import { DisclaimerModal as DisclaimerModalView } from '../shared/components/DisclaimerModal';
import { DeleteAccountDialog } from '../features/auth/components/DeleteAccountDialog';
import { DataExportDialog } from '../features/auth/components/DataExportDialog';
import { PrivacySettings } from '../features/auth/components/PrivacySettings';
import { MFASettings } from '../features/auth/components/MFASettings';
import type { Gender, BMRFormula, PrimaryGoal, TrainingMode } from '../types/health';
import { TrainingModeSelector } from '../shared/components/TrainingModeSelector';
import { PowerModeSetupWizard } from '../shared/components/PowerModeSetupWizard';
import { BuddyAvatar, BUDDY_VARIANTS } from '../shared/components/BuddyAvatar';
import type { BuddyAvatarStyle } from '../types/health';
import { WeeklyReportPreview } from '../features/reports/components/WeeklyReportPreview';
import { KeyRotationStatus } from '../features/admin/components/KeyRotationStatus';
import { AuditRetentionCard } from '../features/admin/components/AuditRetentionCard';
import { FeatureFlagPanel } from '../features/admin/components/FeatureFlagPanel';
import { InviteCard } from '../features/invite/components/InviteCard';
import { MFPImportDialog } from '../features/import/components/MFPImportDialog';
import { ProfileDietHealthSection } from '../features/auth/components/ProfileDietHealthSection';
import { ProfilePersonalGoalsSection } from '../features/auth/components/ProfilePersonalGoalsSection';
import { useTheme } from '../lib/theme/ThemeContext';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const { t, language, setLanguage, fontSize, setFontSize, buddyVerbosity, setBuddyVerbosity, buddyExpertise, setBuddyExpertise } = useTranslation();
  const { surfaceMode, setSurfaceMode, autoSwitchWorkout, setAutoSwitchWorkout } = useTheme();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const isDE = language === 'de';

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
  // Breastfeeding
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  // Cycle Tracking
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(false);
  // BMR Help toggle
  const [showBmrHelp, setShowBmrHelp] = useState(false);
  const [showPalHelp, setShowPalHelp] = useState(false);
  const [showGoalsHelp, setShowGoalsHelp] = useState(false);
  // Disclaimer viewer
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  // Delete account dialog
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  // Data export dialog
  const [showDataExport, setShowDataExport] = useState(false);
  // MFP import dialog
  const [showMFPImport, setShowMFPImport] = useState(false);
  // Feedback dialog
  const [showFeedback, setShowFeedback] = useState(false);
  // Power Mode Setup Wizard
  const [showPowerSetup, setShowPowerSetup] = useState(false);
  const [powerSetupMode, setPowerSetupMode] = useState<TrainingMode>('power');
  // Weekly report dialog
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
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
      setIsBreastfeeding(profile.is_breastfeeding ?? false);
      setCycleTrackingEnabled(profile.cycle_tracking_enabled ?? (profile.gender === 'female' || profile.gender === 'other'));
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
    isBreastfeeding: false,
    cycleTrackingEnabled: false,
  });

  // Keep formRef in sync
  formRef.current = {
    displayName, heightCm, birthDate, gender, activityLevel, bmrFormula,
    caloriesGoal, proteinGoal, waterGoal,
    primaryGoal, targetWeight, targetBodyFat, targetDate, goalNotes,
    dietaryPreferences, allergies, healthRestrictions,
    isBreastfeeding,
    cycleTrackingEnabled,
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
        is_breastfeeding: f.isBreastfeeding,
        cycle_tracking_enabled: f.cycleTrackingEnabled,
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

  // Immediate save for toggles — no debounce needed, avoids race condition
  // with TanStack Query refetch resetting isHydratedRef during debounce window
  const handleToggleSave = async (
    field: 'isBreastfeeding' | 'cycleTrackingEnabled',
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    currentValue: boolean,
  ) => {
    const newValue = !currentValue;
    setter(newValue);
    // Update formRef immediately (don't wait for React re-render)
    formRef.current = { ...formRef.current, [field]: newValue };
    // Cancel any pending debounced save to avoid overwriting with stale data
    autoSave.cancel();
    try {
      const dbField = field === 'isBreastfeeding' ? 'is_breastfeeding' : 'cycle_tracking_enabled';
      await updateProfile.mutateAsync({ [dbField]: newValue });
      showSaveStatus('saved');
    } catch {
      // Revert on failure
      setter(currentValue);
      formRef.current = { ...formRef.current, [field]: currentValue };
      showSaveStatus('error');
    }
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
              ? 'bg-theme-surface-2 text-theme-success border border-theme-line'
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
        <div className="bg-theme-surface border border-theme-line rounded-theme-md p-4 flex items-center gap-4">
          <AvatarUpload
            avatarUrl={profile?.avatar_url}
            displayName={profile?.display_name}
          />
          <div>
            <p className="font-semibold text-theme-ink">
              {profile?.display_name ?? user?.email ?? 'Benutzer'}
            </p>
            <p className="text-xs text-theme-ink-3">
              {user?.email}
            </p>
          </div>
        </div>

        {/* v14.28 Stufe 3 — Darstellung (Theme + Auto-Switch) */}
        <section className="bg-theme-surface border border-theme-line rounded-theme-md p-5">
          <h3 className="text-[11px] font-semibold text-theme-ink-2 uppercase tracking-[0.16em] mb-4">
            {language === 'de' ? 'Darstellung' : 'Appearance'}
          </h3>

          {/* Theme-Radio */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-theme-ink mb-2">
              {language === 'de' ? 'Theme' : 'Theme'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSurfaceMode('studio')}
                aria-pressed={surfaceMode === 'studio'}
                className={`flex-1 min-h-[44px] px-4 py-2 rounded-theme-md border text-sm font-medium transition-colors ${
                  surfaceMode === 'studio'
                    ? 'bg-theme-surface-2 border-theme-primary text-theme-primary'
                    : 'bg-theme-surface border-theme-line text-theme-ink-2 hover:border-theme-ink-3'
                }`}
              >
                <span className="block text-base font-semibold">Studio</span>
                <span className="block text-[11px] mt-0.5 font-normal">
                  {language === 'de' ? 'Hell · Default' : 'Light · default'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSurfaceMode('console')}
                aria-pressed={surfaceMode === 'console'}
                className={`flex-1 min-h-[44px] px-4 py-2 rounded-theme-md border text-sm font-medium transition-colors ${
                  surfaceMode === 'console'
                    ? 'bg-theme-surface-2 border-theme-primary text-theme-primary'
                    : 'bg-theme-surface border-theme-line text-theme-ink-2 hover:border-theme-ink-3'
                }`}
              >
                <span className="block text-base font-semibold">Power Console</span>
                <span className="block text-[11px] mt-0.5 font-normal">
                  {language === 'de' ? 'Dunkel · für Power+' : 'Dark · for Power+'}
                </span>
              </button>
            </div>
          </div>

          {/* Auto-Switch-Checkbox (nur wenn Theme = Studio, sonst ohne Effekt) */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSwitchWorkout}
              onChange={(e) => setAutoSwitchWorkout(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-theme-line text-theme-primary focus:ring-theme-primary focus:ring-offset-0 accent-theme-primary"
            />
            <span className="flex-1 text-sm text-theme-ink">
              <span className="block font-medium">
                {language === 'de'
                  ? 'Beim Workout automatisch auf Power Console wechseln'
                  : 'Auto-switch to Power Console during workout'}
              </span>
              <span className="block text-[12px] text-theme-ink-3 mt-0.5">
                {language === 'de'
                  ? 'Für besseres Lesen im halbdunklen Studio. Setzt sich nach dem Workout zurück.'
                  : 'Better for low-light gym sessions. Reverts after the workout.'}
              </span>
            </span>
          </label>
        </section>

        {/* Language Switch */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t.profile.settings}</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t.profile.language}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
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
                      ? 'bg-theme-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Buddy Communication Style */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">{t.profile.buddyStyle}</p>

            {/* Verbosity */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t.profile.verbosity}</span>
              <div className="flex gap-1">
                {([
                  ['brief', t.profile.verbosityBrief],
                  ['normal', t.profile.verbosityNormal],
                  ['detailed', t.profile.verbosityDetailed],
                ] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBuddyVerbosity(v as BuddyVerbosity)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      buddyVerbosity === v
                        ? 'bg-theme-primary text-theme-primary-on'
                        : 'bg-theme-surface-2 text-theme-ink-2 hover:bg-theme-surface-3'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expertise */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">{t.profile.expertise}</span>
              <div className="flex gap-1">
                {([
                  ['beginner', t.profile.expertiseBeginner],
                  ['advanced', t.profile.expertiseAdvanced],
                ] as const).map(([e, label]) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setBuddyExpertise(e as BuddyExpertise)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      buddyExpertise === e
                        ? 'bg-theme-primary text-theme-primary-on'
                        : 'bg-theme-surface-2 text-theme-ink-2 hover:bg-theme-surface-3'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Buddy Avatar Style */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-3">{isDE ? '🎭 Buddy-Stil' : '🎭 Buddy Style'}</p>
          <div className="grid grid-cols-3 gap-2">
            {(['coach', 'trainer', 'sensei'] as BuddyAvatarStyle[]).map((v) => {
              const cfg = BUDDY_VARIANTS[v];
              const isSelected = (profile?.buddy_avatar_style ?? 'coach') === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => updateProfile.mutate({ buddy_avatar_style: v })}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-theme-primary bg-theme-surface-2 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <BuddyAvatar size="preview" variant={v} />
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${isSelected ? 'text-theme-primary' : 'text-gray-700'}`}>{cfg.label[isDE ? 'de' : 'en']}</p>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{cfg.description[isDE ? 'de' : 'en']}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-theme-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Restart Guided Tour */}
        <button
          type="button"
          onClick={() => {
            resetTourState();
            navigate('/cockpit');
          }}
          className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 hover:bg-gray-50 active:scale-[0.99] transition-all text-left"
        >
          <div className="w-9 h-9 rounded-full bg-theme-surface-2 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎯</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{t.profile.restartTour ?? 'Produkttour starten'}</p>
            <p className="text-xs text-gray-400">{t.profile.restartTourHint ?? 'Lerne alle Funktionen kennen'}</p>
          </div>
        </button>

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Cloud Push Settings (Web Push, WhatsApp, Telegram) */}
        <CloudPushSettings />

        {/* Personal Data */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t.profile.personalData}</h3>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-primary mx-auto" />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm"
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
                        onClick={() => {
                          handleChange(setGender)(val as Gender);
                          if (val === 'male' && cycleTrackingEnabled) {
                            // Auto-disable cycle tracking when switching to male
                            setCycleTrackingEnabled(false);
                            formRef.current = { ...formRef.current, cycleTrackingEnabled: false };
                          } else if ((val === 'female' || val === 'other') && !cycleTrackingEnabled) {
                            // Auto-enable cycle tracking when switching to female/other
                            setCycleTrackingEnabled(true);
                            formRef.current = { ...formRef.current, cycleTrackingEnabled: true };
                          }
                        }}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          gender === val
                            ? 'bg-theme-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {/* Cycle features hint for female/other */}
                  {(gender === 'female' || gender === 'other') && (
                    <div className="flex items-start gap-1.5 mt-1.5 px-1">
                      <Info className="h-3 w-3 text-rose-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-rose-500">
                        {language === 'de'
                          ? 'Schaltet Zyklus-Tracking & zyklusabhängiges Training frei'
                          : 'Unlocks cycle tracking & cycle-based training'}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t.profile.bmrFormula}
                  </label>
                  <select
                    value={bmrFormula}
                    onChange={(e) => handleChange(setBmrFormula)(e.target.value as BMRFormula)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm bg-white"
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
                className="flex items-center gap-1 text-[11px] text-theme-primary hover:text-theme-primary transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {t.profile.bmrHelpToggle}
              </button>
              {showBmrHelp && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-[10px] text-gray-600 leading-relaxed">
                  <p className="text-gray-700 font-medium">{t.profile.bmrExplanation}</p>
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1.5">
                    <p><span className="font-semibold text-gray-700">{t.profile.auto}:</span> {t.profile.bmrHelpAuto.split(': ').slice(1).join(': ')}</p>
                    <p><span className="font-semibold text-gray-700">{t.profile.mifflin}:</span> {t.profile.bmrHelpMifflin.split(': ').slice(1).join(': ')}</p>
                    <p><span className="font-semibold text-gray-700">{t.profile.katch}:</span> {t.profile.bmrHelpKatch.split(': ').slice(1).join(': ')}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.profile.activityLevel}
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => handleChange(setActivityLevel)(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm bg-white"
                >
                  {palOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Level Help */}
              <button
                type="button"
                onClick={() => setShowPalHelp(!showPalHelp)}
                className="flex items-center gap-1 text-[11px] text-theme-primary hover:text-theme-primary transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {t.profile.activityLevelHelpToggle}
              </button>
              {showPalHelp && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-[10px] text-gray-600 leading-relaxed">
                  <p className="text-gray-700 font-medium">{t.profile.activityLevelExplanation}</p>
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1.5">
                    <p>🪑 {t.profile.palSedentary}</p>
                    <p>🚶 {t.profile.palLightlyActive}</p>
                    <p>🏃 {t.profile.palModeratelyActive}</p>
                    <p>💪 {t.profile.palVeryActive}</p>
                    <p>🏋️ {t.profile.palExtremelyActive}</p>
                  </div>
                  <p className="text-theme-primary font-medium mt-2">💡 {t.profile.palTip}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dietary & Health — extracted v14.20 (P1-7) */}
        <ProfileDietHealthSection
          language={language}
          gender={gender}
          dietaryPreferences={dietaryPreferences}
          allergies={allergies}
          healthRestrictions={healthRestrictions}
          isBreastfeeding={isBreastfeeding}
          cycleTrackingEnabled={cycleTrackingEnabled}
          onDietaryPreferencesChange={handleChange(setDietaryPreferences)}
          onAllergiesChange={handleChange(setAllergies)}
          onHealthRestrictionsChange={handleChange(setHealthRestrictions)}
          onBreastfeedingToggle={() => handleToggleSave('isBreastfeeding', setIsBreastfeeding, isBreastfeeding)}
          onCycleTrackingToggle={() => handleToggleSave('cycleTrackingEnabled', setCycleTrackingEnabled, cycleTrackingEnabled)}
        />

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm"
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
                  is_breastfeeding: isBreastfeeding,
                });
                setRecommendedGoals(result);
              }}
              className="flex items-center gap-1.5 text-xs text-theme-primary hover:text-theme-primary font-medium transition-colors"
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
              <div className="bg-theme-surface-2 border border-theme-line rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-theme-ink">{t.profile.recommendedValues}</p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-theme-primary">
                  <div>
                    <span className="block text-theme-primary">{t.profile.caloriesGoal}</span>
                    <span className="font-bold">{recommendedGoals.calories} kcal</span>
                  </div>
                  <div>
                    <span className="block text-theme-primary">{t.profile.proteinGoal}</span>
                    <span className="font-bold">{recommendedGoals.protein}g</span>
                  </div>
                  <div>
                    <span className="block text-theme-primary">{t.profile.waterGoal}</span>
                    <span className="font-bold">{recommendedGoals.water_glasses} {t.dashboard.glasses}</span>
                  </div>
                </div>
                <div className="text-[9px] text-theme-primary">
                  BMR: {recommendedGoals.bmr} kcal ({recommendedGoals.bmr_formula === 'katch' ? t.profile.katch : t.profile.mifflin}) | TDEE: {recommendedGoals.tdee} kcal
                  {isBreastfeeding && (
                    <span className="ml-1 text-pink-500 font-medium">| 🤱 +400 kcal {language === 'de' ? 'Stillzeit' : 'Lactation'}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleChange(setCaloriesGoal)(recommendedGoals.calories.toString());
                    handleChange(setProteinGoal)(recommendedGoals.protein.toString());
                    handleChange(setWaterGoal)(recommendedGoals.water_glasses.toString());
                    setRecommendedGoals(null);
                  }}
                  className="w-full mt-1 py-1.5 bg-theme-primary text-white text-xs font-medium rounded-lg hover:bg-theme-primary-2 transition-colors"
                >
                  {t.profile.applyRecommendation}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Personal Goals — extracted v14.20 (P1-7) */}
        <ProfilePersonalGoalsSection
          language={language}
          t={t}
          primaryGoal={primaryGoal}
          targetWeight={targetWeight}
          targetBodyFat={targetBodyFat}
          targetDate={targetDate}
          goalNotes={goalNotes}
          showGoalsHelp={showGoalsHelp}
          onShowGoalsHelpChange={setShowGoalsHelp}
          onPrimaryGoalChange={handleChange(setPrimaryGoal)}
          onTargetWeightChange={handleChange(setTargetWeight)}
          onTargetBodyFatChange={handleChange(setTargetBodyFat)}
          onTargetDateChange={handleChange(setTargetDate)}
          onGoalNotesChange={handleChange(setGoalNotes)}
        />

        {/* Training Mode Selector (Standard / Power / Power+) */}
        <TrainingModeSelector
          value={(profile?.training_mode as TrainingMode) ?? 'standard'}
          onChange={async (mode: TrainingMode) => {
            try {
              await updateProfile.mutateAsync({ training_mode: mode });
              showSaveStatus('saved');
              // Open Power Setup Wizard when switching TO Power/Power+
              if (mode === 'power' || mode === 'power_plus') {
                setPowerSetupMode(mode);
                setShowPowerSetup(true);
              }
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

        {/* Power Mode Setup Wizard */}
        <PowerModeSetupWizard
          open={showPowerSetup}
          onClose={() => setShowPowerSetup(false)}
          mode={powerSetupMode}
        />

        {/* Advanced Nutrition Toggle (Power/Power+ only) */}
        {(profile?.training_mode === 'power' || profile?.training_mode === 'power_plus') && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🍽️</span>
                  <h3 className="font-semibold text-gray-900">
                    {language === 'de' ? 'Erweiterte Ernährung' : 'Advanced Nutrition'}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'de'
                    ? 'Phasen-Makros, Makro-Cycling, Mahlzeiten-Timing und Peak-Week-Protokoll auf der Ernährungsseite.'
                    : 'Phase macros, macro cycling, meal timing and peak week protocol on the nutrition page.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={profile?.show_advanced_nutrition !== false}
                  onChange={async (e) => {
                    try {
                      await updateProfile.mutateAsync({ show_advanced_nutrition: e.target.checked });
                      showSaveStatus('saved');
                    } catch {
                      showSaveStatus('error');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-theme-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary" />
              </label>
            </div>
          </div>
        )}

        {/* KI-Trainer Review Toggle */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <h3 className="font-semibold text-gray-900">
                  {language === 'de' ? 'KI-Trainer' : 'AI Trainer'}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'de'
                  ? 'Automatische Trainingsplan-Reviews, Deload-Empfehlungen und Progressionsanalyse nach jeder Session.'
                  : 'Automatic training plan reviews, deload recommendations and progression analysis after each session.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
              <input
                type="checkbox"
                checked={!!profile?.ai_trainer_enabled}
                onChange={async (e) => {
                  try {
                    await updateProfile.mutateAsync({ ai_trainer_enabled: e.target.checked });
                    showSaveStatus('saved');
                  } catch {
                    showSaveStatus('error');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-theme-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary" />
            </label>
          </div>
          {profile?.ai_trainer_enabled && (
            <div className="mt-3 p-2 bg-indigo-50 rounded-lg">
              <p className="text-xs text-indigo-600">
                {language === 'de'
                  ? '✅ Aktiv — Du erhältst nach jedem Training eine kurze Feedback-Abfrage und der KI-Trainer überwacht deinen Fortschritt.'
                  : '✅ Active — You\'ll get a quick feedback prompt after each workout and the AI trainer will monitor your progress.'}
              </p>
            </div>
          )}
        </div>

        {/* Equipment / Gerätepark */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t.equipment.title}</h3>
          <p className="text-xs text-gray-500 mb-3">{t.equipment.subtitle}</p>
          <EquipmentSelector />
        </div>

        {/* Weekly Report */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-theme-primary" />
              <h3 className="font-semibold text-gray-900">{t.report.weeklyReport}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1 mb-3">{t.report.weeklyReportDesc}</p>
          <button
            onClick={() => setShowWeeklyReport(true)}
            className="w-full py-2.5 bg-theme-surface-2 text-theme-primary text-sm font-medium rounded-lg hover:bg-theme-surface-2 transition-colors"
          >
            {t.report.showReport}
          </button>
        </div>

        <WeeklyReportPreview open={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} />

        {/* Feedback & Feature Requests */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowFeedback(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-theme-surface-2 text-theme-primary rounded-xl font-medium hover:bg-theme-surface-2 transition-colors"
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

        {/* Admin: API Key Rotation Status */}
        {isAdmin && <KeyRotationStatus />}

        {/* Admin: Audit Log Retention (DSGVO) */}
        {isAdmin && <AuditRetentionCard />}

        {/* Admin: Feature Flags */}
        {isAdmin && <FeatureFlagPanel />}

        {/* Privacy Settings (DSGVO Art. 7 Abs. 3 — Widerrufsrecht) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <PrivacySettings />
        </div>

        {/* MFA / Zwei-Faktor-Authentifizierung */}
        <MFASettings />

        {/* Data Retention / Loeschkonzept (DSGVO Art. 5(1)(e)) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            {t.dataRetention?.title || 'Datenaufbewahrung'}
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            {t.dataRetention?.subtitle || 'Wie lange sollen deine Gesundheitsdaten gespeichert werden? System-Logs werden automatisch nach 90 Tagen geloescht.'}
          </p>
          <select
            value={profile?.data_retention_months ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value);
              updateProfile.mutate({ data_retention_months: val });
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
          >
            <option value="">{t.dataRetention?.unlimited || 'Unbegrenzt (Standard)'}</option>
            <option value="12">{t.dataRetention?.months12 || '1 Jahr'}</option>
            <option value="36">{t.dataRetention?.months36 || '3 Jahre'}</option>
            <option value="60">{t.dataRetention?.months60 || '5 Jahre'}</option>
          </select>
          <p className="text-xs text-gray-400 mt-2">
            {t.dataRetention?.info || 'Aeltere Gesundheitsdaten werden automatisch geloescht. Dies betrifft: Koerpermasse, Blutdruck, Blutwerte, Schlaf, Symptome, Mahlzeiten, Workouts.'}
          </p>
        </div>

        {/* Invite Friends */}
        <InviteCard />

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
          <Link to="/impressum" className="hover:text-theme-primary transition-colors">
            {t.legal.impressumTitle}
          </Link>
          <span>|</span>
          <Link to="/datenschutz" className="hover:text-theme-primary transition-colors">
            {t.legal.privacyPolicy}
          </Link>
        </div>

        {/* MFP Import */}
        <button
          onClick={() => setShowMFPImport(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-theme-primary bg-theme-surface-2 rounded-lg hover:bg-theme-surface-2 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          {t.dataImport.title}
        </button>

        {showMFPImport && (
          <MFPImportDialog open={showMFPImport} onClose={() => setShowMFPImport(false)} />
        )}

        {/* Data Export (DSGVO Art. 20) */}
        <button
          onClick={() => setShowDataExport(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-theme-primary bg-theme-surface-2 rounded-lg hover:bg-theme-surface-2 transition-colors"
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
