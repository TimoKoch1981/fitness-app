/**
 * AddCustomIngredientDialog — Add custom ingredients to the pantry via free-text search.
 *
 * Search chain:
 * 1. Local ingredient_catalog (instant)
 * 2. Open Food Facts API (1-2s)
 * 3. LLM Web Search fallback
 *
 * Found products are saved to user_products (nutrition tracking) AND user_pantry (pantry).
 * User confirms name, category, and nutrition data before saving.
 *
 * F15 Nacharbeit Punkt 2: Custom-Zutaten per LLM-Freitextsuche einlernen
 */

import { useState, useMemo } from 'react';
import { X, Search, Loader2, Check, Package, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useIngredientCatalog, searchCatalog } from '../hooks/useIngredientCatalog';
import { useAddPantryItems } from '../hooks/usePantry';
import { useAddUserProduct } from '../../meals/hooks/useProducts';
import { CATEGORY_INFO, type IngredientCategory } from '../types';
import { lookupProduct, type ProductLookupResult } from '../../../lib/ai/actions/productLookup';

interface AddCustomIngredientDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FoundProduct {
  name: string;
  brand?: string;
  category: IngredientCategory;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  source: 'catalog' | 'openfoodfacts' | 'websearch';
  catalogId?: string;
}

const CATEGORY_OPTIONS: IngredientCategory[] = [
  'proteine_gainer', 'supplements', 'fleisch_fisch', 'milchprodukte',
  'gemuese', 'obst', 'getreide_nudeln', 'huelsenfruechte',
  'nuesse', 'oele_fette', 'getraenke', 'konserven',
  'tiefkuehl', 'brot_aufstriche', 'backzutaten', 'gewuerze', 'sonstiges',
];

/**
 * Map Open Food Facts categories or product types to our IngredientCategory.
 */
function guessCategory(name: string, brand?: string): IngredientCategory {
  const lower = (name + ' ' + (brand || '')).toLowerCase();

  if (/protein|whey|casein|gainer|eaa|bcaa|isolat/i.test(lower)) return 'proteine_gainer';
  if (/kreatin|creatine|vitamin|magnesium|zink|omega|supplement|ashwagandha|curcumin/i.test(lower)) return 'supplements';
  if (/milch|joghurt|quark|kaese|cheese|yogurt|skyr|butter/i.test(lower)) return 'milchprodukte';
  if (/huhn|chicken|rind|beef|lachs|salmon|thunfisch|tuna|fisch|fish|fleisch|meat|pute|turkey/i.test(lower)) return 'fleisch_fisch';
  if (/reis|pasta|nudel|brot|bread|hafer|oat|muesi|cereal/i.test(lower)) return 'getreide_nudeln';
  if (/apfel|banana|beere|berry|orange|obst|fruit/i.test(lower)) return 'obst';
  if (/brokkoli|spinat|tomate|karotte|gemuese|vegetable/i.test(lower)) return 'gemuese';
  if (/nuss|nut|mandel|almond|erdnuss|peanut/i.test(lower)) return 'nuesse';
  if (/oel|oil|olivenoel|kokosoel|butter/i.test(lower)) return 'oele_fette';
  if (/saft|juice|cola|wasser|water|drink|energy/i.test(lower)) return 'getraenke';

  return 'sonstiges';
}

