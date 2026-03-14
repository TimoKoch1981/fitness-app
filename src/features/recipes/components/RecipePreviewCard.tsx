/**
 * RecipePreviewCard — Shared preview card for imported/searched recipes.
 * Extracted from ImportRecipeDialog for reuse in RecipeSearchDialog.
 */

import { Sparkles, ExternalLink } from 'lucide-react';

interface RecipePreviewCardProps {
  recipe: Record<string, unknown>;
  language: string;
}

const SOURCE_LABELS: Record<string, Record<string, string>> = {
  json_ld: { de: 'Strukturierte Daten', en: 'Structured Data' },
  microdata: { de: 'Microdata', en: 'Microdata' },
  ai: { de: 'KI-Extraktion', en: 'AI Extraction' },
};

export function RecipePreviewCard({ recipe, language }: RecipePreviewCardProps) {
  const de = language === 'de';

  const title = String(recipe.title || '');
  const description = String(recipe.description || '');
  const imageUrl = recipe.image_url as string | null;
  const sourceUrl = recipe.source_url as string | null;
  const importMethod = recipe.import_method as string | null;
  const mealType = recipe.meal_type as string | null;
  const servings = Number(recipe.servings) || 0;
  const prepTime = Number(recipe.prep_time_min) || 0;
  const calories = Number(recipe.calories_per_serving) || 0;
  const protein = Number(recipe.protein_per_serving) || 0;
  const carbs = Number(recipe.carbs_per_serving) || 0;
  const fat = Number(recipe.fat_per_serving) || 0;
  const ingredients = (recipe.ingredients as unknown[]) || [];
  const steps = (recipe.steps as unknown[]) || [];
  const tags = (recipe.tags as string[]) || [];

  return (
    <div className="space-y-3">
      {/* Import method badge */}
      {importMethod && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            {SOURCE_LABELS[importMethod]?.[de ? 'de' : 'en'] || importMethod}
          </span>
        </div>
      )}

      {/* Preview card */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Image */}
        {imageUrl && (
          <div className="h-36 bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-3 space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-base">{title}</h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {servings > 0 && (
              <span>🍽 {servings} {de ? 'Portionen' : 'servings'}</span>
            )}
            {prepTime > 0 && (
              <span>⏱ {prepTime} min</span>
            )}
            {mealType && (
              <span className="px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded">
                {mealType}
              </span>
            )}
          </div>

          {/* Macros */}
          {calories > 0 && (
            <div className="flex gap-3 text-xs">
              <span className="font-medium">{calories} kcal</span>
              <span>P: {protein}g</span>
              <span>K: {carbs}g</span>
              <span>F: {fat}g</span>
            </div>
          )}

          {/* Ingredients count */}
          <div className="text-xs text-gray-500">
            {ingredients.length} {de ? 'Zutaten' : 'ingredients'}
            {' · '}
            {steps.length} {de ? 'Schritte' : 'steps'}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* AI warning */}
          {importMethod === 'ai' && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              {de
                ? 'Makros wurden per KI geschaetzt — bitte pruefen!'
                : 'Macros were estimated by AI — please verify!'}
            </div>
          )}

          {/* Source link */}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-teal-600 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {de ? 'Quelle oeffnen' : 'Open source'}
            </a>
          )}
        </div>
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500 text-center">
        {de
          ? 'Im naechsten Schritt kannst du alle Daten bearbeiten.'
          : 'You can edit all data in the next step.'}
      </p>
    </div>
  );
}
