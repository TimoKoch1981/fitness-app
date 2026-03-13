/**
 * RecipeDetail — Full recipe view with structured steps, image, allergens.
 * v2.0: DB-backed recipes with image support, step timers, allergen badges.
 */

import { useState } from 'react';
import {
  X,
  Clock,
  Users,
  Minus,
  Plus,
  Pencil,
  Trash2,
  Heart,
  AlertTriangle,
  Flame,
  Image as ImageIcon,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { RecipeToMealButton } from './RecipeToMealButton';
import { deriveAutoTags } from '../types';
import type { Recipe } from '../types';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
}

const DIFFICULTY_LABELS: Record<string, { de: string; en: string; color: string }> = {
  easy: { de: 'Einfach', en: 'Easy', color: 'text-green-600 bg-green-50' },
  medium: { de: 'Mittel', en: 'Medium', color: 'text-amber-600 bg-amber-50' },
  hard: { de: 'Anspruchsvoll', en: 'Advanced', color: 'text-red-600 bg-red-50' },
};

export function RecipeDetail({ recipe, onClose, onEdit, onDelete, onToggleFavorite }: RecipeDetailProps) {
  const { t, language } = useTranslation();
  const [servings, setServings] = useState(recipe.servings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const scaleFactor = servings / recipe.servings;
  const autoTags = deriveAutoTags(recipe);
  const allTags = [...new Set([...autoTags, ...recipe.tags])];
  const diffLabel = DIFFICULTY_LABELS[recipe.difficulty] || DIFFICULTY_LABELS.easy;

  const handleDelete = () => {
    onDelete(recipe.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header image */}
        <div className="relative w-full h-48 rounded-t-2xl overflow-hidden">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-teal-300" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(recipe.id, !recipe.is_favorite)}
              className="absolute top-3 left-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full"
            >
              <Heart className={`h-5 w-5 ${recipe.is_favorite ? 'text-red-400 fill-red-400' : 'text-gray-400'}`} />
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Title + Meta */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{recipe.title}</h2>
            {recipe.description && (
              <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
              {(recipe.prep_time_min > 0 || recipe.cook_time_min > 0) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {recipe.prep_time_min > 0 && `${recipe.prep_time_min} min Vorbereitung`}
                  {recipe.prep_time_min > 0 && recipe.cook_time_min > 0 && ' + '}
                  {recipe.cook_time_min > 0 && `${recipe.cook_time_min} min Kochen`}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {recipe.servings} {t.recipes.servings}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${diffLabel.color}`}>
                {diffLabel[language] || diffLabel.de}
              </span>
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Allergens warning */}
          {recipe.allergens.length > 0 && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700">Allergene</p>
                <p className="text-xs text-amber-600 capitalize">{recipe.allergens.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Macros Card */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">{t.recipes.perServing}</p>
            <div className="grid grid-cols-4 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-orange-400" />
                  {recipe.calories_per_serving}
                </p>
                <p className="text-[10px] text-gray-400">kcal</p>
              </div>
              <div>
                <p className="text-lg font-bold text-teal-600">{recipe.protein_per_serving}g</p>
                <p className="text-[10px] text-gray-400">{t.recipes.protein}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{recipe.carbs_per_serving}g</p>
                <p className="text-[10px] text-gray-400">{t.recipes.carbs}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">{recipe.fat_per_serving}g</p>
                <p className="text-[10px] text-gray-400">{t.recipes.fat}</p>
              </div>
            </div>
          </div>

          {/* Servings Adjuster */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-700">{t.recipes.adjustServings}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="p-1.5 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-lg font-bold text-gray-900 w-6 text-center">{servings}</span>
              <button
                onClick={() => setServings(servings + 1)}
                className="p-1.5 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t.recipes.ingredients}</h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => {
                const scaledAmount = Math.round(ing.amount * scaleFactor * 10) / 10;
                return (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                    <span className="text-gray-900">
                      <span className="font-medium">{scaledAmount} {ing.unit}</span>{' '}
                      {ing.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t.recipes.instructions}</h3>
              <ol className="space-y-2.5">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-gray-700">{step.text}</span>
                      {step.duration_min && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" />
                          {step.duration_min} min
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Log as Meal */}
          <RecipeToMealButton recipe={recipe} currentServings={servings} />

          {/* Edit + Delete actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => onEdit(recipe)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              {t.recipes.editRecipe}
            </button>
            {showDeleteConfirm ? (
              <div className="flex-1 flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t.common.confirm}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t.common.cancel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t.recipes.deleteRecipe}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
