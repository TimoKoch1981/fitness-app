import { useState } from 'react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useMealsByDate, useDailyMealTotals, useDeleteMeal } from '../features/meals/hooks/useMeals';
import { MealCard } from '../features/meals/components/MealCard';
import { AddMealDialog } from '../features/meals/components/AddMealDialog';
import { today } from '../lib/utils';

export function MealsPage() {
  const { t } = useTranslation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate] = useState(today());

  const { data: meals, isLoading } = useMealsByDate(selectedDate);
  const { totals } = useDailyMealTotals(selectedDate);
  const deleteMeal = useDeleteMeal();

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
          <p className="text-gray-400 text-sm">{t.common.noData}</p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="mt-3 px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
          >
            {t.meals.addMeal}
          </button>
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
