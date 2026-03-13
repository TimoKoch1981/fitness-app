/**
 * RecipesTabContent — Container component for the Recipes tab.
 * v2.0: Supabase-backed, async operations, image support, favorites.
 */

import { useState, useCallback } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { SAMPLE_RECIPES } from '../data/sampleRecipes';
import { RecipeList } from './RecipeList';
import { RecipeDetail } from './RecipeDetail';
import { RecipeEditor } from './RecipeEditor';
import { detectAllergens } from '../types';
import type { Recipe } from '../types';
import type { RecipeInput } from '../hooks/useRecipes';
import { useTranslation } from '../../../i18n';

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
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    isLoading,
  } = useRecipes();

  const [view, setView] = useState<View>('list');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [loadingSamples, setLoadingSamples] = useState(false);

  // Load sample recipes (convert legacy format to new DB format)
  const handleLoadSampleRecipes = useCallback(async () => {
    setLoadingSamples(true);
    let successCount = 0;
    try {
      for (const sample of SAMPLE_RECIPES) {
        try {
          await addRecipe({
            title: sample.name,
            description: sample.description || '',
            meal_type: null,
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
            is_favorite: false,
            is_public: false,
            fitness_goal: [],
          });
          successCount++;
        } catch (err) {
          console.error(`[RecipesTab] Failed to add sample recipe "${sample.name}":`, err);
        }
      }
      if (successCount === 0) {
        alert(language === 'de'
          ? 'Fehler: Rezepte konnten nicht geladen werden. Bitte versuche es erneut.'
          : 'Error: Could not load recipes. Please try again.');
      }
    } catch (err) {
      console.error('[RecipesTab] handleLoadSampleRecipes failed:', err);
      alert(language === 'de'
        ? 'Fehler beim Laden der Starter-Rezepte.'
        : 'Error loading sample recipes.');
    } finally {
      setLoadingSamples(false);
    }
  }, [addRecipe, language]);

  const handleSelectRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setView('detail');
  }, []);

  const handleAddRecipe = useCallback(() => {
    setEditingRecipe(undefined);
    setView('editor');
    onOpenAddDialog();
  }, [onOpenAddDialog]);

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
      // Update local selected recipe
      setSelectedRecipe(prev =>
        prev && prev.id === id ? { ...prev, is_favorite: isFavorite } : prev
      );
    },
    [toggleFavorite]
  );

  const handleClose = useCallback(() => {
    setView('list');
    setSelectedRecipe(null);
    setEditingRecipe(undefined);
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
      />

      {view === 'detail' && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={handleClose}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {(view === 'editor' || showAddDialog) && (
        <RecipeEditor
          recipe={editingRecipe}
          onSave={handleSaveRecipe}
          onClose={handleClose}
        />
      )}
    </>
  );
}
