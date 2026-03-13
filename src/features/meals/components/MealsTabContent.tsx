/**
 * MealsTabContent — Inner content of the Meals tab, extracted from MealsPage.
 * Used inside TrackingPage as one of 3 tracking tabs.
 */

import { useState, useMemo, useCallback } from 'react';
import { UtensilsCrossed, ChevronLeft, ChevronRight, Copy, Loader2, Check, Flame, Sparkles } from 'lucide-react';
import { BuddyQuickAccess } from '../../../shared/components/BuddyQuickAccess';
import { ComponentErrorBoundary } from '../../../shared/components/ComponentErrorBoundary';
import { useTranslation } from '../../../i18n';
import { useMealsByDate, useDailyMealTotals, useDeleteMeal, useUpdateMeal } from '../hooks/useMeals';
import { useCopyYesterdayMeals } from '../hooks/useCopyYesterdayMeals';
import { usePageBuddySuggestions } from '../../buddy/hooks/usePageBuddySuggestions';
import { useProfile } from '../../auth/hooks/useProfile';
import { useLatestBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { useWorkoutsByDate } from '../../workouts/hooks/useWorkouts';
import { useMealHistory } from '../hooks/useMealHistory';
import { calculateBMR, calculateAge, calculateTDEE_PAL } from '../../../lib/calculations';
import { isUsingProxy } from '../../../lib/ai/provider';
import { proxyCompletionRequest } from '../../../lib/ai/supabaseProxy';
import { MealCard } from './MealCard';
import { AddMealDialog } from './AddMealDialog';
import { today } from '../../../lib/utils';

interface MealsTabContentProps {
  showAddDialog: boolean;
  onOpenAddDialog: () => void;
  onCloseAddDialog: () => void;
}

export function MealsTabContent({ showAddDialog, onOpenAddDialog, onCloseAddDialog }: MealsTabContentProps) {
  const { t, language } = useTranslation();
  const mealsSuggestions = usePageBuddySuggestions('tracking_nutrition', language as 'de' | 'en');
  const [selectedDate, setSelectedDate] = useState(today());

  const { data: meals, isLoading } = useMealsByDate(selectedDate);
  const { totals } = useDailyMealTotals(selectedDate);
  const deleteMeal = useDeleteMeal();
  const updateMeal = useUpdateMeal();
  const copyMeals = useCopyYesterdayMeals();
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Energy balance data
  const { data: profile } = useProfile();
  const { data: latestBody } = useLatestBodyMeasurement();
  const { data: workouts } = useWorkoutsByDate(selectedDate);

  // Meal history for AI comment (last 7 days)
  const { data: weekHistory } = useMealHistory(7);

  const energyBalance = useMemo(() => {
    if (!profile?.height_cm || !profile?.birth_date || !latestBody?.weight_kg) return null;
    const age = calculateAge(profile.birth_date);
    const pal = profile.activity_level ?? 1.55;
    const bmrResult = calculateBMR(
      {
        weight_kg: latestBody.weight_kg,
        height_cm: profile.height_cm,
        age,
        gender: profile.gender ?? 'male',
        body_fat_pct: latestBody.body_fat_pct ?? undefined,
      },
      profile.preferred_bmr_formula ?? 'auto'
    );
    const activityCalories = Math.round(bmrResult.bmr * (pal - 1)); // NEAT + activity
    const tdee = bmrResult.bmr + activityCalories;
    const workoutCalories = workouts?.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0) ?? 0;
    const totalExpenditure = tdee + workoutCalories;
    const balance = totals.calories - totalExpenditure;

    // Macro goals from profile (or derived from calorie target)
    const proteinGoal = profile.daily_protein_goal ?? 0;
    const caloriesGoal = profile.daily_calories_goal ?? 0;

    // Derive carbs/fat goals from calorie budget:
    // Fat = ~28% of calories, Carbs = remainder after protein + fat
    let carbsGoal = 0;
    let fatGoal = 0;
    if (caloriesGoal > 0 && proteinGoal > 0) {
      const proteinKcal = proteinGoal * 4;
      const fatKcal = Math.round(caloriesGoal * 0.28);
      fatGoal = Math.round(fatKcal / 9);
      const carbsKcal = caloriesGoal - proteinKcal - fatKcal;
      carbsGoal = carbsKcal > 0 ? Math.round(carbsKcal / 4) : 0;
    }

    return {
      bmr: bmrResult.bmr,
      activityCalories,
      tdee,
      workoutCalories,
      totalExpenditure,
      balance,
      proteinGoal,
      caloriesGoal,
      carbsGoal,
      fatGoal,
    };
  }, [profile, latestBody, workouts, totals.calories]);

  // AI Nutrition Comment
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [aiCommentLoading, setAiCommentLoading] = useState(false);

  const fetchAiComment = useCallback(async () => {
    if (!energyBalance || aiComment || aiCommentLoading) return;
    if (!isUsingProxy()) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return;

    setAiCommentLoading(true);
    try {
      const todayData = `Heute: ${totals.calories} kcal, ${Math.round(totals.protein)}g Protein, ${Math.round(totals.carbs)}g Carbs, ${Math.round(totals.fat)}g Fett. Bilanz: ${energyBalance.balance} kcal. Ziel: ${energyBalance.caloriesGoal || energyBalance.tdee} kcal, ${energyBalance.proteinGoal || '?'}g Protein.`;

      const weekData = weekHistory && weekHistory.daysWithData > 1
        ? ` Letzte ${weekHistory.daysWithData} Tage: ø ${weekHistory.averages.calories} kcal/Tag, ø ${weekHistory.averages.protein}g Protein/Tag.`
        : '';

      const prompt = language === 'de'
        ? `Du bist ein Ernährungsberater. Gib einen kurzen, motivierenden Kommentar (max. 2 Sätze) zur Ernährung. ${todayData}${weekData} Sei spezifisch, nicht generisch. Antworte direkt ohne Anführungszeichen.`
        : `You are a nutrition advisor. Give a brief, motivating comment (max 2 sentences) about the nutrition. ${todayData}${weekData} Be specific, not generic. Reply directly without quotes.`;

      const response = await proxyCompletionRequest(supabaseUrl, anonKey, [
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 100,
      });

      const content = response.choices?.[0]?.message?.content?.trim() ?? '';
      if (content) setAiComment(content);
    } catch {
      // Non-critical — silently fail
    } finally {
      setAiCommentLoading(false);
    }
  }, [energyBalance, totals, weekHistory, aiComment, aiCommentLoading, language]);

  const isToday = selectedDate === today();

  const handleCopyYesterday = async () => {
    setCopySuccess(null);
    try {
      const result = await copyMeals.mutateAsync(undefined);
      if (result.copiedCount > 0) {
        setCopySuccess(`${result.copiedCount} ${t.meals.copiedMeals}`);
        setTimeout(() => setCopySuccess(null), 3000);
      }
    } catch {
      // Error is handled by mutation state
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split('T')[0];
    if (iso <= today()) setSelectedDate(iso);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const handleDelete = (id: string) => {
    deleteMeal.mutate({ id, date: selectedDate });
  };

  const handleEdit = (id: string, updates: Partial<Pick<import('../../../types/health').Meal, 'name' | 'calories' | 'protein' | 'carbs' | 'fat' | 'type' | 'date'>>) => {
    updateMeal.mutate({ id, _previousDate: selectedDate, ...updates });
  };

  // Group meals by type
  const grouped = {
    breakfast: meals?.filter((m) => m.type === 'breakfast') ?? [],
    morning_snack: meals?.filter((m) => m.type === 'morning_snack') ?? [],
    lunch: meals?.filter((m) => m.type === 'lunch') ?? [],
    afternoon_snack: meals?.filter((m) => m.type === 'afternoon_snack') ?? [],
    dinner: meals?.filter((m) => m.type === 'dinner') ?? [],
    snack: meals?.filter((m) => m.type === 'snack') ?? [],
  };

  return (
    <>
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-xl p-3 shadow-sm">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">
            {isToday ? t.common.today : formatDate(selectedDate)}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(selectedDate).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
              day: '2-digit', month: '2-digit', year: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => changeDate(+1)}
          disabled={isToday}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Daily Totals Bar */}
      <div className="bg-white rounded-xl p-3 shadow-sm mb-4">
        <div className="grid grid-cols-4 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">{totals.calories}</p>
            <p className="text-[10px] text-gray-400">{t.meals.calories}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-teal-600">{totals.protein.toFixed(0)}</p>
            <p className="text-[10px] text-gray-400">{t.meals.protein}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{totals.carbs.toFixed(0)}</p>
            <p className="text-[10px] text-gray-400">{t.meals.carbs}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{totals.fat.toFixed(0)}</p>
            <p className="text-[10px] text-gray-400">{t.meals.fat}</p>
          </div>
        </div>
      </div>

      {/* Energy Balance Card */}
      {energyBalance && (
        <div className="bg-white rounded-xl p-3 shadow-sm mb-4">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-2">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              {language === 'de' ? 'Energiebilanz' : 'Energy Balance'}
            </p>
          </div>

          {/* Intake */}
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-gray-500">{language === 'de' ? 'Aufnahme' : 'Intake'}</span>
            <span className="font-semibold text-emerald-600">+{totals.calories} kcal</span>
          </div>

          {/* Expenditure total */}
          <div className="flex justify-between items-center text-xs mb-0.5">
            <span className="text-gray-500">{language === 'de' ? 'Verbrauch' : 'Expenditure'}</span>
            <span className="font-semibold text-orange-500">-{energyBalance.totalExpenditure} kcal</span>
          </div>

          {/* Expenditure breakdown — always visible */}
          <div className="ml-4 mb-1.5 space-y-0.5">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>BMR ({language === 'de' ? 'Grundumsatz' : 'Basal'})</span>
              <span>{energyBalance.bmr} kcal</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{language === 'de' ? 'Aktivität' : 'Activity'} (NEAT)</span>
              <span>{energyBalance.activityCalories} kcal</span>
            </div>
            {energyBalance.workoutCalories > 0 && (
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Training</span>
                <span>{energyBalance.workoutCalories} kcal</span>
              </div>
            )}
          </div>

          {/* Balance line */}
          <div className="border-t border-gray-100 pt-1.5 flex justify-between items-center text-xs">
            <span className="font-medium text-gray-700">{language === 'de' ? 'Bilanz' : 'Balance'}</span>
            <span className={`font-bold text-sm ${energyBalance.balance < 0 ? 'text-blue-600' : energyBalance.balance > 300 ? 'text-red-500' : 'text-gray-900'}`}>
              {energyBalance.balance > 0 ? '+' : ''}{energyBalance.balance} kcal
            </span>
          </div>

          {/* Macro breakdown — always visible */}
          <div className="mt-2.5 pt-2 border-t border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wider">
              {language === 'de' ? 'Makronährstoffe' : 'Macronutrients'}
            </p>
            <div className="space-y-2">
              {/* Protein */}
              <div>
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="text-teal-600 font-medium">{t.meals.protein}</span>
                  <span className="text-gray-700 font-semibold">
                    {Math.round(totals.protein)}g
                    {energyBalance.proteinGoal > 0 && (
                      <span className="text-gray-400 font-normal"> / {energyBalance.proteinGoal}g</span>
                    )}
                  </span>
                </div>
                {energyBalance.proteinGoal > 0 && (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (totals.protein / energyBalance.proteinGoal) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              {/* Carbs */}
              <div>
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="text-blue-600 font-medium">{t.meals.carbs}</span>
                  <span className="text-gray-700 font-semibold">
                    {Math.round(totals.carbs)}g
                    {energyBalance.carbsGoal > 0 && (
                      <span className="text-gray-400 font-normal"> / {energyBalance.carbsGoal}g</span>
                    )}
                  </span>
                </div>
                {energyBalance.carbsGoal > 0 && (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (totals.carbs / energyBalance.carbsGoal) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              {/* Fat */}
              <div>
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="text-amber-600 font-medium">{t.meals.fat}</span>
                  <span className="text-gray-700 font-semibold">
                    {Math.round(totals.fat)}g
                    {energyBalance.fatGoal > 0 && (
                      <span className="text-gray-400 font-normal"> / {energyBalance.fatGoal}g</span>
                    )}
                  </span>
                </div>
                {energyBalance.fatGoal > 0 && (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (totals.fat / energyBalance.fatGoal) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Nutrition Comment */}
          {isToday && totals.calories > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-50">
              {aiComment ? (
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  <Sparkles className="h-3 w-3 text-violet-400 inline mr-1" />
                  {aiComment}
                </p>
              ) : (
                <button
                  onClick={fetchAiComment}
                  disabled={aiCommentLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-violet-500 hover:text-violet-600 transition-colors"
                >
                  {aiCommentLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {language === 'de' ? 'KI-Ernährungskommentar' : 'AI nutrition insight'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Copy Yesterday Button (only on today) */}
      {isToday && (
        <div className="mb-4">
          <button
            onClick={handleCopyYesterday}
            disabled={copyMeals.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white rounded-xl shadow-sm text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-teal-600 transition-colors disabled:opacity-50"
          >
            {copyMeals.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : copySuccess ? (
              <Check className="h-4 w-4 text-teal-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copySuccess ?? t.meals.copyYesterday}
          </button>
        </div>
      )}

      {/* Buddy Quick Access */}
      {meals && meals.length > 0 && isToday && (
        <BuddyQuickAccess suggestions={mealsSuggestions} />
      )}

      {/* Meals List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
        </div>
      ) : meals && meals.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, typeMeals]) => {
            if (typeMeals.length === 0) return null;
            const typeLabel = t.meals[type as keyof typeof t.meals] ?? type;
            return (
              <div key={type}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {typeLabel}
                </h3>
                <div className="space-y-2">
                  {typeMeals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} onDelete={handleDelete} onEdit={handleEdit} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add another meal button */}
          {isToday && (
            <button
              onClick={onOpenAddDialog}
              className="w-full py-2.5 bg-white rounded-xl shadow-sm text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors border border-teal-100"
            >
              + {t.meals.addMeal}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">
            {isToday ? t.common.noData : t.meals.noMealsForDate}
          </p>
          {isToday && (
            <button
              onClick={onOpenAddDialog}
              className="mt-3 px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
            >
              {t.meals.addMeal}
            </button>
          )}
        </div>
      )}

      {/* Add Meal Dialog — wrapped in error boundary so a crash here doesn't take down the page */}
      <ComponentErrorBoundary label="AddMealDialog" language={language as 'de' | 'en'}>
        <AddMealDialog
          open={showAddDialog}
          onClose={onCloseAddDialog}
          date={selectedDate}
        />
      </ComponentErrorBoundary>
    </>
  );
}