export function AddCustomIngredientDialog({ open, onClose }: AddCustomIngredientDialogProps) {
  const { language } = useTranslation();
  const t = language === 'de' ? DE : EN;

  const { data: catalog } = useIngredientCatalog();
  const addPantryItems = useAddPantryItems();
  const addUserProduct = useAddUserProduct();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoundProduct[]>([]);
  const [selected, setSelected] = useState<FoundProduct | null>(null);
  const [editCategory, setEditCategory] = useState<IngredientCategory>('sonstiges');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  // Search catalog locally first
  const catalogResults = useMemo(() => {
    if (!catalog || query.length < 2) return [];
    return searchCatalog(catalog, query).slice(0, 5);
  }, [catalog, query]);

  const handleSearch = async () => {
    if (query.length < 2) return;
    setSearching(true);
    setError('');
    setResults([]);
    setSelected(null);

    try {
      // 1. Local catalog matches
      const localResults: FoundProduct[] = catalogResults.map((item) => ({
        name: item.name_de,
        category: item.category as IngredientCategory,
        calories_per_100g: item.calories_per_100g ?? 0,
        protein_per_100g: item.protein_per_100g ?? 0,
        carbs_per_100g: item.carbs_per_100g ?? 0,
        fat_per_100g: item.fat_per_100g ?? 0,
        fiber_per_100g: item.fiber_per_100g ?? 0,
        source: 'catalog' as const,
        catalogId: item.id,
      }));

      // 2. Open Food Facts + LLM fallback
      let externalResults: FoundProduct[] = [];
      try {
        const lookupResult: ProductLookupResult = await lookupProduct(query);
        if (lookupResult.found && lookupResult.product) {
          const p = lookupResult.product;
          externalResults = [{
            name: p.brand ? `${p.name} (${p.brand})` : p.name,
            brand: p.brand,
            category: guessCategory(p.name, p.brand),
            calories_per_100g: p.calories_per_100g ?? 0,
            protein_per_100g: p.protein_per_100g ?? 0,
            carbs_per_100g: p.carbs_per_100g ?? 0,
            fat_per_100g: p.fat_per_100g ?? 0,
            fiber_per_100g: p.fiber_per_100g ?? 0,
            source: lookupResult.source === 'openfoodfacts' ? 'openfoodfacts' : 'websearch',
          }];
        }
      } catch (err) {
        console.warn('[AddCustomIngredient] External lookup failed:', err);
      }

      const allResults = [...localResults, ...externalResults];
      setResults(allResults);

      // Auto-select if only one result
      if (allResults.length === 1) {
        selectResult(allResults[0]);
      }
    } catch (err) {
      console.error('[AddCustomIngredient] Search failed:', err);
      setError(t.searchError);
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (result: FoundProduct) => {
    setSelected(result);
    setEditName(result.name);
    setEditCategory(result.category);
  };

  const handleSave = async () => {
    if (!selected || !editName) return;
    setSaving(true);
    setError('');

    try {
      // 1. Add to pantry
      await addPantryItems.mutateAsync([{
        ingredient_name: editName,
        category: editCategory,
        buy_preference: 'sometimes',
        ingredient_id: selected.catalogId,
      }]);

      // 2. Also save as user_product (for nutrition tracking) if it has nutrition data
      if (selected.source !== 'catalog' && selected.calories_per_100g > 0) {
        try {
          const servingSize = 100; // Default 100g serving
          await addUserProduct.mutateAsync({
            name: editName,
            brand: selected.brand,
            category: editCategory === 'proteine_gainer' ? 'supplement'
              : editCategory === 'supplements' ? 'supplement'
              : editCategory === 'fleisch_fisch' ? 'meat'
              : editCategory === 'milchprodukte' ? 'dairy'
              : editCategory === 'gemuese' ? 'vegetable'
              : editCategory === 'obst' ? 'fruit'
              : editCategory === 'getraenke' ? 'beverage'
              : editCategory === 'getreide_nudeln' ? 'grain'
              : editCategory === 'nuesse' ? 'snack'
              : 'general',
            serving_size_g: servingSize,
            serving_label: '100g',
            calories_per_serving: selected.calories_per_100g,
            protein_per_serving: selected.protein_per_100g,
            carbs_per_serving: selected.carbs_per_100g,
            fat_per_serving: selected.fat_per_100g,
            fiber_per_serving: selected.fiber_per_100g,
            source: selected.source === 'openfoodfacts' ? 'open-food-facts' : 'ai',
          });
        } catch {
          // Non-critical: pantry was saved, product save failed
          console.warn('[AddCustomIngredient] user_product save failed (non-critical)');
        }
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setQuery('');
        setResults([]);
        setSelected(null);
        onClose();
      }, 1200);
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b z-10">
          <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || query.length < 2}
              className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : t.search}
            </button>
          </div>

          <p className="text-[10px] text-gray-400">{t.searchHint}</p>

          {/* Results */}
          {results.length > 0 && !selected && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">{t.resultsTitle} ({results.length})</p>
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => selectResult(result)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{result.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      result.source === 'catalog'
                        ? 'bg-teal-100 text-teal-700'
                        : result.source === 'openfoodfacts'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {result.source === 'catalog' ? t.fromCatalog
                        : result.source === 'openfoodfacts' ? 'Open Food Facts'
                        : t.fromWeb}
                    </span>
                  </div>
                  {result.calories_per_100g > 0 && (
                    <p className="text-[10px] text-gray-500">
                      {result.calories_per_100g} kcal | {result.protein_per_100g}g P | {result.carbs_per_100g}g C | {result.fat_per_100g}g F
                      <span className="text-gray-400"> /100g</span>
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {results.length === 0 && !searching && query.length >= 2 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">{t.noResults}</p>
              <p className="text-xs text-gray-400 mt-1">{t.noResultsHint}</p>
            </div>
          )}

          {/* Selected — Edit & Confirm */}
          {selected && (
            <div className="space-y-3 border border-teal-200 bg-teal-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-teal-500" />
                <p className="text-sm font-medium text-gray-800">{t.confirmTitle}</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.name}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.category}</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditCategory(cat)}
                      className={`py-1 px-2 rounded-lg text-[11px] font-medium transition-colors ${
                        editCategory === cat
                          ? 'bg-teal-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
                      }`}
                    >
                      {CATEGORY_INFO[cat]?.icon} {language === 'de' ? CATEGORY_INFO[cat]?.labelDe : CATEGORY_INFO[cat]?.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nutrition Preview */}
              {selected.calories_per_100g > 0 && (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white rounded-lg py-1.5">
                    <p className="text-xs font-bold text-gray-900">{selected.calories_per_100g}</p>
                    <p className="text-[9px] text-gray-500">kcal</p>
                  </div>
                  <div className="bg-white rounded-lg py-1.5">
                    <p className="text-xs font-bold text-teal-700">{selected.protein_per_100g}g</p>
                    <p className="text-[9px] text-teal-600">Protein</p>
                  </div>
                  <div className="bg-white rounded-lg py-1.5">
                    <p className="text-xs font-bold text-blue-700">{selected.carbs_per_100g}g</p>
                    <p className="text-[9px] text-blue-600">Carbs</p>
                  </div>
                  <div className="bg-white rounded-lg py-1.5">
                    <p className="text-xs font-bold text-amber-700">{selected.fat_per_100g}g</p>
                    <p className="text-[9px] text-amber-600">{language === 'de' ? 'Fett' : 'Fat'}</p>
                  </div>
                </div>
              )}

              {/* Source note */}
              <p className="text-[10px] text-gray-400">
                {selected.source === 'catalog' ? t.sourceCatalog
                  : selected.source === 'openfoodfacts' ? t.sourceOFF
                  : t.sourceWeb}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {t.back}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || saved || !editName}
                  className="flex-1 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {saved ? (
                    <><Check className="h-4 w-4" /> {t.saved}</>
                  ) : saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>{t.save}</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── i18n ──────────────────────────────────────────────────────────────

const DE = {
  title: 'Zutat hinzufuegen',
  searchPlaceholder: 'z.B. "Optimum Nutrition Whey Gold" oder "Brokkoli"...',
  search: 'Suchen',
  searchHint: 'Durchsucht unseren Katalog, Open Food Facts und das Web nach Naehrwertdaten.',
  resultsTitle: 'Ergebnisse',
  fromCatalog: 'Katalog',
  fromWeb: 'Web-Recherche',
  noResults: 'Keine Ergebnisse gefunden.',
  noResultsHint: 'Versuche es mit einem anderen Suchbegriff oder Markennamen.',
  confirmTitle: 'Zutat bestaetigen',
  name: 'Name',
  category: 'Kategorie',
  back: 'Zurueck',
  save: 'Zum Vorrat hinzufuegen',
  saved: 'Hinzugefuegt!',
  saveError: 'Fehler beim Speichern. Bitte versuche es erneut.',
  searchError: 'Suche fehlgeschlagen. Bitte versuche es erneut.',
  sourceCatalog: 'Aus dem FitBuddy-Zutatenkatalog',
  sourceOFF: 'Naehrwerte von Open Food Facts (Community-Daten)',
  sourceWeb: 'Naehrwerte via KI-Webrecherche (geprueft)',
};

const EN = {
  title: 'Add Ingredient',
  searchPlaceholder: 'e.g. "Optimum Nutrition Whey Gold" or "Broccoli"...',
  search: 'Search',
  searchHint: 'Searches our catalog, Open Food Facts, and the web for nutrition data.',
  resultsTitle: 'Results',
  fromCatalog: 'Catalog',
  fromWeb: 'Web Search',
  noResults: 'No results found.',
  noResultsHint: 'Try a different search term or brand name.',
  confirmTitle: 'Confirm Ingredient',
  name: 'Name',
  category: 'Category',
  back: 'Back',
  save: 'Add to Pantry',
  saved: 'Added!',
  saveError: 'Save failed. Please try again.',
  searchError: 'Search failed. Please try again.',
  sourceCatalog: 'From the FitBuddy ingredient catalog',
  sourceOFF: 'Nutrition data from Open Food Facts (community data)',
  sourceWeb: 'Nutrition data via AI web search (verified)',
};
