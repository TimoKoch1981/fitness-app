import { Trash2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { Meal } from '../../../types/health';

interface MealCardProps {
  meal: Meal;
  onDelete?: (id: string) => void;
}

const mealTypeEmojis: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
};

export function MealCard({ meal, onDelete }: MealCardProps) {
  const { t } = useTranslation();
  const emoji = mealTypeEmojis[meal.type] ?? '🍽️';
  const typeLabel = t.meals[meal.type as keyof typeof t.meals] ?? meal.type;

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 group">
      {/* Emoji */}
      <div className="text-2xl flex-shrink-0">{emoji}</div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{meal.name}</p>
        <p className="text-xs text-gray-400">{typeLabel}</p>
      </div>

      {/* Macros */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900">{meal.calories} kcal</p>
        <div className="flex gap-2 text-[10px] text-gray-400">
          <span>P: {meal.protein}g</span>
          <span>K: {meal.carbs}g</span>
          <span>F: {meal.fat}g</span>
        </div>
      </div>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(meal.id)}
          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Source indicator */}
      {meal.source === 'ai' && (
        <span className="text-[8px] text-amber-500 font-medium absolute top-1 right-1">
          {t.common.estimated}
        </span>
      )}
    </div>
  );
}
