/**
 * RecipeEditor — Form for adding/editing recipes.
 * Supports dynamic ingredient rows, text import, and auto-calculate macros.
 */

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Calculator } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useRecipeImport } from '../hooks/useRecipeImport';
import type { Recipe, Ingredient, MacrosPerServing } from '../types';

interface RecipeEditorProps {
  recipe?: Recipe; // If provided, we're editing
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const EMPTY_INGREDIENT: Ingredient = { name: '', amount: 0, unit: 'g' };

const SUGGESTED_TAGS = [
  'High-Protein',
  'Low-Carb',
  'Vegetarisch',
  'Vegan',
  'Schnell',
  'Meal-Prep',
  'Fruehstueck',
  'Mittagessen',
  'Abendessen',
  'Snack',
];

export function RecipeEditor({ recipe, onSave, onClose }: RecipeEditorProps) {
  const { t } = useTranslation();
  const { parseText, parsedRecipe, error: importError, reset: resetImport } = useRecipeImport();

  const [name, setName] = useState(recipe?.name ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [servings, setServings] = useState(String(recipe?.servings ?? 2));
  const [prepTime, setPrepTime] = useState(String(recipe?.prepTime ?? ''));
  const [cookTime, setCookTime] = useState(String(recipe?.cookTime ?? ''));
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients?.length ? recipe.ingredients : [{ ...EMPTY_INGREDIENT }]
  );
  const [instructionsText, setInstructionsText] = useState(
    recipe?.instructions?.join('\n') ?? ''
  );
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [macros, setMacros] = useState<MacrosPerServing>(
    recipe?.macrosPerServing ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [formError, setFormError] = useState('');

  // Apply imported recipe data
  useEffect(() => {
    if (parsedRecipe) {
      if (parsedRecipe.name) setName(parsedRecipe.name);
      if (parsedRecipe.description) setDescription(parsedRecipe.description);
      if (parsedRecipe.servings) setServings(String(parsedRecipe.servings));
      if (parsedRecipe.prepTime) setPrepTime(String(parsedRecipe.prepTime));
      if (parsedRecipe.cookTime) setCookTime(String(parsedRecipe.cookTime));
      if (parsedRecipe.ingredients?.length) setIngredients(parsedRecipe.ingredients);
      if (parsedRecipe.instructions?.length) {
        setInstructionsText(parsedRecipe.instructions.join('\n'));
      }
      setShowImport(false);
      resetImport();
    }
  }, [parsedRecipe, resetImport]);

  // ── Ingredient management ─────────────────────────────────────────────

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Tag management ────────────────────────────────────────────────────

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // ── Auto-calculate macros from ingredients ────────────────────────────

  const calculateMacros = () => {
    const totalServings = parseInt(servings) || 1;
    let totalCal = 0;
    let totalPro = 0;
    let totalCarb = 0;
    let totalFat = 0;

    ingredients.forEach((ing) => {
      totalCal += ing.calories ?? 0;
      totalPro += ing.protein ?? 0;
      totalCarb += ing.carbs ?? 0;
      totalFat += ing.fat ?? 0;
    });

    setMacros({
      calories: Math.round(totalCal / totalServings),
      protein: Math.round((totalPro / totalServings) * 10) / 10,
      carbs: Math.round((totalCarb / totalServings) * 10) / 10,
      fat: Math.round((totalFat / totalServings) * 10) / 10,
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError(t.recipes.nameRequired);
      return;
    }

    const instructions = instructionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const validIngredients = ingredients.filter((ing) => ing.name.trim());

    onSave({
      name: name.trim(),
      description: description.trim(),
      servings: parseInt(servings) || 1,
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      ingredients: validIngredients,
      instructions,
      macrosPerServing: macros,
      tags,
      userId: '', // Set by the parent
      isPublic: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {recipe ? t.recipes.editRecipe : t.recipes.addRecipe}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Import from text */}
          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FileText className="h-4 w-4" />
            {t.recipes.importFromText}
          </button>

          {showImport && (
            <div className="space-y-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={t.recipes.importPlaceholder}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              />
              {importError && <p className="text-xs text-red-500">{importError}</p>}
              <button
                type="button"
                onClick={() => parseText(importText)}
                className="w-full py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
              >
                {t.recipes.parseImport}
              </button>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.recipes.recipeName}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.recipes.recipeNamePlaceholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.recipes.description}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.recipes.descriptionPlaceholder}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Servings + Times */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.recipes.servings}</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.recipes.prepTime} (min)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.recipes.cookTime} (min)</label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.recipes.ingredients}</label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="number"
                    value={ing.amount || ''}
                    onChange={(e) => updateIngredient(i, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="EL">EL</option>
                    <option value="TL">TL</option>
                    <option value="Stueck">Stueck</option>
                    <option value="Tasse">Tasse</option>
                    <option value="Prise">Prise</option>
                  </select>
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    placeholder={t.recipes.ingredientName}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    disabled={ingredients.length <= 1}
                    className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-3.5 w-3.5" />
              {t.recipes.addIngredient}
            </button>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.recipes.instructions}</label>
            <p className="text-xs text-gray-400 mb-1">{t.recipes.instructionsHint}</p>
            <textarea
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              placeholder={t.recipes.instructionsPlaceholder}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.recipes.tags}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-teal-400 hover:text-teal-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={t.recipes.tagsPlaceholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {SUGGESTED_TAGS.filter((st) => !tags.includes(st)).slice(0, 5).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => addTag(st)}
                  className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full hover:bg-gray-200"
                >
                  + {st}
                </button>
              ))}
            </div>
          </div>

          {/* Macros per Serving */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">{t.recipes.macros} ({t.recipes.perServing})</label>
              <button
                type="button"
                onClick={calculateMacros}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
              >
                <Calculator className="h-3.5 w-3.5" />
                {t.recipes.autoCalculate}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">{t.recipes.calories}</label>
                <input
                  type="number"
                  value={macros.calories || ''}
                  onChange={(e) => setMacros({ ...macros, calories: parseInt(e.target.value) || 0 })}
                  placeholder="kcal"
                  min="0"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">{t.recipes.protein} (g)</label>
                <input
                  type="number"
                  value={macros.protein || ''}
                  onChange={(e) => setMacros({ ...macros, protein: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">{t.recipes.carbs} (g)</label>
                <input
                  type="number"
                  value={macros.carbs || ''}
                  onChange={(e) => setMacros({ ...macros, carbs: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">{t.recipes.fat} (g)</label>
                <input
                  type="number"
                  value={macros.fat || ''}
                  onChange={(e) => setMacros({ ...macros, fat: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {formError && <p className="text-xs text-red-500 text-center">{formError}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 transition-all"
          >
            {t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
