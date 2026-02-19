/**
 * Product Lookup — search logic for matching food items in the product database.
 *
 * Priority order:
 * 1. Exact alias match in user products (highest priority)
 * 2. Name match in user products (partial, case-insensitive)
 * 3. Exact name match in standard products
 * 4. Fuzzy name match in standard products
 * 5. null → LLM estimates (fallback)
 *
 * Also provides nutrition calculation helpers for serving-based math.
 */

import type { ProductNutrition, UserProduct } from '../types/health';

// ── Product Lookup ──────────────────────────────────────────────────────

export interface ProductMatch {
  product: ProductNutrition;
  matchType: 'alias' | 'user_name' | 'standard_exact' | 'standard_fuzzy';
  isUserProduct: boolean;
}

/**
 * Find the best matching product for a given query string.
 * Returns null if no match found (agent should fall back to LLM estimation).
 */
export function findProduct(
  query: string,
  userProducts: UserProduct[],
  standardProducts: ProductNutrition[],
): ProductMatch | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // 1. Exact alias match in user products (highest priority)
  for (const p of userProducts) {
    if (p.aliases.some(a => a.toLowerCase() === q)) {
      return { product: p, matchType: 'alias', isUserProduct: true };
    }
  }

  // 2. Name match in user products (partial, case-insensitive)
  for (const p of userProducts) {
    const name = p.name.toLowerCase();
    if (name === q || name.includes(q) || q.includes(name)) {
      return { product: p, matchType: 'user_name', isUserProduct: true };
    }
  }

  // 3. Exact name match in standard products
  for (const p of standardProducts) {
    if (p.name.toLowerCase() === q) {
      return { product: p, matchType: 'standard_exact', isUserProduct: false };
    }
  }

  // 4. Fuzzy match in standard products (partial name match)
  for (const p of standardProducts) {
    const name = p.name.toLowerCase();
    if (name.includes(q) || q.includes(name)) {
      return { product: p, matchType: 'standard_fuzzy', isUserProduct: false };
    }
  }

  return null; // Not found → LLM estimates
}

/**
 * Search products by query and return all matches (for autocomplete / display).
 * Sorted by relevance: user products first, then standard products.
 */
export function searchProducts(
  query: string,
  userProducts: UserProduct[],
  standardProducts: ProductNutrition[],
  limit: number = 10,
): ProductMatch[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const matches: ProductMatch[] = [];

  // User product alias matches
  for (const p of userProducts) {
    if (p.aliases.some(a => a.toLowerCase().includes(q))) {
      matches.push({ product: p, matchType: 'alias', isUserProduct: true });
    }
  }

  // User product name matches (avoid duplicates)
  for (const p of userProducts) {
    if (matches.some(m => m.product.id === p.id)) continue;
    const name = p.name.toLowerCase();
    if (name.includes(q) || q.includes(name)) {
      matches.push({ product: p, matchType: 'user_name', isUserProduct: true });
    }
  }

  // Standard product matches
  for (const p of standardProducts) {
    const name = p.name.toLowerCase();
    if (name.includes(q) || q.includes(name)) {
      const matchType = name === q ? 'standard_exact' : 'standard_fuzzy';
      matches.push({ product: p, matchType, isUserProduct: false } as ProductMatch);
    }
  }

  return matches.slice(0, limit);
}

// ── Nutrition Calculation ───────────────────────────────────────────────

export interface CalculatedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

/**
 * Calculate nutrition for a given number of servings.
 * Example: product has 30g serving → 1.5 servings = 45g worth of macros.
 */
export function calculateNutrition(
  product: ProductNutrition,
  servings: number,
): CalculatedNutrition {
  return {
    calories: Math.round(product.calories_per_serving * servings),
    protein: Math.round(product.protein_per_serving * servings * 10) / 10,
    carbs: Math.round(product.carbs_per_serving * servings * 10) / 10,
    fat: Math.round(product.fat_per_serving * servings * 10) / 10,
    fiber: product.fiber_per_serving != null
      ? Math.round(product.fiber_per_serving * servings * 10) / 10
      : undefined,
  };
}

/**
 * Calculate nutrition for a given weight in grams.
 * Converts grams to servings, then calculates.
 */
export function calculateNutritionByGrams(
  product: ProductNutrition,
  grams: number,
): CalculatedNutrition {
  const servings = grams / product.serving_size_g;
  return calculateNutrition(product, servings);
}

/**
 * Format product nutrition for display in chat.
 * Example: "Skyr natur — 100g — 63 kcal | 10.6g P | 3.7g C | 0.2g F (exakt)"
 */
export function formatProductNutrition(
  product: ProductNutrition,
  nutrition: CalculatedNutrition,
  grams?: number,
): string {
  const amount = grams ? `${grams}g` : product.serving_label ?? `${product.serving_size_g}g`;
  return `${product.name} — ${amount} — ${nutrition.calories} kcal | ${nutrition.protein}g P | ${nutrition.carbs}g C | ${nutrition.fat}g F`;
}

/**
 * Build a compact product list for LLM context injection.
 * Format: "name (aliases) — Xg — X kcal | Xg P | Xg C | Xg F"
 */
export function buildProductContextForAgent(
  userProducts: UserProduct[],
  standardProducts: ProductNutrition[],
): string {
  const lines: string[] = [];

  if (userProducts.length > 0) {
    lines.push('## BEKANNTE USER-PRODUKTE');
    // Sort by use_count descending (most used first)
    const sorted = [...userProducts].sort((a, b) => b.use_count - a.use_count);
    for (const p of sorted) {
      let line = `- ${p.name}`;
      if (p.aliases.length > 0) line += ` (${p.aliases.join(', ')})`;
      line += ` — ${p.serving_label ?? p.serving_size_g + 'g'}`;
      line += ` — ${p.calories_per_serving} kcal | ${p.protein_per_serving}g P | ${p.carbs_per_serving}g C | ${p.fat_per_serving}g F`;
      lines.push(line);
    }
  }

  if (standardProducts.length > 0) {
    lines.push('\n## STANDARD-PRODUKTE (Nährwerte pro Portion)');
    for (const p of standardProducts) {
      let line = `- ${p.name}`;
      line += ` — ${p.serving_label ?? p.serving_size_g + 'g'}`;
      line += ` — ${p.calories_per_serving} kcal | ${p.protein_per_serving}g P | ${p.carbs_per_serving}g C | ${p.fat_per_serving}g F`;
      lines.push(line);
    }
  }

  return lines.join('\n');
}
