import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UtensilsCrossed, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useMealsByDate, useDailyMealTotals, useDeleteMeal } from '../features/meals/hooks/useMeals';
import { MealCard } from '../features/meals/components/MealCard';
import { AddMealDialog } from '../features/meals/components/AddMealDialog';
import { today } from '../lib/utils';

export function MealsPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());

  const { data: meals, isLoading } = useMealsByDate(selectedDate);
  const { totals } = useDailyMealTotals(selectedDate);
  const deleteMeal = useDeleteMeal();

  const isToday = selectedDate === today();

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split('T')[0];
    // Don't navigate into the future
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

  // Group meals by type
  const grouped = {
    breakfast: meals?.filter((m) => m.type === 'breakfast') ?? [],
    lunch: meals?.filter((m) => m.type === 'lunch') ?? [],
    dinner: meals?.filter((m) => m.type === 'dinner') ?? [],
    snack: meals?.filter((m) => m.type === 'snack') ?? [],
  };

  return (
    <PageShell
      title={t.meals.title}
      actions={
        <button
          onClick={() => setShowAddDialog(true)}
          className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
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
          <p className="text-xs text-gray-400">{selectedDate}</p>
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

      {/* Evaluate Day Button (only when meals exist and viewing today) */}
      {meals && meals.length > 0 && isToday && (
        <button
          onClick={() =>
            navigate('/buddy', {
              state: {
                autoMessage:
                  language === 'de'
                    ? 'Wie sieht mein Tag heute aus? Bewerte meine Ernährung.'
                    : 'How does my day look? Evaluate my nutrition.',
              },
            })
          }
          className="w-full py-2 px-3 bg-teal-50 text-teal-700 text-sm rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <BarChart3 className="h-4 w-4" />
          {t.meals.evaluateDay}
        </button>
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
                    <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">
            {isToday ? t.common.noData : t.meals.noMealsForDate}
          </p>
          {isToday && (
            <button
              onClick={() => setShowAddDialog(true)}
              className="mt-3 px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
            >
              {t.meals.addMeal}
            </button>
          )}
        </div>
      )}

      {/* Add Meal Dialog */}
      <AddMealDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        date={selectedDate}
      />
    </PageShell>
  );
}
