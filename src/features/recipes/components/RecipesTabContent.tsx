/**
 * RecipesTabContent — Container component for the Recipes tab.
 * v3.0: Single "Add Recipe" entry point with method selection dialog.
 * Methods: Manual, URL Import, Web Search, Text Import.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { usePantry, useExcludedItems } from '../../pantry/hooks/usePantry';
import { computePantryMatchMap } from '../../pantry/utils/pantryMatcher';
import { SAMPLE_RECIPES } from '../data/sampleRecipes';
import { RecipeList } from './RecipeList';
import { RecipeDetail } from './RecipeDetail';
import { RecipeEditor } from './RecipeEditor';
import { AddRecipeMethodDialog } from './AddRecipeMethodDialog';
import { ImportRecipeDialog } from './ImportRecipeDialog';
import { RecipeSearchDialog } from './RecipeSearchDialog';
import { TextImportDialog } from './TextImportDialog';
import { detectAllergens, profileAllergensToRecipeAllergens } from '../types';
import type { Recipe } from '../types';
import { useProfile } from '../../auth/hooks/useProfile';
import type { RecipeInput } from '../hooks/useRecipes';
import { useTranslation } from '../../../i18n';
import { useCreateShoppingList } from '../../shopping/hooks/useShoppingLists';
import { buildShoppingListFromRecipe } from '../../shopping/utils/shoppingListBuilder';

interface RecipesTabContentProps {
  showAddDialog: boolean;
  onOpenAddDialog: () => void;
  onCloseAddDialog: () => void;
}

type View = 'list' | 'detail' | 'editor';

export function RecipesTabContent({ showAddDialog, onOpenAddDialog, onCloseAddDialog }: RecipesTabContentProps) {
  const { language } = useTranslation();
  const {
    recipes,
    filteredRecipes,
    allTags,
    filters,
    setFilters,
    setPantryItems,
    setExcludedItems,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    isLoading,
  } = useRecipes();

  // Load pantry for matching + excluded items for filtering
  const { data: pantryItems } = usePantry();
  const { data: excludedPantryItems } = useExcludedItems();
  const createShoppingList = useCreateShoppingList();
  const { data: profile } = useProfile();

  // Compute profile allergens mapped to recipe allergen keys
  const profileAllergens = useMemo(() => {
    if (!profile?.allergies || profile.allergies.length === 0) return [];
    return profileAllergensToRecipeAllergens(profile.allergies);
  }, [profile?.allergies]);

  const profileDietaryPrefs = useMemo(() => {
    return profile?.dietary_preferences ?? [];
  }, [profile?.dietary_preferences]);

  // Auto-sync profile allergens/dietary into filters on first load
  const [profileSynced, setProfileSynced] = useState(false);
  useEffect(() => {
    if (profileSynced || !profile) return;
    setProfileSynced(true);
    const updates: Partial<typeof filters> = {};
    if (profileAllergens.length > 0) {
      updates.excludeAllergens = profileAllergens;
      updates.allergenFilterEnabled = true;
    }
    if (profileDietaryPrefs.length > 0) {
      updates.dietaryFilter = profileDietaryPrefs;
      updates.dietaryFilterEnabled = true;
    }
    if (Object.keys(updates).length > 0) {
      setFilters((prev) => ({ ...prev, ...updates }));
    }
  }, [profile, profileSynced, profileAllergens, profileDietaryPrefs, setFilters, filters]);

  // Feed pantry + excluded items into useRecipes for filtering/sorting
  useEffect(() => {
    setPantryItems(pantryItems ?? []);
  }, [pantryItems, setPantryItems]);

  useEffect(() => {
    setExcludedItems(excludedPantryItems ?? []);
  }, [excludedPantryItems, setExcludedItems]);

  // Compute match map for UI badges
  const pantryMatchMap = useMemo(() => {
    if (!pantryItems || pantryItems.length === 0) return undefined;
    return computePantryMatchMap(recipes, pantryItems);
  }, [recipes, pantryItems]);

  const [view, setView] = useState<View>('list');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [importedData, setImportedData] = useState<Partial<Recipe> | null>(null);

  // Dialog states
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showTextImportDialog, setShowTextImportDialog] = useState(false);

  // Load sample recipes (convert legacy format to new DB format)
  const handleLoadSampleRecipes = useCallback(async () => {
    setLoadingSamples(true);
    let successCount = 0;
    let firstError = '';
    try {
      for (const sample of SAMPLE_RECIPES) {
        try {
          const tags = sample.tags || [];
          const name = sample.name.toLowerCase();
          const mealType = tags.includes('Fruehstueck') || name.includes('pancake') || name.includes('oat')
            ? 'breakfast'
            : tags.includes('Mittagessen') || name.includes('bowl') || name.includes('wrap')
              ? 'lunch'
              : tags.includes('Abendessen')
                ? 'dinner'
                : tags.includes('Snack')
                  ? 'snack'
                  : 'lunch';

          await addRecipe({
            title: sample.name,
            description: sample.description || '',
            meal_type: mealType,
            prep_time_min: sample.prepTime || 0,
            cook_time_min: sample.cookTime || 0,
            servings: sample.servings || 1,
            difficulty: 'easy',
            calories_per_serving: sample.macrosPerServing?.calories || 0,
            protein_per_serving: sample.macrosPerServing?.protein || 0,
            carbs_per_serving: sample.macrosPerServing?.carbs || 0,
            fat_per_serving: sample.macrosPerServing?.fat || 0,
            fiber_per_serving: null,
            sugar_per_serving: null,
            ingredients: sample.ingredients || [],
            steps: (sample.instructions || []).map(text => ({ text })),
            tags: sample.tags || [],
            allergens: detectAllergens(sample.ingredients || []),
            image_url: null,
            source_url: null,
            import_method: null,
            is_favorite: false,
            is_public: false,
            fitness_goal: [],
          });
          successCount++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message
            : (typeof err === 'object' && err !== null && 'message' in err) ? String((err as Record<string, unknown>).message)
            : JSON.stringify(err);
          console.error(`[RecipesTab] Failed to add sample recipe "${sample.name}":`, msg, err);
          if (!firstError) firstError = `${sample.name}: ${msg}`;
        }
      }
      if (successCount === 0) {
        alert(language === 'de'
          ? `Fehler: ${firstError || 'Rezepte konnten nicht geladen werden.'}`
          : `Error: ${firstError || 'Could not load recipes.'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('[RecipesTab] handleLoadSampleRecipes failed:', msg, err);
      alert(language === 'de'
        ? `Fehler beim Laden der Starter-Rezepte: ${msg}`
        : `Error loading sample recipes: ${msg}`);
    } finally {
      setLoadingSamples(false);
    }
  }, [addRecipe, language]);

  const handleSelectRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setView('detail');
  }, []);

  // Single entry point: opens method selection dialog
  const handleAddRecipe = useCallback(() => {
    setShowMethodDialog(true);
  }, []);

  // Method handlers
  const handleManualCreate = useCallback(() => {
    setEditingRecipe(undefined);
    setImportedData(null);
    setView('editor');
    onOpenAddDialog();
  }, [onOpenAddDialog]);

  const handleImportUrl = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  const handleWebSearch = useCallback(() => {
    setShowSearchDialog(true);
  }, []);

  const handleImportText = useCallback(() => {
    setShowTextImportDialog(true);
  }, []);

  const handleEditRecipe = useCallback((recipe: Recipe) => {
    setEditingRecipe(recipe);
    setView('editor');
  }, []);

  const handleSaveRecipe = useCallback(
    async (input: RecipeInput) => {
      try {
        if (editingRecipe) {
          const updated = await updateRecipe(editingRecipe.id, input);
          setSelectedRecipe(updated || null);
        } else {
          const newRecipe = await addRecipe(input);
          setSelectedRecipe(newRecipe || null);
        }
        setView('list');
        setEditingRecipe(undefined);
        setImportedData(null);
        onCloseAddDialog();
      } catch (e) {
        console.error('[RecipesTabContent] Save failed:', e);
      }
    },
    [editingRecipe, addRecipe, updateRecipe, onCloseAddDialog]
  );

  const handleDeleteRecipe = useCallback(
    async (id: string) => {
      await deleteRecipe(id);
      setSelectedRecipe(null);
      setView('list');
    },
    [deleteRecipe]
  );

  const handleToggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      await toggleFavorite(id, isFavorite);
      setSelectedRecipe(prev =>
        prev && prev.id === id ? { ...prev, is_favorite: isFavorite } : prev
      );
    },
    [toggleFavorite]
  );

  // Shared callback: imported data → open editor with prefilled data
  const handleImported = useCallback((data: Record<string, unknown>) => {
    const partial = data as unknown as Partial<Recipe>;
    setImportedData(partial);
    setEditingRecipe(undefined);
    setView('editor');
    onOpenAddDialog();
  }, [onOpenAddDialog]);

  // Shared callback: text imported data → open editor with prefilled data
  const handleTextImported = useCallback((data: Partial<Recipe>) => {
    setImportedData(data);
    setEditingRecipe(undefined);
    setView('editor');
    onOpenAddDialog();
  }, [onOpenAddDialog]);

  const handleAddToShoppingList = useCallback(
    async (recipe: Recipe) => {
      // Try missing-only first; fall back to ALL ingredients if nothing missing
      let items = buildShoppingListFromRecipe(recipe, pantryItems ?? []);
      const allAvailable = items.length === 0;
      if (allAvailable) {
        // Build list with ALL ingredients (empty pantry = no subtraction)
        items = buildShoppingListFromRecipe(recipe, []);
      }
      if (items.length === 0) return; // No ingredients at all
      try {
        await createShoppingList.mutateAsync({
          name: recipe.title,
          items,
          source_recipe_id: recipe.id,
        });
        alert(language === 'de'
          ? `${items.length} Zutat${items.length > 1 ? 'en' : ''} zur Einkaufsliste hinzugefuegt!`
          : `${items.length} ingredient${items.length > 1 ? 's' : ''} added to shopping list!`);
      } catch (e) {
        console.error('[RecipesTabContent] Shopping list creation failed:', e);
      }
    },
    [pantryItems, createShoppingList, language],
  );

  const handleClose = useCallback(() => {
    setView('list');
    setSelectedRecipe(null);
    setEditingRecipe(undefined);
    setImportedData(null);
    onCloseAddDialog();
  }, [onCloseAddDialog]);

  return (
    <>
      <RecipeList
        recipes={recipes}
        filteredRecipes={filteredRecipes}
        allTags={allTags}
        filters={filters}
        onSetFilters={setFilters}
        onSelectRecipe={handleSelectRecipe}
        onAddRecipe={handleAddRecipe}
        onLoadSampleRecipes={handleLoadSampleRecipes}
        isLoading={isLoading}
        isLoadingSamples={loadingSamples}
        pantryMatchMap={pantryMatchMap}
        hasPantry={!!pantryItems && pantryItems.length > 0}
        hasExcludedItems={!!excludedPantryItems && excludedPantryItems.length > 0}
        profileAllergens={profileAllergens}
        profileDietaryPrefs={profileDietaryPrefs}
      />

      {view === 'detail' && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={handleClose}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
          onToggleFavorite={handleToggleFavorite}
          pantryMatch={pantryMatchMap?.get(selectedRecipe.id)}
          onAddToShoppingList={handleAddToShoppingList}
        />
      )}

      {(view === 'editor' || showAddDialog) && (
        <RecipeEditor
          recipe={editingRecipe}
          importedData={importedData ?? undefined}
          onSave={handleSaveRecipe}
          onClose={handleClose}
        />
      )}

      {/* Method selection dialog */}
      <AddRecipeMethodDialog
        open={showMethodDialog}
        onClose={() => setShowMethodDialog(false)}
        onManual={handleManualCreate}
        onImportUrl={handleImportUrl}
        onWebSearch={handleWebSearch}
        onImportText={handleImportText}
      />

      {/* URL import dialog */}
      <ImportRecipeDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImported={handleImported}
      />

      {/* Web search dialog */}
      <RecipeSearchDialog
        open={showSearchDialog}
        onClose={() => setShowSearchDialog(false)}
        onImported={handleImported}
      />

      {/* Text import dialog */}
      <TextImportDialog
        open={showTextImportDialog}
        onClose={() => setShowTextImportDialog(false)}
        onImported={handleTextImported}
      />
    </>
  );
}
