/**
 * Tests for recipe text parsing (useRecipeImport).
 * Tests the pure parseRecipeText and parseIngredientLine functions.
 */

import { describe, it, expect } from 'vitest';
import { parseRecipeText, parseIngredientLine } from '../useRecipeImport';

// ── parseIngredientLine tests ───────────────────────────────────────────

describe('parseIngredientLine', () => {
  it('parses standard ingredient with grams', () => {
    const result = parseIngredientLine('200g Haehnchenbrust');
    expect(result).toEqual({ name: 'Haehnchenbrust', amount: 200, unit: 'g' });
  });

  it('parses ingredient with EL unit', () => {
    const result = parseIngredientLine('2 EL Olivenoel');
    expect(result).toEqual({ name: 'Olivenoel', amount: 2, unit: 'EL' });
  });

  it('parses ingredient with Stueck', () => {
    const result = parseIngredientLine('3 Stueck Eier');
    expect(result).toEqual({ name: 'Eier', amount: 3, unit: 'Stueck' });
  });

  it('parses fractional amounts', () => {
    const result = parseIngredientLine('1/2 TL Salz');
    expect(result).toEqual({ name: 'Salz', amount: 0.5, unit: 'TL' });
  });

  it('returns null for empty input', () => {
    expect(parseIngredientLine('')).toBeNull();
    expect(parseIngredientLine('   ')).toBeNull();
  });

  it('handles ingredient with leading dash', () => {
    const result = parseIngredientLine('- 100g Mehl');
    expect(result).toEqual({ name: 'Mehl', amount: 100, unit: 'g' });
  });

  it('falls back to name-only for unstructured text', () => {
    const result = parseIngredientLine('Salz und Pfeffer');
    expect(result).toEqual({ name: 'Salz und Pfeffer', amount: 1, unit: 'Stueck' });
  });

  it('returns null for very long lines', () => {
    const longLine = 'A'.repeat(101);
    expect(parseIngredientLine(longLine)).toBeNull();
  });
});

// ── parseRecipeText tests ───────────────────────────────────────────────

describe('parseRecipeText', () => {
  it('returns empty object for empty input', () => {
    expect(parseRecipeText('')).toEqual({});
    expect(parseRecipeText('   ')).toEqual({});
  });

  it('parses a structured recipe with section headers', () => {
    const text = `Haehnchen-Reis Bowl

Zutaten:
200g Haehnchenbrust
150g Reis
1 EL Olivenoel

Zubereitung:
Reis kochen
Haehnchenstreifen braten
Alles anrichten`;

    const result = parseRecipeText(text);
    expect(result.name).toBe('Haehnchen-Reis Bowl');
    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients![0].name).toBe('Haehnchenbrust');
    expect(result.ingredients![1].amount).toBe(150);
    expect(result.instructions).toHaveLength(3);
    expect(result.instructions![0]).toBe('Reis kochen');
  });

  it('parses recipe with numbered steps', () => {
    const text = `Protein Pancakes

Zutaten:
80g Haferflocken
2 Stueck Eier

Zubereitung:
1. Haferflocken mahlen
2. Alle Zutaten verruehren
3. In der Pfanne backen`;

    const result = parseRecipeText(text);
    expect(result.instructions).toHaveLength(3);
    expect(result.instructions![0]).toBe('Haferflocken mahlen');
    expect(result.instructions![2]).toBe('In der Pfanne backen');
  });

  it('parses recipe with Portionen header', () => {
    const text = `Salat

Portionen:
4

Zutaten:
200g Feta`;

    const result = parseRecipeText(text);
    expect(result.servings).toBe(4);
  });

  it('parses recipe with time information', () => {
    const text = `Schneller Wrap

Zeit:
10 min Vorbereitung
5 min Zusammenbau

Zutaten:
1 Stueck Tortilla`;

    const result = parseRecipeText(text);
    expect(result.prepTime).toBe(10);
    expect(result.cookTime).toBe(5);
  });

  it('handles single line input as title', () => {
    const result = parseRecipeText('Mein Lieblings-Rezept');
    expect(result.name).toBe('Mein Lieblings-Rezept');
  });

  it('handles malformed text gracefully', () => {
    const text = `Some random text
more random text
nothing useful here`;
    const result = parseRecipeText(text);
    // Should at least get a name from first line
    expect(result.name).toBe('Some random text');
  });

  it('handles recipe with English section headers', () => {
    const text = `Quick Bowl

Ingredients:
200g chicken
100g rice

Instructions:
Cook rice
Grill chicken`;

    const result = parseRecipeText(text);
    expect(result.name).toBe('Quick Bowl');
    expect(result.ingredients).toHaveLength(2);
    expect(result.instructions).toHaveLength(2);
  });
});
