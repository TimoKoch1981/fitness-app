import { useState, useEffect } from 'react';
import { LogOut, User, Save } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useAuth } from '../app/providers/AuthProvider';
import { useTranslation } from '../i18n';
import { useProfile, useUpdateProfile } from '../features/auth/hooks/useProfile';
import { NotificationSettings } from '../features/notifications/components/NotificationSettings';
import { PAL_FACTORS } from '../lib/constants';
import type { Gender, BMRFormula } from '../types/health';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useTranslation();
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

  // Sync profile data into form
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setHeightCm(profile.height_cm?.toString() ?? '');
      setBirthDate(profile.birth_date ?? '');
      setGender(profile.gender ?? 'male');
      setActivityLevel(profile.activity_level?.toString() ?? PAL_FACTORS.lightly_active.toString());
      setBmrFormula(profile.preferred_bmr_formula ?? 'auto');
      setCaloriesGoal(profile.daily_calories_goal?.toString() ?? '2000');
      setProteinGoal(profile.daily_protein_goal?.toString() ?? '150');
      setWaterGoal(profile.daily_water_goal?.toString() ?? '8');
    }
  }, [profile]);

  const handleSavePersonalData = async () => {
    await updateProfile.mutateAsync({
      display_name: displayName || undefined,
      height_cm: heightCm ? parseFloat(heightCm) : undefined,
      birth_date: birthDate || undefined,
      gender,
      activity_level: parseFloat(activityLevel),
      preferred_bmr_formula: bmrFormula,
    });
  };

  const handleSaveGoals = async () => {
    await updateProfile.mutateAsync({
      daily_calories_goal: parseInt(caloriesGoal) || 2000,
      daily_protein_goal: parseInt(proteinGoal) || 150,
      daily_water_goal: parseInt(waterGoal) || 8,
    });
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
        {/* User Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
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
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setLanguage('de')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  language === 'de'
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.profile.german}
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  language === 'en'
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.profile.english}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Personal Data */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{t.profile.personalData}</h3>
            <button
              onClick={handleSavePersonalData}
              disabled={updateProfile.isPending}
              className="flex items-center gap-1 px-3 py-1 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              <Save className="h-3 w-3" />
              {t.common.save}
            </button>
          </div>

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
                  onChange={(e) => setDisplayName(e.target.value)}
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
                    onChange={(e) => setHeightCm(e.target.value)}
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
                    onChange={(e) => setBirthDate(e.target.value)}
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
                        onClick={() => setGender(val as Gender)}
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
                    onChange={(e) => setBmrFormula(e.target.value as BMRFormula)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm bg-white"
                  >
                    <option value="auto">{t.profile.auto}</option>
                    <option value="mifflin">{t.profile.mifflin}</option>
                    <option value="katch">{t.profile.katch}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.profile.activityLevel}
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
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

        {/* Daily Goals */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{t.profile.goals}</h3>
            <button
              onClick={handleSaveGoals}
              disabled={updateProfile.isPending}
              className="flex items-center gap-1 px-3 py-1 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              <Save className="h-3 w-3" />
              {t.common.save}
            </button>
          </div>

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
                    onChange={(e) => setCaloriesGoal(e.target.value)}
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
                    onChange={(e) => setProteinGoal(e.target.value)}
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
                    onChange={(e) => setWaterGoal(e.target.value)}
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
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t.auth.logout}
        </button>

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-400 text-center px-4 mt-4">
          {t.app.disclaimer}
        </p>
      </div>
    </PageShell>
  );
}
