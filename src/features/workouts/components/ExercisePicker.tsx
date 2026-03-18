/**
 * ExercisePicker — Shared exercise search & filter component.
 *
 * Features:
 * - Body region filter chips (Brust, Rücken, Schultern, ...)
 * - Pose category chips for Yoga (Standing, Backbend, Twist, ...)
 * - Free-text search (name, aliases, muscles)
 * - Favorites (star toggle, favorites-first sort)
 * - Category tabs (Kraft, Cardio, Flex, Functional)
 * - Context-aware filtering via dayType prop (yoga, tai_chi, five_tibetans)
 * - Compact result cards with primary muscles
 *
 * Used by: AddExerciseDialog, Plan-Editor, PlanWizardExerciseStep.
 */

import { useState, useMemo, useCallback } from 'react';
import { Search, Star, Dumbbell, Heart, Zap, StretchHorizontal, X, Check, Plus } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useExerciseCatalog, useFilteredExercises, type ExerciseFilters } from '../hooks/useExerciseCatalog';
import { useExerciseFavorites } from '../hooks/useExerciseFavorites';
import { getBodyRegionName, getMuscleName, getPoseCategoryName, getPoseCategoryIcon } from '../utils/muscleNames';
import type { CatalogExercise, BodyRegion, ExerciseCategory, DayType, PoseCategory } from '../../../types/health';

// ── Types ───────────────────────────────────────────────────────────────

interface ExercisePickerProps {
  onSelect: (exercise: CatalogExercise) => void;
  /** Multi-select mode: enables batch selection with confirm button (Hevy/JEFIT pattern) */
  multiSelect?: boolean;
  /** Called when multi-select confirm is pressed */
  onMultiSelectConfirm?: (exercises: CatalogExercise[]) => void;
  /** Optional: pre-filter to a single category */
  filterCategory?: ExerciseCategory;
  /** Optional: hide category tabs */
  hideCategoryTabs?: boolean;
  /** Optional: max height for the list */
  maxHeight?: string;
  /** Optional: day type for context-aware filtering (yoga, tai_chi, five_tibetans, etc.) */
  dayType?: DayType;
}

// ── Body Region Chips ───────────────────────────────────────────────────

const BODY_REGIONS: BodyRegion[] = [
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body', 'cardio',
];

/** Pose categories shown for Yoga day types */
const YOGA_POSE_CATEGORIES: PoseCategory[] = [
  'standing', 'forward_fold', 'backbend', 'seated', 'core', 'inversion', 'balance', 'twist', 'restorative', 'flow',
];

/** Pose categories shown for Tai Chi day types */
const TAI_CHI_POSE_CATEGORIES: PoseCategory[] = [
  'tai_chi_form', 'tai_chi_qigong',
];

const CATEGORY_CONFIG: { key: ExerciseCategory | 'all'; icon: typeof Dumbbell; de: string; en: string }[] = [
  { key: 'all', icon: Search, de: 'Alle', en: 'All' },
  { key: 'strength', icon: Dumbbell, de: 'Kraft', en: 'Strength' },
  { key: 'cardio', icon: Heart, de: 'Cardio', en: 'Cardio' },
  { key: 'functional', icon: Zap, de: 'Functional', en: 'Functional' },
  { key: 'flexibility', icon: StretchHorizontal, de: 'Flex', en: 'Flex' },
];

/**
 * Map dayType to subcategory prefix for filtering.
 */
function getSubcategoryPrefix(dayType?: DayType): string | undefined {
  switch (dayType) {
    case 'yoga': return 'yoga';
    case 'tai_chi': return 'tai_chi';
    case 'five_tibetans': return 'five_tibetans';
    default: return undefined;
  }
}

// ── Component ───────────────────────────────────────────────────────────

