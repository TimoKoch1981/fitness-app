/**
 * PantryTabContent — Main pantry management view.
 *
 * Shows the user's current pantry items grouped by category.
 * Allows quick status changes, search, category clear, global clear,
 * and opening the setup wizard.
 */

import { useState, useMemo, useCallback } from 'react';
import { Package, Search, ChevronDown, ChevronUp, AlertTriangle, Trash2, Activity, Plus, ShieldAlert, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import { usePantry, useUpdatePantryItem, useRemovePantryItem, useClearPantry } from '../hooks/usePantry';
import { useSubstances } from '../../medical/hooks/useSubstances';
import { isSubstanceTracked } from '../utils/supplementLinker';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { CATEGORY_INFO, type IngredientCategory, type PantryItem, type PantryStatus } from '../types';
import { PantrySetupWizard } from './PantrySetupWizard';
import { AddCustomIngredientDialog } from './AddCustomIngredientDialog';
import { useProfile } from '../../auth/hooks/useProfile';
import { detectAllergens, profileAllergensToRecipeAllergens } from '../../recipes/types';
import { useIngredientCatalog } from '../hooks/useIngredientCatalog';
import { useAddPantryItems } from '../hooks/usePantry';

export function PantryTabContent() {
  const { language } = useTranslation();
  const t = language === 'de' ? DE : EN;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pantryItems, isLoading } = usePantry();
  const updateItem = useUpdatePantryItem();
  const removeItem = useRemovePantryItem();
  const clearPantry = useClearPantry();
  const { data: activeSubstances } = useSubstances();
  const { data: profile } = useProfile();
  const { data: catalog } = useIngredientCatalog();
  const addPantryItems = useAddPantryItems();

  // Detect pantry items that conflict with user's allergen profile
  const allergenWarnings = useMemo(() => {
    if (!pantryItems || !profile?.allergies?.length) return [];
    const userAllergens = profileAllergensToRecipeAllergens(profile.allergies);
    if (userAllergens.length === 0) return [];

    const warnings: { item: PantryItem; allergens: string[] }[] = [];
    for (const item of pantryItems) {
      const detected = detectAllergens([{ name: item.ingredient_name, amount: 0, unit: '' }]);
      const conflicts = detected.filter(a => userAllergens.includes(a));
      if (conflicts.length > 0) {
        warnings.push({ item, allergens: conflicts });
      }
    }
    return warnings;
  }, [pantryItems, profile?.allergies]);

  const [showWizard, setShowWizard] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<IngredientCategory>>(new Set());
  const [confirmClear, setConfirmClear] = useState<'all' | IngredientCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<IngredientCategory | null>(null);

  // Group by category
  const grouped = useMemo(() => {
    if (!pantryItems) return new Map<IngredientCategory, PantryItem[]>();
    const map = new Map<IngredientCategory, PantryItem[]>();
    const q = searchQuery.toLowerCase();

    for (const item of pantryItems) {
      if (q && !item.ingredient_name.toLowerCase().includes(q)) continue;
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [pantryItems, searchQuery]);

  // Expiring soon (3 days)
  const expiringSoon = useMemo(() => {
    if (!pantryItems) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 3);
    return pantryItems.filter(
      (item) => item.expires_at && new Date(item.expires_at) <= cutoff
    );
  }, [pantryItems]);

  // Show ALL categories (including empty ones) so users can always see them
  const allCategories = Object.keys(CATEGORY_INFO) as IngredientCategory[];
  const sortedCategories: [IngredientCategory, PantryItem[]][] = allCategories
    .map((cat) => [cat, grouped.get(cat) ?? []] as [IngredientCategory, PantryItem[]])
    .sort((a, b) => (CATEGORY_INFO[a[0]]?.sortOrder ?? 99) - (CATEGORY_INFO[b[0]]?.sortOrder ?? 99))
    // When searching, only show categories with matches
    .filter(([_, items]) => !searchQuery || items.length > 0);

  const toggleExpanded = (cat: IngredientCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleStatusChange = (id: string, status: PantryStatus) => {
    updateItem.mutate({ id, status });
  };

  const handleRemove = (id: string) => {
    removeItem.mutate(id);
  };

  // Clear entire pantry
  const handleClearAll = useCallback(async () => {
    setConfirmClear(null);
    clearPantry.mutate(undefined);
  }, [clearPantry]);

  // Clear all items in a specific category (delete rows, category itself stays)
  const handleClearCategory = useCallback(async (cat: IngredientCategory) => {
    setConfirmClear(null);
    if (!user) return;
    const items = grouped.get(cat);
    if (!items || items.length === 0) return;

    const ids = items.map((i) => i.id);
    const { error } = await supabase
      .from('user_pantry')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('[PantryTabContent] Clear category failed:', error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['user-pantry'] });
      queryClient.invalidateQueries({ queryKey: ['user-pantry-all'] });
    }
  }, [user, grouped, queryClient]);

  const handleConfirmAction = useCallback(() => {
    if (confirmClear === 'all') {
      handleClearAll();
    } else if (confirmClear) {
      handleClearCategory(confirmClear);
    }
  }, [confirmClear, handleClearAll, handleClearCategory]);

  // Get catalog items for a category that aren't already in pantry
  const getCatalogItemsForCategory = useCallback((cat: IngredientCategory) => {
    if (!catalog) return [];
    const existingNames = new Set(
      (pantryItems ?? []).map((i) => i.ingredient_name.toLowerCase())
    );
    return catalog
      .filter((item) => item.category === cat && !existingNames.has(item.name_de.toLowerCase()))
      .slice(0, 20); // Limit to 20
  }, [catalog, pantryItems]);

  const handleQuickAdd = useCallback(async (name: string, cat: IngredientCategory, catalogId?: string) => {
    await addPantryItems.mutateAsync([{
      ingredient_name: name,
      category: cat,
      buy_preference: 'sometimes',
      ingredient_id: catalogId,
    }]);
  }, [addPantryItems]);

  // Get ALL catalog items for a category (for edit mode checklist)
  const getAllCatalogItemsForCategory = useCallback((cat: IngredientCategory) => {
    if (!catalog) return [];
    return catalog.filter((item) => item.category === cat);
  }, [catalog]);

  // Check if a catalog item is in pantry (by normalized name)
  const pantryNormalizedNames = useMemo(() => {
    if (!pantryItems) return new Set<string>();
    return new Set(pantryItems.map((i) => i.ingredient_normalized));
  }, [pantryItems]);

  // Toggle a catalog item in/out of pantry
  const handleToggleCatalogItem = useCallback(async (catalogItem: { id: string; name_de: string; category: IngredientCategory; is_staple: boolean; storage_type: string }, isInPantry: boolean) => {
    if (isInPantry) {
      // Remove from pantry — find by normalized name
      const normalized = catalogItem.name_de.toLowerCase().trim()
        .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss').replace(/\s+/g, ' ');
      const item = pantryItems?.find((p) => p.ingredient_normalized === normalized);
      if (item) {
        removeItem.mutate(item.id);
      }
    } else {
      // Add to pantry
      await addPantryItems.mutateAsync([{
        ingredient_name: catalogItem.name_de,
        category: catalogItem.category,
        buy_preference: catalogItem.is_staple ? 'always' : 'sometimes',
        ingredient_id: catalogItem.id,
      }]);
    }
  }, [pantryItems, removeItem, addPantryItems]);

  // Empty state
  if (!isLoading && (!pantryItems || pantryItems.length === 0)) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">{t.emptyTitle}</h3>
        <p className="text-sm text-gray-500 mb-6">{t.emptyDesc}</p>
        <button
          onClick={() => setShowWizard(true)}
          className="px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
        >
          {t.setupButton}
        </button>
        <PantrySetupWizard
          open={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddCustom(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-white bg-teal-500 rounded-lg hover:bg-teal-600 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          {language === 'de' ? 'Zutat hinzufuegen' : 'Add Ingredient'}
        </button>
        <button
          onClick={() => setShowWizard(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          {language === 'de' ? 'Vorrat einrichten' : 'Setup Pantry'}
        </button>
        <button
          onClick={() => setConfirmClear('all')}
          className="flex items-center justify-center gap-1 px-3 py-2.5 text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
          title={t.clearAll}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <div className="flex-1 bg-teal-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-teal-700">{pantryItems?.length ?? 0}</p>
          <p className="text-xs text-teal-600">{t.totalItems}</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-gray-700">{grouped.size}</p>
          <p className="text-xs text-gray-500">{t.categories}</p>
        </div>
        {expiringSoon.length > 0 && (
          <div className="flex-1 bg-amber-50 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-amber-700">{expiringSoon.length}</p>
            <p className="text-xs text-amber-600">{t.expiringSoon}</p>
          </div>
        )}
      </div>

      {/* Expiring Warning */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">{t.expiringWarning}</p>
            <p className="text-xs text-amber-600">
              {expiringSoon.map((i) => i.ingredient_name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Allergen Warnings — actionable */}
      {allergenWarnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-red-800">{t.allergenWarning}</p>
          </div>
          <div className="space-y-1 ml-6">
            {allergenWarnings.map((w) => (
              <div key={w.item.id} className="flex items-center justify-between gap-2">
                <span className="text-xs text-red-600">{w.item.ingredient_name}</span>
                <button
                  onClick={() => handleRemove(w.item.id)}
                  className="text-[10px] text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-100 transition-colors flex items-center gap-0.5"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  {language === 'de' ? 'Entfernen' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
          {allergenWarnings.length > 1 && (
            <button
              onClick={() => {
                allergenWarnings.forEach((w) => handleRemove(w.item.id));
              }}
              className="mt-2 ml-6 text-[10px] text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              {language === 'de' ? 'Alle unvertraeglichen entfernen' : 'Remove all conflicting'}
            </button>
          )}
        </div>
      )}

      {/* Category Sections */}
      {sortedCategories.map(([cat, items]) => {
        const info = CATEGORY_INFO[cat];
        const expanded = expandedCategories.has(cat);
        const isEmpty = items.length === 0;

        return (
          <div key={cat} className={cn('border rounded-lg overflow-hidden', isEmpty ? 'border-gray-50' : 'border-gray-100')}>
            <button
              onClick={() => toggleExpanded(cat)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 text-left',
                isEmpty ? 'bg-gray-50/50 hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <span className={cn('text-base', isEmpty && 'opacity-40')}>{info.icon}</span>
              <span className={cn('flex-1 text-sm font-medium', isEmpty ? 'text-gray-400' : 'text-gray-800')}>
                {language === 'de' ? info.labelDe : info.labelEn}
              </span>
              {isEmpty ? (
                <span className="text-[10px] text-gray-300 italic">{language === 'de' ? 'Leer' : 'Empty'}</span>
              ) : (
                <span className="text-xs text-gray-500">{items.length}</span>
              )}
              {/* Edit category button (opens catalog checklist) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCategory(editingCategory === cat ? null : cat);
                  if (!expandedCategories.has(cat)) toggleExpanded(cat);
                }}
                className={cn(
                  'p-1 transition-colors',
                  editingCategory === cat ? 'text-teal-500' : 'text-gray-300 hover:text-teal-500'
                )}
                title={language === 'de' ? 'Kategorie bearbeiten' : 'Edit category'}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {/* Clear category button */}
              {!isEmpty && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmClear(cat);
                  }}
                  className="p-1 text-gray-300 hover:text-red-500"
                  title={t.clearCategory}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {expanded && editingCategory === cat && (
              /* ── EDIT MODE: Full catalog checklist ── */
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-teal-600 uppercase tracking-wider">
                    {language === 'de' ? 'Bearbeitungsmodus' : 'Edit Mode'}
                  </p>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                  >
                    <X className="h-3 w-3" />
                    {language === 'de' ? 'Fertig' : 'Done'}
                  </button>
                </div>
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {getAllCatalogItemsForCategory(cat).map((catalogItem) => {
                    const normalized = catalogItem.name_de.toLowerCase().trim()
                      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss').replace(/\s+/g, ' ');
                    const isInPantry = pantryNormalizedNames.has(normalized);
                    return (
                      <button
                        key={catalogItem.id}
                        onClick={() => handleToggleCatalogItem(catalogItem, isInPantry)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors',
                          isInPantry ? 'bg-teal-50 hover:bg-teal-100' : 'hover:bg-gray-50'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                          isInPantry ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                        )}>
                          {isInPantry && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className={cn(
                          'flex-1 text-sm',
                          isInPantry ? 'text-teal-800 font-medium' : 'text-gray-600'
                        )}>
                          {catalogItem.name_de}
                        </span>
                        {catalogItem.is_staple && (
                          <span className="text-[9px] text-gray-400">{language === 'de' ? 'Basis' : 'Staple'}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-gray-400 mt-2">
                  {language === 'de'
                    ? 'Tippe auf eine Zutat um sie hinzuzufuegen oder zu entfernen'
                    : 'Tap an ingredient to add or remove it'}
                </p>
              </div>
            )}

            {expanded && editingCategory !== cat && (
              <div className="px-3 py-2 space-y-1.5">
                {/* Existing pantry items */}
                {items.map((item) => {
                  const isTracked = (cat === 'supplements' || cat === 'proteine_gainer') &&
                    activeSubstances &&
                    isSubstanceTracked(item.ingredient_name, activeSubstances);

                  return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    <span className="flex-1 text-sm text-gray-700">
                      {item.ingredient_name}
                      {isTracked && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-[9px] text-indigo-600 font-medium">
                          <Activity className="h-2.5 w-2.5" />
                          {language === 'de' ? 'Tracking' : 'Tracked'}
                        </span>
                      )}
                    </span>

                    {/* Status chips */}
                    <div className="flex gap-1">
                      {(['available', 'low', 'empty'] as PantryStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(item.id, st)}
                          className={cn(
                            'px-2 py-0.5 text-[10px] rounded-full border transition-colors',
                            item.status === st
                              ? st === 'available'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : st === 'low'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                          )}
                        >
                          {st === 'available' ? '✓' : st === 'low' ? '↓' : '✕'}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1 text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  );
                })}

                {/* Catalog items available to add */}
                {(() => {
                  const available = getCatalogItemsForCategory(cat);
                  if (available.length === 0) return null;
                  return (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400 mb-1.5">
                        {language === 'de' ? 'Aus Katalog hinzufuegen:' : 'Add from catalog:'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {available.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleQuickAdd(item.name_de, cat, item.id)}
                            className="px-2 py-0.5 text-[10px] text-teal-600 bg-teal-50 border border-teal-100 rounded-full hover:bg-teal-100 transition-colors"
                          >
                            + {item.name_de}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}

      {/* Confirm Clear Dialog */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmClear(null)} />
          <div className="relative bg-white rounded-xl p-5 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmClear === 'all' ? t.confirmClearAllTitle : t.confirmClearCategoryTitle}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {confirmClear === 'all'
                ? t.confirmClearAllDesc
                : t.confirmClearCategoryDesc.replace(
                    '{category}',
                    language === 'de'
                      ? CATEGORY_INFO[confirmClear]?.labelDe ?? confirmClear
                      : CATEGORY_INFO[confirmClear]?.labelEn ?? confirmClear
                  )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmClear(null)}
                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                {confirmClear === 'all' ? t.clearAll : t.clearCategory}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard */}
      <PantrySetupWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={() => setShowWizard(false)}
      />

      {/* Custom Ingredient Search Dialog */}
      <AddCustomIngredientDialog
        open={showAddCustom}
        onClose={() => setShowAddCustom(false)}
      />
    </div>
  );
}

// ── i18n ──────────────────────────────────────────────────────────────

const DE = {
  emptyTitle: 'Noch kein Vorrat eingerichtet',
  emptyDesc: 'Richte deinen Vorrat ein, damit der Buddy passende Rezepte empfehlen kann.',
  setupButton: 'Vorrat einrichten',
  addCustom: 'Zutat suchen & hinzufuegen',
  searchPlaceholder: 'Zutat suchen...',
  totalItems: 'Zutaten',
  categories: 'Kategorien',
  expiringSoon: 'Läuft ab',
  expiringWarning: 'Diese Zutaten laufen bald ab:',
  clearAll: 'Alles leeren',
  clearCategory: 'Kategorie leeren',
  cancel: 'Abbrechen',
  confirmClearAllTitle: 'Gesamten Vorrat leeren?',
  confirmClearAllDesc: 'Alle Zutaten werden aus deinem Vorrat entfernt. Du kannst den Vorrat danach neu einrichten.',
  confirmClearCategoryTitle: 'Kategorie leeren?',
  confirmClearCategoryDesc: 'Alle Zutaten in "{category}" werden entfernt. Die Kategorie selbst bleibt erhalten.',
  allergenWarning: 'Diese Zutaten koennten fuer dich unvertraeglich sein (laut Profil):',
};

const EN = {
  emptyTitle: 'No pantry set up yet',
  emptyDesc: 'Set up your pantry so the Buddy can recommend matching recipes.',
  setupButton: 'Set Up Pantry',
  addCustom: 'Search & add ingredient',
  searchPlaceholder: 'Search ingredient...',
  totalItems: 'Ingredients',
  categories: 'Categories',
  expiringSoon: 'Expiring',
  expiringWarning: 'These ingredients are expiring soon:',
  clearAll: 'Clear All',
  clearCategory: 'Clear Category',
  cancel: 'Cancel',
  confirmClearAllTitle: 'Clear entire pantry?',
  confirmClearAllDesc: 'All ingredients will be removed from your pantry. You can set it up again afterwards.',
  confirmClearCategoryTitle: 'Clear category?',
  confirmClearCategoryDesc: 'All ingredients in "{category}" will be removed. The category itself will remain.',
  allergenWarning: 'These ingredients may conflict with your allergies (from profile):',
};
