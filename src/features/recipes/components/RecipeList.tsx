/**
 * RecipeList — Grid/list view of recipes with search, filter and sort.
 * Shows sample recipes when list is empty.
 */

import { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Clock,
  Users,
  ChefHat,
  LayoutGrid,
  LayoutList,
  X,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import type { Recipe, RecipeFilter, RecipeSortBy } from '../types';

interface RecipeListProps {
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  allTags: string[];
  filters: RecipeFilter;
  onSetFilters: (filters: RecipeFilter) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onAddRecipe: () => void;
  onLoadSampleRecipes: () => void;
}

export function RecipeList({
  recipes,
  filteredRecipes,
  allTags,
  filters,
  onSetFilters,
  onSelectRecipe,
  onAddRecipe,
  onLoadSampleRecipes,
}: RecipeListProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (query: string) => {
    onSetFilters({ ...filters, searchQuery: query });
  };

  const handleSortChange = (sortBy: RecipeSortBy) => {
    onSetFilters({ ...filters, sortBy });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onSetFilters({ ...filters, tags: newTags });
  };

  const handleMaxPrepTimeChange = (value: string) => {
    onSetFilters({ ...filters, maxPrepTime: value ? parseInt(value, 10) : null });
  };

  const handleMaxCaloriesChange = (value: string) => {
    onSetFilters({ ...filters, maxCalories: value ? parseInt(value, 10) : null });
  };

  // Empty state
  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat className="h-12 w-12 mx-auto text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm mb-1">{t.recipes.noRecipes}</p>
        <p className="text-gray-300 text-xs mb-4">{t.recipes.sampleRecipes}</p>
        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={onLoadSampleRecipes}
            className="px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
          >
            {t.recipes.loadSampleRecipes}
          </button>
          <button
            onClick={onAddRecipe}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t.recipes.addRecipe}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t.recipes.search}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'p-2 rounded-lg border transition-colors',
            showFilters
              ? 'bg-teal-50 border-teal-300 text-teal-600'
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {viewMode === 'grid' ? (
            <LayoutList className="h-4 w-4" />
          ) : (
            <LayoutGrid className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl p-3 shadow-sm space-y-3">
          {/* Sort */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              {t.recipes.sortBy}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {(['name', 'newest', 'prepTime', 'calories'] as RecipeSortBy[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSortChange(opt)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    filters.sortBy === opt
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {opt === 'name' && t.recipes.sortByName}
                  {opt === 'newest' && t.recipes.sortByNewest}
                  {opt === 'prepTime' && t.recipes.prepTime}
                  {opt === 'calories' && t.recipes.calories}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                {t.recipes.tags}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                      filters.tags.includes(tag)
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Max prep time + max calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                {t.recipes.maxPrepTime}
              </label>
              <input
                type="number"
                value={filters.maxPrepTime ?? ''}
                onChange={(e) => handleMaxPrepTimeChange(e.target.value)}
                placeholder="Min"
                min="0"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                {t.recipes.maxCalories}
              </label>
              <input
                type="number"
                value={filters.maxCalories ?? ''}
                onChange={(e) => handleMaxCaloriesChange(e.target.value)}
                placeholder="kcal"
                min="0"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-gray-400 px-1">
        {filteredRecipes.length} {t.recipes.recipesCount}
      </p>

      {/* Recipe Cards */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">{t.recipes.noResults}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCardGrid key={recipe.id} recipe={recipe} onClick={() => onSelectRecipe(recipe)} t={t} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecipes.map((recipe) => (
            <RecipeCardList key={recipe.id} recipe={recipe} onClick={() => onSelectRecipe(recipe)} t={t} />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onAddRecipe}
        className="fixed bottom-24 right-4 z-30 p-3.5 bg-teal-500 text-white rounded-full shadow-lg hover:bg-teal-600 transition-colors"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}

function RecipeCardGrid({ recipe, onClick, t }: RecipeCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm p-3 text-left hover:shadow-md transition-shadow w-full"
    >
      {/* Color placeholder instead of image */}
      <div className="w-full h-20 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-2">
        <ChefHat className="h-8 w-8 text-teal-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 truncate">{recipe.name}</h3>
      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3" />
          {recipe.prepTime + recipe.cookTime} min
        </span>
        <span className="flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {recipe.servings}
        </span>
      </div>
      <div className="mt-1.5 text-[10px] text-gray-500">
        {recipe.macrosPerServing.calories} kcal &middot;{' '}
        {recipe.macrosPerServing.protein}g {t.recipes.protein}
      </div>
    </button>
  );
}

function RecipeCardList({ recipe, onClick, t }: RecipeCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl shadow-sm p-3 flex gap-3 text-left hover:shadow-md transition-shadow"
    >
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 flex-shrink-0 flex items-center justify-center">
        <ChefHat className="h-6 w-6 text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{recipe.name}</h3>
        <p className="text-xs text-gray-400 truncate">{recipe.description}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {recipe.prepTime + recipe.cookTime} min
          </span>
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {recipe.servings} {t.recipes.servings}
          </span>
          <span>
            {recipe.macrosPerServing.calories} kcal
          </span>
        </div>
      </div>
    </button>
  );
}