export function ExercisePicker({
  onSelect,
  multiSelect = false,
  onMultiSelectConfirm,
  filterCategory,
  hideCategoryTabs = false,
  maxHeight = '60vh',
  dayType,
}: ExercisePickerProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: catalog, isLoading } = useExerciseCatalog();
  const { isFavorite, toggleFavorite } = useExerciseFavorites();

  // Determine context from dayType
  const subcategoryPrefix = getSubcategoryPrefix(dayType);
  const isMindBodyDay = dayType === 'yoga' || dayType === 'tai_chi' || dayType === 'five_tibetans';
  const isYogaDay = dayType === 'yoga';
  const isTaiChiDay = dayType === 'tai_chi';
  const isFiveTibetansDay = dayType === 'five_tibetans';

  // Multi-select state
  const [selected, setSelected] = useState<Map<string, CatalogExercise>>(new Map());

  const toggleSelected = useCallback((ex: CatalogExercise) => {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(ex.id)) {
        next.delete(ex.id);
      } else {
        next.set(ex.id, ex);
      }
      return next;
    });
  }, []);

  const handleConfirmMulti = useCallback(() => {
    if (onMultiSelectConfirm && selected.size > 0) {
      onMultiSelectConfirm(Array.from(selected.values()));
      setSelected(new Map());
    }
  }, [onMultiSelectConfirm, selected]);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const [selectedPoseCategory, setSelectedPoseCategory] = useState<PoseCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>(
    filterCategory ?? (isMindBodyDay ? 'flexibility' : 'all')
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  // Subcategory filter for Flex tab (when no dayType is set)
  const [flexSubFilter, setFlexSubFilter] = useState<'all' | 'yoga' | 'tai_chi' | 'five_tibetans' | null>(null);

  // Show flex sub-filters when "Flex" tab is selected and we're NOT in a dayType context
  const showFlexSubFilters = !isMindBodyDay && selectedCategory === 'flexibility';

  // Effective subcategory prefix: from dayType (PlanWizard) OR from flexSubFilter (standalone)
  const effectiveSubcategoryPrefix = subcategoryPrefix
    ?? (flexSubFilter && flexSubFilter !== 'all' ? flexSubFilter : undefined);

  // When switching to Flex tab, also show pose chips if a yoga/tai_chi sub-filter is active
  const flexSubIsYoga = flexSubFilter === 'yoga';
  const flexSubIsTaiChi = flexSubFilter === 'tai_chi';
  const flexSubIsFiveTibetans = flexSubFilter === 'five_tibetans';

  // Build filters
  const filters: ExerciseFilters = useMemo(() => ({
    search: search || undefined,
    bodyRegion: selectedRegion ?? undefined,
    category: isMindBodyDay ? 'flexibility' : (selectedCategory === 'all' ? undefined : selectedCategory),
    subcategoryPrefix: effectiveSubcategoryPrefix ?? undefined,
    poseCategory: selectedPoseCategory ?? undefined,
  }), [search, selectedRegion, selectedCategory, effectiveSubcategoryPrefix, selectedPoseCategory, isMindBodyDay]);

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
    setSelectedPoseCategory(null);
    setFlexSubFilter(null);
    setSelectedCategory(filterCategory ?? (isMindBodyDay ? 'flexibility' : 'all'));
    setShowFavoritesOnly(false);
  };

  const hasActiveFilters = search || selectedRegion || selectedPoseCategory || showFavoritesOnly || flexSubFilter ||
    selectedCategory !== (filterCategory ?? (isMindBodyDay ? 'flexibility' : 'all'));

  // Determine which filter chips to show
  const showPoseCategoryChips = isYogaDay || isTaiChiDay || flexSubIsYoga || flexSubIsTaiChi;
  const poseCategories = (isYogaDay || flexSubIsYoga)
    ? YOGA_POSE_CATEGORIES
    : (isTaiChiDay || flexSubIsTaiChi) ? TAI_CHI_POSE_CATEGORIES : [];

  // Five Tibetans: minimal UI — only 5 fixed exercises, no filters needed
  const showFilters = !isFiveTibetansDay && !flexSubIsFiveTibetans;

  return (
    <div className="space-y-3">
      {/* Context Banner for Mind-Body days */}
      {isMindBodyDay && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
          isYogaDay ? 'bg-purple-50 text-purple-700' :
          isTaiChiDay ? 'bg-amber-50 text-amber-700' :
          'bg-teal-50 text-teal-700'
        }`}>
          <span className="text-base">
            {isYogaDay ? '🧘' : isTaiChiDay ? '🥋' : '🌀'}
          </span>
          <span>
            {isYogaDay
              ? (isDE ? 'Yoga-Posen' : 'Yoga Poses')
              : isTaiChiDay
                ? (isDE ? 'Tai Chi Bewegungen' : 'Tai Chi Movements')
                : (isDE ? '5 Tibeter — alle 5 Riten' : '5 Tibetans — all 5 rites')
            }
          </span>
          <span className="ml-auto text-[10px] opacity-60">
            {sorted.length} {isDE ? 'verfügbar' : 'available'}
          </span>
        </div>
      )}

      {/* Search Input */}
      {showFilters && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isYogaDay ? (isDE ? 'Yoga-Pose suchen...' : 'Search yoga pose...') :
              isTaiChiDay ? (isDE ? 'Tai Chi Bewegung suchen...' : 'Search tai chi movement...') :
              (isDE ? 'Übung suchen...' : 'Search exercise...')
            }
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
      )}

      {/* Category Tabs — hidden for mind-body days (already filtered by subcategory) */}
      {!hideCategoryTabs && !filterCategory && !isMindBodyDay && (
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

      {/* Flex Subcategory Chips — shown when Flex tab is active without dayType context */}
      {showFlexSubFilters && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
          {([
            { key: 'all' as const, labelDE: 'Alle Flex', labelEN: 'All Flex', icon: '🤸' },
            { key: 'yoga' as const, labelDE: 'Yoga', labelEN: 'Yoga', icon: '🧘' },
            { key: 'tai_chi' as const, labelDE: 'Tai Chi', labelEN: 'Tai Chi', icon: '🥋' },
            { key: 'five_tibetans' as const, labelDE: '5 Tibeter', labelEN: '5 Tibetans', icon: '🌀' },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setFlexSubFilter(flexSubFilter === opt.key ? null : opt.key);
                setSelectedPoseCategory(null);
                setSelectedRegion(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                flexSubFilter === opt.key
                  ? opt.key === 'yoga' ? 'bg-purple-500 text-white'
                    : opt.key === 'tai_chi' ? 'bg-amber-500 text-white'
                    : opt.key === 'five_tibetans' ? 'bg-teal-500 text-white'
                    : 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs">{opt.icon}</span>
              {isDE ? opt.labelDE : opt.labelEN}
            </button>
          ))}
        </div>
      )}

      {/* Pose Category Chips (Yoga / Tai Chi) — replaces body region chips */}
      {showPoseCategoryChips && showFilters && (
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

          {poseCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedPoseCategory(selectedPoseCategory === cat ? null : cat)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedPoseCategory === cat
                  ? (isYogaDay ? 'bg-purple-500 text-white' : 'bg-amber-500 text-white')
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs">{getPoseCategoryIcon(cat)}</span>
              {getPoseCategoryName(cat, isDE ? 'de' : 'en')}
            </button>
          ))}
        </div>
      )}

      {/* Body Region Chips — for strength/cardio/general days */}
      {!showPoseCategoryChips && showFilters && (
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
      )}

      {/* Active filters indicator */}
      {hasActiveFilters && showFilters && (
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
      <div className="overflow-y-auto -mx-1 px-1" style={{ maxHeight: multiSelect && selected.size > 0 ? `calc(${maxHeight} - 3rem)` : maxHeight }}>
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
                isSelected={multiSelect ? selected.has(ex.id) : false}
                multiSelect={multiSelect}
                isMindBodyDay={isMindBodyDay || !!flexSubFilter}
                onSelect={multiSelect ? () => toggleSelected(ex) : () => onSelect(ex)}
                onFavClick={handleFavClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Multi-select confirm button (sticky) */}
      {multiSelect && selected.size > 0 && (
        <button
          onClick={handleConfirmMulti}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors font-semibold shadow-md"
        >
          <Plus className="h-4 w-4" />
          {selected.size} {isDE ? 'Übungen hinzufügen' : selected.size === 1 ? 'exercise' : 'exercises'}
        </button>
      )}
    </div>
  );
}

// ── Exercise Card ───────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: CatalogExercise;
  isDE: boolean;
  isFav: boolean;
  isSelected?: boolean;
  multiSelect?: boolean;
  isMindBodyDay?: boolean;
  onSelect: (ex: CatalogExercise) => void;
  onFavClick: (e: React.MouseEvent, id: string) => void;
}

function ExerciseCard({ exercise, isDE, isFav, isSelected, multiSelect, isMindBodyDay, onSelect, onFavClick }: ExerciseCardProps) {
  const displayName = isDE ? exercise.name : (exercise.name_en ?? exercise.name);

  // For mind-body exercises, show sanskrit name or pose category instead of muscles
  const subtitle = isMindBodyDay
    ? (exercise.sanskrit_name
        ? exercise.sanskrit_name
        : exercise.pose_category
          ? getPoseCategoryName(exercise.pose_category, isDE ? 'de' : 'en')
          : '')
    : (exercise.primary_muscles ?? [])
        .slice(0, 2)
        .map((m) => getMuscleName(m, isDE ? 'de' : 'en'))
        .join(' · ');

  const difficulty = exercise.difficulty;
  const diffColor = difficulty === 'beginner' ? 'text-green-500' : difficulty === 'advanced' ? 'text-red-500' : 'text-yellow-500';

  // Hold duration badge for yoga/isometric exercises
  const holdDuration = exercise.hold_duration_seconds;

  return (
    <button
      onClick={() => onSelect(exercise)}
      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-lg transition-colors group ${
        isSelected
          ? 'bg-teal-50 border border-teal-200'
          : 'hover:bg-gray-50'
      }`}
    >
      {/* Multi-select checkbox OR Favorite star */}
      {multiSelect ? (
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isSelected
            ? 'bg-teal-500 border-teal-500'
            : 'border-gray-300 group-hover:border-gray-400'
        }`}>
          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>
      ) : (
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
      )}

      {/* Name + subtitle */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate font-medium">{displayName}</p>
        {subtitle && (
          <p className={`text-xs truncate ${isMindBodyDay && exercise.sanskrit_name ? 'text-purple-400 italic' : 'text-gray-400'}`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isMindBodyDay && holdDuration && holdDuration > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
            {holdDuration}s
          </span>
        )}
        {!isMindBodyDay && exercise.is_compound && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium">
            Compound
          </span>
        )}
        <span className={`text-[10px] ${diffColor}`}>
          {difficulty === 'beginner' ? '●' : difficulty === 'advanced' ? '●●●' : '●●'}
        </span>
      </div>
    </button>
  );
}
