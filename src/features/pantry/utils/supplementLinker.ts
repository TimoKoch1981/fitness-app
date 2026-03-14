/**
 * Supplement ↔ Substance Linker
 *
 * Maps ingredient_catalog items (pantry) to substance presets (medical tracking).
 * Enables bidirectional linking: pantry item → substance tracking, substance → pantry.
 *
 * F15 Nacharbeit Punkt 1: Supplements mit Substanzliste verknuepfen
 */

import { normalizeIngredient, type IngredientCatalogItem } from '../types';
import { SUPPLEMENT_PRESETS, type SubstancePreset } from '../../medical/lib/substancePresets';
import type { Substance } from '../../../types/health';

/**
 * Normalized name mapping: substance preset name → ingredient_catalog name_de.
 * Handles cases where names differ (e.g., "Kreatin Monohydrat" → "Kreatin").
 */
const EXPLICIT_MAPPINGS: Record<string, string[]> = {
  'whey protein': ['whey protein', 'whey isolat'],
  'casein protein': ['casein protein'],
  'eaas': ['eaa'],
  'bcaas': ['bcaa'],
  'glutamin': ['glutamin'],
  'kreatin monohydrat': ['kreatin'],
  'beta-alanin': ['beta-alanin'],
  'l-citrullin': ['l-citrullin'],
  'l-arginin': ['l-arginin'],
  'taurin': ['taurin'],
  'vitamin d3': ['vitamin d3'],
  'zink': ['zink'],
  'magnesium': ['magnesium'],
  'omega-3': ['omega-3'],
  'eisen': ['eisen'],
  'vitamin k2': ['vitamin k2'],
  'vitamin b-komplex': ['vitamin b-komplex'],
  'ashwagandha': ['ashwagandha'],
  'curcumin': ['curcumin'],
  'coq10': ['coq10'],
  'melatonin': ['melatonin'],
  'collagen': ['collagen protein'],
  'l-carnitin': ['l-carnitin'],
  'glucosamin': ['glucosamin'],
  'elektrolyte': ['elektrolyte'],
  'koffein (tabletten)': ['koffein tabletten'],
};

export interface SupplementLink {
  presetName: string;
  catalogItemId: string;
  catalogItemName: string;
}

/**
 * Find ingredient_catalog items that match a substance preset by normalized name.
 */
export function findCatalogItemForPreset(
  preset: SubstancePreset,
  catalog: IngredientCatalogItem[],
): IngredientCatalogItem | undefined {
  const presetNorm = normalizeIngredient(preset.name);

  // 1. Check explicit mappings first
  const mappedNames = EXPLICIT_MAPPINGS[presetNorm];
  if (mappedNames) {
    for (const mappedName of mappedNames) {
      const found = catalog.find(
        (item) => normalizeIngredient(item.name_de) === mappedName
      );
      if (found) return found;
    }
  }

  // 2. Exact normalized match
  const exact = catalog.find(
    (item) => normalizeIngredient(item.name_de) === presetNorm
  );
  if (exact) return exact;

  // 3. Substring match (bidirectional)
  return catalog.find((item) => {
    const itemNorm = normalizeIngredient(item.name_de);
    return (
      (item.category === 'supplements' || item.category === 'proteine_gainer') &&
      (itemNorm.includes(presetNorm) || presetNorm.includes(itemNorm))
    );
  });
}

/**
 * Find substance presets that match a catalog item.
 */
export function findPresetsForCatalogItem(
  catalogItem: IngredientCatalogItem,
): SubstancePreset[] {
  const itemNorm = normalizeIngredient(catalogItem.name_de);

  return SUPPLEMENT_PRESETS.filter((preset) => {
    const presetNorm = normalizeIngredient(preset.name);

    // Explicit mapping
    const mappedNames = EXPLICIT_MAPPINGS[presetNorm];
    if (mappedNames?.includes(itemNorm)) return true;

    // Exact or substring
    return (
      presetNorm === itemNorm ||
      presetNorm.includes(itemNorm) ||
      itemNorm.includes(presetNorm)
    );
  });
}

/**
 * Check if a substance (from user's active substances) matches a catalog item.
 */
export function isSubstanceTracked(
  catalogItemName: string,
  activeSubstances: Substance[],
): boolean {
  const itemNorm = normalizeIngredient(catalogItemName);

  return activeSubstances.some((sub) => {
    if (sub.category !== 'supplement') return false;
    const subNorm = normalizeIngredient(sub.name);
    return (
      subNorm === itemNorm ||
      subNorm.includes(itemNorm) ||
      itemNorm.includes(subNorm)
    );
  });
}

/**
 * Build a full link map between all supplement presets and catalog items.
 */
export function buildSupplementLinkMap(
  catalog: IngredientCatalogItem[],
): Map<string, IngredientCatalogItem> {
  const map = new Map<string, IngredientCatalogItem>();
  for (const preset of SUPPLEMENT_PRESETS) {
    const match = findCatalogItemForPreset(preset, catalog);
    if (match) {
      map.set(normalizeIngredient(preset.name), match);
    }
  }
  return map;
}
