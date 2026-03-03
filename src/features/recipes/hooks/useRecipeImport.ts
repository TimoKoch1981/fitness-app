/**
 * useRecipeImport — Parse recipe text into structured Recipe data.
 * MVP: regex-based text parsing (no AI needed).
 * Supports common recipe formats with ingredient lines and step lists.
 */

import { useState, useCallback } from 'react';
import type { Recipe, Ingredient } from '../types';

// ── Regex patterns for ingredient parsing ───────────────────────────────

/**
 * Match ingredient lines like:
 * "200g Haehnchenbrust" | "2 EL Olivenoel" | "1/2 TL Salz" | "3 Stueck Eier"
 */
const INGREDIENT_PATTERN =
  /^[\s-]*(\d+(?:[.,/]\d+)?)\s*(g|kg|ml|l|EL|TL|Stueck|Tasse|Tassen|Becher|Prise|Prisen|Scheiben?|Zehe[n]?|Bund)?\s+(.+)$/i;

/**
 * Match common unit abbreviations and normalize them.
 */
const UNIT_MAP: Record<string, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  el: 'EL',
  tl: 'TL',
  stueck: 'Stueck',
  tasse: 'Tasse',
  tassen: 'Tasse',
  becher: 'Becher',
  prise: 'Prise',
  prisen: 'Prise',
  scheibe: 'Scheibe',
  scheiben: 'Scheibe',
  zehe: 'Zehe',
  zehen: 'Zehe',
  bund: 'Bund',
};

// ── Pure parsing functions (exported for testing) ───────────────────────

/**
 * Parse a single ingredient line into an Ingredient object.
 * Returns null if the line cannot be parsed.
 */
export function parseIngredientLine(line: string): Ingredient | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const match = trimmed.match(INGREDIENT_PATTERN);
  if (!match) {
    // Fallback: treat entire line as ingredient name with amount 1
    if (trimmed.length > 1 && trimmed.length < 100) {
      return { name: trimmed, amount: 1, unit: 'Stueck' };
    }
    return null;
  }

  const rawAmount = match[1].replace(',', '.');
  let amount: number;
  if (rawAmount.includes('/')) {
    const [num, den] = rawAmount.split('/').map(Number);
    amount = den ? num / den : Number(rawAmount);
  } else {
    amount = Number(rawAmount);
  }

  const rawUnit = match[2]?.toLowerCase() ?? 'stueck';
  const unit = UNIT_MAP[rawUnit] ?? rawUnit;
  const name = match[3].trim();

  return { name, amount, unit };
}

/**
 * Detect section boundaries in recipe text.
 * Looks for common German/English headers.
 */
const SECTION_HEADERS = {
  ingredients: /^(zutaten|ingredients?|zutat):?\s*$/i,
  instructions: /^(zubereitung|anleitung|instructions?|steps?|schritte?):?\s*$/i,
  title: /^(name|titel|title|rezept|recipe):?\s*$/i,
  servings: /^(portionen|servings?|ergibt):?\s*$/i,
  time: /^(zeit|time|zubereitungszeit|prep\s*time):?\s*$/i,
};

/**
 * Parse a block of recipe text into a partial Recipe object.
 * Handles various common recipe text formats.
 */
export function parseRecipeText(text: string): Partial<Recipe> {
  if (!text || !text.trim()) return {};

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return {};

  let name = '';
  let description = '';
  const ingredients: Ingredient[] = [];
  const instructions: string[] = [];
  let servings = 0;
  let prepTime = 0;
  let cookTime = 0;

  type Section = 'unknown' | 'title' | 'ingredients' | 'instructions' | 'servings' | 'time';
  let currentSection: Section = 'unknown';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for section headers
    if (SECTION_HEADERS.title.test(line)) {
      currentSection = 'title';
      continue;
    }
    if (SECTION_HEADERS.ingredients.test(line)) {
      currentSection = 'ingredients';
      continue;
    }
    if (SECTION_HEADERS.instructions.test(line)) {
      currentSection = 'instructions';
      continue;
    }
    if (SECTION_HEADERS.servings.test(line)) {
      currentSection = 'servings';
      continue;
    }
    if (SECTION_HEADERS.time.test(line)) {
      currentSection = 'time';
      continue;
    }

    // Process line based on current section
    switch (currentSection) {
      case 'title':
        if (!name) name = line;
        else if (!description) description = line;
        break;

      case 'ingredients': {
        const ingredient = parseIngredientLine(line);
        if (ingredient) ingredients.push(ingredient);
        break;
      }

      case 'instructions': {
        // Strip numbered prefixes like "1." or "1)" or "Step 1:"
        const stripped = line.replace(/^(\d+[.):]?\s*|Schritt\s+\d+:?\s*|Step\s+\d+:?\s*)/i, '').trim();
        if (stripped) instructions.push(stripped);
        break;
      }

      case 'servings': {
        const servingsMatch = line.match(/(\d+)/);
        if (servingsMatch) servings = parseInt(servingsMatch[1], 10);
        break;
      }

      case 'time': {
        const timeMatch = line.match(/(\d+)\s*(min|minuten|minutes?)/i);
        if (timeMatch) {
          if (!prepTime) prepTime = parseInt(timeMatch[1], 10);
          else cookTime = parseInt(timeMatch[1], 10);
        }
        break;
      }

      case 'unknown': {
        // First line is often the title
        if (!name && i === 0) {
          name = line;
          break;
        }
        // Try to parse as ingredient
        const ingredient = parseIngredientLine(line);
        if (ingredient) {
          ingredients.push(ingredient);
          // Switch to ingredients mode once we find one
          if (ingredients.length === 1) currentSection = 'ingredients';
        } else if (line.length > 20) {
          // Longer lines are likely instructions or description
          if (!description) description = line;
          else instructions.push(line);
        }
        break;
      }
    }
  }

  // Build result, only include non-empty fields
  const result: Partial<Recipe> = {};
  if (name) result.name = name;
  if (description) result.description = description;
  if (ingredients.length > 0) result.ingredients = ingredients;
  if (instructions.length > 0) result.instructions = instructions;
  if (servings > 0) result.servings = servings;
  if (prepTime > 0) result.prepTime = prepTime;
  if (cookTime > 0) result.cookTime = cookTime;

  return result;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useRecipeImport() {
  const [importText, setImportText] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<Partial<Recipe> | null>(null);
  const [error, setError] = useState('');

  const parseText = useCallback((text: string) => {
    setImportText(text);
    setError('');

    if (!text.trim()) {
      setParsedRecipe(null);
      return null;
    }

    try {
      const result = parseRecipeText(text);
      if (!result.name && !result.ingredients?.length) {
        setError('Konnte kein Rezept erkennen. Bitte formatiere den Text mit Abschnitten: Zutaten, Zubereitung.');
        setParsedRecipe(null);
        return null;
      }
      setParsedRecipe(result);
      return result;
    } catch {
      setError('Fehler beim Parsen des Textes.');
      setParsedRecipe(null);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setImportText('');
    setParsedRecipe(null);
    setError('');
  }, []);

  return {
    importText,
    setImportText,
    parsedRecipe,
    error,
    parseText,
    reset,
  };
}
