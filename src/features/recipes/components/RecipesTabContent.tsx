/**
 * RecipesTabContent — Container component for the Recipes tab.
 * Manages navigation between list, detail, and editor views.
 */

import { useState, useCallback } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { SAMPLE_RECIPES } from '../data/sampleRecipes';
import { RecipeList } from './RecipeList';
import { RecipeDetail } from './RecipeDetail';
import { RecipeEditor } from './RecipeEditor';
import type { Recipe } from '../types';

interface RecipesTabContentProps {
  showAddDialog: boolean;
  onOpenAddDialog: () => void;
  onCloseAddDialog: () => void;
}

type View = 'list' | 'detail' | 'editor';

export function RecipesTabContent({ showAddDialog, onOpenAddDialog, onCloseAddDialog }: RecipesTabContentProps) {
  const {
    recipes,
    filteredRecipes,
    allTags,
    filters,
    setFilters,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  } = useRecipes();

  const [view, setView] = useState<View>('list');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);

  // Load sample recipes
  const handleLoadSampleRecipes = useCallback(() => {
    SAMPLE_RECIPES.forEach((sample) => {
      addRecipe({
        ...sample,
        userId: 'local',
      });
    });
  }, [addRecipe]);

  // Open detail
  const handleSelectRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setView('detail');
  }, []);

  // Open editor for new
  const handleAddRecipe = useCallback(() => {
    setEditingRecipe(undefined);
    setView('editor');
    onOpenAddDialog();
  }, [onOpenAddDialog]);

  // Open editor for existing
  const handleEditRecipe = useCallback((recipe: Recipe) => {
    setEditingRecipe(recipe);
    setView('editor');
  }, []);

  // Save recipe (add or update)
  const handleSaveRecipe = useCallback(
    (input: Omit<Recipe, 'id' | 'createdAt'>) => {
      if (editingRecipe) {
        updateRecipe(editingRecipe.id, input);
        // Update the selected recipe if viewing
        setSelectedRecipe((prev) =>
          prev && prev.id === editingRecipe.id
            ? { ...prev, ...input }
            : prev
        );
      } else {
        const newRecipe = addRecipe({
          ...input,
          userId: 'local',
        });
        setSelectedRecipe(newRecipe);
      }
      setView('list');
      setEditingRecipe(undefined);
      onCloseAddDialog();
    },
    [editingRecipe, addRecipe, updateRecipe, onCloseAddDialog]
  );

  // Delete recipe
  const handleDeleteRecipe = useCallback(
    (id: string) => {
      deleteRecipe(id);
      setSelectedRecipe(null);
      setView('list');
    },
    [deleteRecipe]
  );

  // Close detail/editor back to list
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
      />

      {/* Detail overlay */}
      {view === 'detail' && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={handleClose}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
        />
      )}

      {/* Editor overlay */}
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
