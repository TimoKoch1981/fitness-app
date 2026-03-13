/**
 * RecipeEditor — Form for adding/editing recipes.
 * v2.0: Image upload, structured steps, difficulty, meal type, allergen detection.
 */

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Calculator,
  Camera,
  Clock,
  GripVertical,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useRecipeImport } from '../hooks/useRecipeImport';
import { useRecipeImage } from '../hooks/useRecipeImage';
import { detectAllergens, RECIPE_MEAL_TYPES } from '../types';
import type { Recipe, Ingredient, RecipeStep } from '../types';
import type { RecipeInput } from '../hooks/useRecipes';

interface RecipeEditorProps {
  recipe?: Recipe;
  onSave: (recipe: RecipeInput) => void;
  onClose: () => void;
}

const EMPTY_INGREDIENT: Ingredient = { name: '', amount: 0, unit: 'g' };
const EMPTY_STEP: RecipeStep = { text: '' };

const SUGGESTED_TAGS = [
  'High-Protein', 'Low-Carb', 'Vegetarisch', 'Vegan', 'Schnell',
  'Meal-Prep', 'Glutenfrei', 'Laktosefrei',
];

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Fruehstueck',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
};

export function RecipeEditor({ recipe, onSave, onClose }: RecipeEditorProps) {
  const { t } = useTranslation();
  const { parseText, parsedRecipe, error: importError, reset: resetImport } = useRecipeImport();
  const { uploadImage, uploading } = useRecipeImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(recipe?.title ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [servings, setServings] = useState(String(recipe?.servings ?? 2));
  const [prepTime, setPrepTime] = useState(String(recipe?.prep_time_min ?? ''));
  const [cookTime, setCookTime] = useState(String(recipe?.cook_time_min ?? ''));
  const [mealType, setMealType] = useState<string | null>(recipe?.meal_type ?? null);
  const [difficulty, setDifficulty] = useState(recipe?.difficulty ?? 'easy');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients?.length ? recipe.ingredients : [{ ...EMPTY_INGREDIENT }]
  );
  const [steps, setSteps] = useState<RecipeStep[]>(
    recipe?.steps?.length ? recipe.steps : [{ ...EMPTY_STEP }]
  );
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [calories, setCalories] = useState(String(recipe?.calories_per_serving ?? ''));
  const [protein, setProtein] = useState(String(recipe?.protein_per_serving ?? ''));
  const [carbs, setCarbs] = useState(String(recipe?.carbs_per_serving ?? ''));
  const [fat, setFat] = useState(String(recipe?.fat_per_serving ?? ''));
  const [imageUrl, setImageUrl] = useState<string | null>(recipe?.image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(recipe?.image_url ?? null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [formError, setFormError] = useState('');

  // Apply imported recipe data
  useEffect(() => {
    if (parsedRecipe) {
      if (parsedRecipe.name) setTitle(parsedRecipe.name);
      if (parsedRecipe.description) setDescription(parsedRecipe.description);
      if (parsedRecipe.servings) setServings(String(parsedRecipe.servings));
      if (parsedRecipe.prepTime) setPrepTime(String(parsedRecipe.prepTime));
      if (parsedRecipe.cookTime) setCookTime(String(parsedRecipe.cookTime));
      if (parsedRecipe.ingredients?.length) setIngredients(parsedRecipe.ingredients);
      if (parsedRecipe.instructions?.length) {
        setSteps(parsedRecipe.instructions.map(text => ({ text })));
      }
      setShowImport(false);
      resetImport();
    }
  }, [parsedRecipe, resetImport]);

  // ── Image handling ──────────────────────────────────────────────────────

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Ingredient management ─────────────────────────────────────────────

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const addIngredient = () => setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Step management ───────────────────────────────────────────────────

  const updateStep = (index: number, field: keyof RecipeStep, value: string | number) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addStep = () => setSteps((prev) => [...prev, { ...EMPTY_STEP }]);

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Tag management ────────────────────────────────────────────────────

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // ── Auto-calculate macros ─────────────────────────────────────────────

  const calculateMacros = () => {
    const totalServings = parseInt(servings) || 1;
    let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;
    ingredients.forEach((ing) => {
      totalCal += ing.calories ?? 0;
      totalPro += ing.protein ?? 0;
      totalCarb += ing.carbs ?? 0;
      totalFat += ing.fat ?? 0;
    });
    setCalories(String(Math.round(totalCal / totalServings)));
    setProtein(String(Math.round((totalPro / totalServings) * 10) / 10));
    setCarbs(String(Math.round((totalCarb / totalServings) * 10) / 10));
    setFat(String(Math.round((totalFat / totalServings) * 10) / 10));
  };

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError(t.recipes.nameRequired);
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    const validSteps = steps.filter((s) => s.text.trim());
    const detectedAllergens = detectAllergens(validIngredients);

    // Upload image if new file selected
    let finalImageUrl = imageUrl;
    if (imageFile) {
      const tempId = recipe?.id || crypto.randomUUID();
      const url = await uploadImage(imageFile, tempId);
      if (url) finalImageUrl = url;
    }

    const recipeInput: RecipeInput = {
      title: title.trim(),
      description: description.trim(),
      meal_type: mealType,
      prep_time_min: parseInt(prepTime) || 0,
      cook_time_min: parseInt(cookTime) || 0,
      servings: parseInt(servings) || 1,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      calories_per_serving: parseFloat(calories) || 0,
      protein_per_serving: parseFloat(protein) || 0,
      carbs_per_serving: parseFloat(carbs) || 0,
      fat_per_serving: parseFloat(fat) || 0,
      fiber_per_serving: null,
      sugar_per_serving: null,
      ingredients: validIngredients,
      steps: validSteps,
      tags,
      allergens: detectedAllergens,
      image_url: finalImageUrl,
      source_url: null,
      is_favorite: recipe?.is_favorite ?? false,
      is_public: false,
      fitness_goal: [],
    };

    onSave(recipeInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

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
          {/* Image upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-36 rounded-xl overflow-hidden cursor-pointer group"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-50 to-emerald-50 flex flex-col items-center justify-center">
                <Camera className="h-8 w-8 text-teal-300 mb-1" />
                <span className="text-xs text-teal-400">Foto hinzufuegen</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.recipes.recipeName}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          {/* Meal type chips */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Kategorie</label>
            <div className="flex gap-1.5 flex-wrap">
              {RECIPE_MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(mealType === type ? null : type)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    mealType === type
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {MEAL_TYPE_LABELS[type] || type}
                </button>
              ))}
            </div>
          </div>

          {/* Servings + Times + Difficulty */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">{t.recipes.servings}</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                min="1"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Vorb. (min)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                min="0"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Kochen (min)</label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                min="0"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Schwierigkeit</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs bg-white"
              >
                <option value="easy">Einfach</option>
                <option value="medium">Mittel</option>
                <option value="hard">Anspruchsvoll</option>
              </select>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.recipes.ingredients}</label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <GripVertical className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                  <input
                    type="number"
                    value={ing.amount || ''}
                    onChange={(e) => updateIngredient(i, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="w-14 px-1.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    className="w-16 px-1 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="EL">EL</option>
                    <option value="TL">TL</option>
                    <option value="Stueck">St</option>
                    <option value="Tasse">Tasse</option>
                    <option value="Prise">Prise</option>
                  </select>
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    placeholder={t.recipes.ingredientName}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    disabled={ingredients.length <= 1}
                    className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
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

          {/* Structured Steps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.recipes.instructions}</label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center mt-1.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-1">
                    <textarea
                      value={step.text}
                      onChange={(e) => updateStep(i, 'text', e.target.value)}
                      placeholder={`Schritt ${i + 1}...`}
                      rows={2}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                    />
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <input
                        type="number"
                        value={step.duration_min ?? ''}
                        onChange={(e) => updateStep(i, 'duration_min', parseInt(e.target.value) || 0)}
                        placeholder="Min (optional)"
                        min="0"
                        className="w-24 px-1.5 py-1 border border-gray-200 rounded text-[10px] focus:ring-1 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    disabled={steps.length <= 1}
                    className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 mt-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="mt-2 flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Schritt hinzufuegen
            </button>
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
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="kcal"
                  min="0"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">{t.recipes.protein} (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">{t.recipes.carbs} (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">{t.recipes.fat} (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {formError && <p className="text-xs text-red-500 text-center">{formError}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {uploading ? 'Bild wird hochgeladen...' : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
