/**
 * RecipeToMealButton — Converts a recipe serving into a meal log entry.
 * v2.0: Uses new Recipe field names (title, calories_per_serving, etc.)
 */

import { useState } from 'react';
import { UtensilsCrossed, Loader2, Check, Minus, Plus } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddMeal } from '../../meals/hooks/useMeals';
import { today } from '../../../lib/utils';
import type { Recipe } from '../types';
import type { MealType } from '../../../types/health';

interface RecipeToMealButtonProps {
  recipe: Recipe;
  currentServings: number;
  className?: string;
}

export function RecipeToMealButton({ recipe, currentServings, className }: RecipeToMealButtonProps) {
  const { t } = useTranslation();
  const addMeal = useAddMeal();
  const [showOptions, setShowOptions] = useState(false);
  const [portions, setPortions] = useState(1);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [success, setSuccess] = useState(false);

  const scaleFactor = (portions / recipe.servings) * currentServings;

  const mealTypes: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: t.meals.breakfast },
    { value: 'lunch', label: t.meals.lunch },
    { value: 'dinner', label: t.meals.dinner },
    { value: 'snack', label: t.meals.snack },
  ];

  const handleLog = async () => {
    try {
      await addMeal.mutateAsync({
        date: today(),
        name: recipe.title,
        type: mealType,
        calories: Math.round(recipe.calories_per_serving * scaleFactor),
        protein: Math.round(recipe.protein_per_serving * scaleFactor * 10) / 10,
        carbs: Math.round(recipe.carbs_per_serving * scaleFactor * 10) / 10,
        fat: Math.round(recipe.fat_per_serving * scaleFactor * 10) / 10,
        source: 'manual',
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowOptions(false);
      }, 2000);
    } catch {
      // Error handled by mutation
    }
  };

  if (success) {
    return (
      <div className={`flex items-center gap-2 text-teal-600 text-sm font-medium ${className}`}>
        <Check className="h-4 w-4" />
        {t.recipes.mealLogged}
      </div>
    );
  }

  if (!showOptions) {
    return (
      <button
        onClick={() => setShowOptions(true)}
        className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 transition-all ${className}`}
      >
        <UtensilsCrossed className="h-4 w-4" />
        {t.recipes.logAsMeal}
      </button>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-xl p-3 space-y-3 ${className}`}>
      {/* Portions */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{t.recipes.portions}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPortions(Math.max(0.5, portions - 0.5))}
            className="p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-sm font-semibold text-gray-900 w-8 text-center">{portions}</span>
          <button
            onClick={() => setPortions(portions + 0.5)}
            className="p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Macros preview */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {Math.round(recipe.calories_per_serving * scaleFactor)}
          </p>
          <p className="text-[10px] text-gray-400">kcal</p>
        </div>
        <div>
          <p className="text-sm font-bold text-teal-600">
            {Math.round(recipe.protein_per_serving * scaleFactor)}g
          </p>
          <p className="text-[10px] text-gray-400">{t.recipes.protein}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-blue-600">
            {Math.round(recipe.carbs_per_serving * scaleFactor)}g
          </p>
          <p className="text-[10px] text-gray-400">{t.recipes.carbs}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-amber-600">
            {Math.round(recipe.fat_per_serving * scaleFactor)}g
          </p>
          <p className="text-[10px] text-gray-400">{t.recipes.fat}</p>
        </div>
      </div>

      {/* Meal type selector */}
      <div className="flex gap-1.5">
        {mealTypes.map((mt) => (
          <button
            key={mt.value}
            onClick={() => setMealType(mt.value)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mealType === mt.value
                ? 'bg-teal-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {mt.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowOptions(false)}
          className="flex-1 py-2 bg-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          {t.common.cancel}
        </button>
        <button
          onClick={handleLog}
          disabled={addMeal.isPending}
          className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
        >
          {addMeal.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UtensilsCrossed className="h-4 w-4" />
          )}
          {t.recipes.logAsMeal}
        </button>
      </div>
    </div>
  );
}
