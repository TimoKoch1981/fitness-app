import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddMeal } from '../hooks/useMeals';
import { useEstimateMealNutrition } from '../hooks/useEstimateMealNutrition';
import { today } from '../../../lib/utils';
import type { MealType } from '../../../types/health';

interface AddMealDialogProps {
  open: boolean;
  onClose: () => void;
  defaultType?: MealType;
  date?: string;
}

export function AddMealDialog({ open, onClose, defaultType = 'lunch', date }: AddMealDialogProps) {
  const { t, language } = useTranslation();
  const addMeal = useAddMeal();
  const { estimate, isEstimating, estimateError } = useEstimateMealNutrition();

  const [name, setName] = useState('');
  const [type, setType] = useState<MealType>(defaultType);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');
  const [isEstimated, setIsEstimated] = useState(false);

  if (!open) return null;

  const handleEstimate = async () => {
    if (!name.trim()) return;
    const result = await estimate(name, language);
    if (result) {
      setCalories(String(result.calories));
      setProtein(String(result.protein));
      setCarbs(String(result.carbs));
      setFat(String(result.fat));
      setIsEstimated(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;
    setError('');

    try {
      await addMeal.mutateAsync({
        date: date ?? today(),
        name,
        type,
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
      });

      // Reset and close
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setIsEstimated(false);
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  const mealTypes: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: t.meals.breakfast },
    { value: 'lunch', label: t.meals.lunch },
    { value: 'dinner', label: t.meals.dinner },
    { value: 'snack', label: t.meals.snack },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t.meals.addMeal}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Meal Type Selector */}
          <div className="flex gap-2">
            {mealTypes.map((mt) => (
              <button
                key={mt.value}
                type="button"
                onClick={() => setType(mt.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  type === mt.value
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mt.label}
              </button>
            ))}
          </div>

          {/* Name + AI Estimate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.meals.name}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setIsEstimated(false); }}
                placeholder={language === 'de' ? 'z.B. Hähnchenbrust mit Reis' : 'e.g. Chicken breast with rice'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={handleEstimate}
                disabled={isEstimating || !name.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all whitespace-nowrap"
                title={language === 'de' ? 'KI-Schätzung der Nährwerte' : 'AI nutrition estimate'}
              >
                {isEstimating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {language === 'de' ? 'KI' : 'AI'}
              </button>
            </div>
            {estimateError && (
              <p className="text-[10px] text-red-400 mt-1">{estimateError}</p>
            )}
            {isEstimated && !estimateError && (
              <p className="text-[10px] text-violet-500 mt-1">
                {language === 'de' ? 'KI-Schätzung — bitte prüfen & anpassen' : 'AI estimate — please review & adjust'}
              </p>
            )}
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.meals.calories} (kcal)
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm ${
                  isEstimated ? 'border-violet-300 bg-violet-50' : 'border-gray-300'
                }`}
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.meals.protein} (g)
              </label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm ${
                  isEstimated ? 'border-violet-300 bg-violet-50' : 'border-gray-300'
                }`}
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.meals.carbs} (g)
              </label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm ${
                  isEstimated ? 'border-violet-300 bg-violet-50' : 'border-gray-300'
                }`}
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.meals.fat} (g)
              </label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm ${
                  isEstimated ? 'border-violet-300 bg-violet-50' : 'border-gray-300'
                }`}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={addMeal.isPending || !name || !calories}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {addMeal.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
