/**
 * ExercisePicker — Shared exercise search & filter component.
 *
 * Features:
 * - Body region filter chips (Brust, Rücken, Schultern, ...)
 * - Free-text search (name, aliases, muscles)
 * - Favorites (star toggle, favorites-first sort)
 * - Category tabs (Kraft, Cardio, Flex, Functional)
 * - Compact result cards with primary muscles
 *
 * Used by: AddExerciseDialog, Plan-Editor, future exercise selection.
 */

import { useState, useMemo, useCallback } from 'react';
import { Search, Star, Dumbbell, Heart, Zap, StretchHorizontal, X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useExerciseCatalog, useFilteredExercises, type ExerciseFilters } from '../hooks/useExerciseCatalog';
import { useExerciseFavorites } from '../hooks/useExerciseFavorites';
import { getBodyRegionName, getMuscleName } from '../utils/muscleNames';
import type { CatalogExercise, BodyRegion, ExerciseCategory } from '../../../types/health';

// ── Types ───────────────────────────────────────────────────────────────

interface ExercisePickerProps {
  onSelect: (exercise: CatalogExercise) => void;
  /** Optional: pre-filter to a single category */
  filterCategory?: ExerciseCategory;
  /** Optional: hide category tabs */
  hideCategoryTabs?: boolean;
  /** Optional: max height for the list */
  maxHeight?: string;
}

// ── Body Region Chips ───────────────────────────────────────────────────

const BODY_REGIONS: BodyRegion[] = [
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body', 'cardio',
];

const CATEGORY_CONFIG: { key: ExerciseCategory | 'all'; icon: typeof Dumbbell; de: string; en: string }[] = [
  { key: 'all', icon: Search, de: 'Alle', en: 'All' },
  { key: 'strength', icon: Dumbbell, de: 'Kraft', en: 'Strength' },
  { key: 'cardio', icon: Heart, de: 'Cardio', en: 'Cardio' },
  { key: 'functional', icon: Zap, de: 'Functional', en: 'Functional' },
  { key: 'flexibility', icon: StretchHorizontal, de: 'Flex', en: 'Flex' },
];

// ── Component ───────────────────────────────────────────────────────────

export function ExercisePicker({
  onSelect,
  filterCategory,
  hideCategoryTabs = false,
  maxHeight = '60vh',
}: ExercisePickerProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: catalog, isLoading } = useExerciseCatalog();
  const { isFavorite, toggleFavorite } = useExerciseFavorites();

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>(
    filterCategory ?? 'all'
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Build filters
  const filters: ExerciseFilters = useMemo(() => ({
    search: search || undefined,
    bodyRegion: selectedRegion ?? undefined,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  }), [search, selectedRegion, selectedCategory]);

  // Apply filters
  const filtered = useFilteredExercises(catalog, filters);

  // Sort: favorites first, then by sort_order
  const sorted = useMemo(() => {
    let items = [...filtered];

    // Favorites filter
    if (showFavoritesOnly) {
      items = items.filter((ex) => isFavorite(ex.id));
    }

    // Sort: favorites first, then sort_order
    items.sort((a, b) => {
      const aFav = isFavorite(a.id) ? 0 : 1;
      const bFav = isFavorite(b.id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

    return items;
  }, [filtered, showFavoritesOnly, isFavorite]);

  const handleFavClick = useCallback((e: React.MouseEvent, exerciseId: string) => {
    e.stopPropagation();
    toggleFavorite(exerciseId);
  }, [toggleFavorite]);

  const clearFilters = () => {
    setSearch('');
    setSelectedRegion(null);
    setSelectedCategory(filterCategory ?? 'all');
    setShowFavoritesOnly(false);
  };

  const hasActiveFilters = search || selectedRegion || selectedCategory !== (filterCategory ?? 'all') || showFavoritesOnly;

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isDE ? 'Übung suchen...' : 'Search exercise...'}
          className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          autoFocus
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Category Tabs (optional) */}
      {!hideCategoryTabs && !filterCategory && (
        <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1">
          {CATEGORY_CONFIG.map(({ key, icon: Icon, de, en }) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === key
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-3 w-3" />
              {isDE ? de : en}
            </button>
          ))}
        </div>
      )}

      {/* Body Region Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
        {/* Favorites chip */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            showFavoritesOnly
              ? 'bg-amber-400 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Star className="h-3 w-3" fill={showFavoritesOnly ? 'white' : 'none'} />
          {isDE ? 'Favoriten' : 'Favorites'}
        </button>

        {BODY_REGIONS.map((region) => (
          <button
            key={region}
            onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
            className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedRegion === region
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {getBodyRegionName(region, isDE ? 'de' : 'en')}
          </button>
        ))}
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {sorted.length} {isDE ? 'Übungen' : 'exercises'}
          </span>
          <button
            onClick={clearFilters}
            className="text-xs text-teal-500 hover:text-teal-600"
          >
            {isDE ? 'Filter zurücksetzen' : 'Clear filters'}
          </button>
        </div>
      )}

      {/* Exercise List */}
      <div className="overflow-y-auto -mx-1 px-1" style={{ maxHeight }}>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-gray-400">
            {isDE ? 'Lade Übungen...' : 'Loading exercises...'}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">
              {showFavoritesOnly
                ? (isDE ? 'Noch keine Favoriten' : 'No favorites yet')
                : (isDE ? 'Keine Übungen gefunden' : 'No exercises found')
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-xs text-teal-500 hover:text-teal-600"
              >
                {isDE ? 'Filter zurücksetzen' : 'Clear filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {sorted.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                isDE={isDE}
                isFav={isFavorite(ex.id)}
                onSelect={onSelect}
                onFavClick={handleFavClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Exercise Card ───────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: CatalogExercise;
  isDE: boolean;
  isFav: boolean;
  onSelect: (ex: CatalogExercise) => void;
  onFavClick: (e: React.MouseEvent, id: string) => void;
}

function ExerciseCard({ exercise, isDE, isFav, onSelect, onFavClick }: ExerciseCardProps) {
  const displayName = isDE ? exercise.name : (exercise.name_en ?? exercise.name);
  const muscles = (exercise.primary_muscles ?? [])
    .slice(0, 2)
    .map((m) => getMuscleName(m, isDE ? 'de' : 'en'));
  const difficulty = exercise.difficulty;
  const diffColor = difficulty === 'beginner' ? 'text-green-500' : difficulty === 'advanced' ? 'text-red-500' : 'text-yellow-500';

  return (
    <button
      onClick={() => onSelect(exercise)}
      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors group"
    >
      {/* Favorite star */}
      <button
        onClick={(e) => onFavClick(e, exercise.id)}
        className="p-0.5 rounded hover:bg-gray-100 flex-shrink-0"
      >
        <Star
          className={`h-3.5 w-3.5 transition-colors ${
            isFav ? 'text-amber-400 fill-amber-400' : 'text-gray-200 group-hover:text-gray-300'
          }`}
        />
      </button>

      {/* Name + muscles */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate font-medium">{displayName}</p>
        {muscles.length > 0 && (
          <p className="text-xs text-gray-400 truncate">{muscles.join(' · ')}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {exercise.is_compound && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium">
            {isDE ? 'Compound' : 'Compound'}
          </span>
        )}
        <span className={`text-[10px] ${diffColor}`}>
          {difficulty === 'beginner' ? '●' : difficulty === 'advanced' ? '●●●' : '●●'}
        </span>
      </div>
    </button>
  );
}
