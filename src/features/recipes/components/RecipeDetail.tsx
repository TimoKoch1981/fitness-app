/**
 * RecipeDetail — Full recipe view as a modal/slide-over panel.
 * Shows ingredients (scaled by servings), step-by-step instructions, macros.
 * Includes "Log as Meal", "Edit", and "Delete" actions.
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
  ChefHat,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { RecipeToMealButton } from './RecipeToMealButton';
import type { Recipe } from '../types';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export function RecipeDetail({ recipe, onClose, onEdit, onDelete }: RecipeDetailProps) {
  const { t } = useTranslation();
  const [servings, setServings] = useState(recipe.servings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const scaleFactor = servings / recipe.servings;

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
        {/* Header image/placeholder */}
        <div className="relative w-full h-36 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-t-2xl flex items-center justify-center">
          <ChefHat className="h-16 w-16 text-teal-400" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Title + Meta */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{recipe.name}</h2>
            {recipe.description && (
              <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {(recipe.prepTime > 0 || recipe.cookTime > 0) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {recipe.prepTime > 0 && `${recipe.prepTime} min ${t.recipes.prepTime}`}
                  {recipe.prepTime > 0 && recipe.cookTime > 0 && ' + '}
                  {recipe.cookTime > 0 && `${recipe.cookTime} min ${t.recipes.cookTime}`}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {recipe.servings} {t.recipes.servings}
              </span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Macros Card */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">{t.recipes.perServing}</p>
            <div className="grid grid-cols-4 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{recipe.macrosPerServing.calories}</p>
                <p className="text-[10px] text-gray-400">kcal</p>
              </div>
              <div>
                <p className="text-lg font-bold text-teal-600">{recipe.macrosPerServing.protein}g</p>
                <p className="text-[10px] text-gray-400">{t.recipes.protein}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{recipe.macrosPerServing.carbs}g</p>
                <p className="text-[10px] text-gray-400">{t.recipes.carbs}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">{recipe.macrosPerServing.fat}g</p>
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

          {/* Instructions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{t.recipes.instructions}</h3>
            <ol className="space-y-2">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

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
