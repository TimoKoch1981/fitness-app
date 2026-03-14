/**
 * PantrySetupWizard — 3-step wizard for initial pantry setup.
 *
 * Step 1: Template selection (Basis, Fitness, Vegan, Empty)
 * Step 2: Category review with collapsible sections + item toggles + search
 * Step 3: Summary + save
 */

import { useState, useMemo, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, Search, Check, Loader2, Package } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import { useIngredientCatalog } from '../hooks/useIngredientCatalog';
import { useAddFromCatalog } from '../hooks/usePantry';
import {
  PANTRY_TEMPLATES,
  CATEGORY_INFO,
  type PantryTemplate,
  type IngredientCategory,
  type IngredientCatalogItem,
} from '../types';

interface PantrySetupWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function PantrySetupWizard({ open, onClose, onComplete }: PantrySetupWizardProps) {
  const { language } = useTranslation();
  const t = language === 'de' ? DE : EN;

  const [step, setStep] = useState(1);
  const [, setSelectedTemplate] = useState<PantryTemplate | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<IngredientCategory>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: catalog, isLoading: catalogLoading } = useIngredientCatalog();
  const addFromCatalog = useAddFromCatalog();

  // Group catalog by category for step 2
  const groupedCatalog = useMemo(() => {
    if (!catalog) return new Map<IngredientCategory, IngredientCatalogItem[]>();
    const map = new Map<IngredientCategory, IngredientCatalogItem[]>();
    for (const item of catalog) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [catalog]);

  // Search-filtered catalog
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim() || !catalog) return null;
    const q = searchQuery.toLowerCase();
    return catalog.filter(
      (item) =>
        item.name_de.toLowerCase().includes(q) ||
        (item.name_en?.toLowerCase().includes(q) ?? false) ||
        item.search_terms.some((st) => st.toLowerCase().includes(q))
    );
  }, [catalog, searchQuery]);

  // Selected items as array for summary
  const selectedArray = useMemo(() => {
    if (!catalog) return [];
    return catalog.filter((item) => selectedItems.has(item.id));
  }, [catalog, selectedItems]);

  // Summary by category
  const summaryByCategory = useMemo(() => {
    const map = new Map<IngredientCategory, number>();
    for (const item of selectedArray) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return map;
  }, [selectedArray]);

  // Handle template selection → pre-select items
  const handleTemplateSelect = useCallback(
    (template: PantryTemplate) => {
      setSelectedTemplate(template);
      if (template === 'empty') {
        setSelectedItems(new Set());
      } else if (catalog) {
        const filter = PANTRY_TEMPLATES[template].filter;
        const ids = new Set(catalog.filter(filter).map((i) => i.id));
        setSelectedItems(ids);
      }
      setStep(2);
    },
    [catalog]
  );

  const toggleItem = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCategory = useCallback(
    (cat: IngredientCategory) => {
      const items = groupedCatalog.get(cat) ?? [];
      const allSelected = items.every((i) => selectedItems.has(i.id));
      setSelectedItems((prev) => {
        const next = new Set(prev);
        for (const item of items) {
          if (allSelected) next.delete(item.id);
          else next.add(item.id);
        }
        return next;
      });
    },
    [groupedCatalog, selectedItems]
  );

  const toggleExpanded = useCallback((cat: IngredientCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!catalog || selectedArray.length === 0) return;
    setSaving(true);
    try {
      await addFromCatalog.mutateAsync(selectedArray);
      setSaved(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error('[PantrySetupWizard] Save failed:', err);
      setSaving(false);
    }
  }, [catalog, selectedArray, addFromCatalog, onComplete]);

  if (!open) return null;

  // Sorted categories for display
  const sortedCategories = [...groupedCatalog.entries()].sort(
    (a, b) => (CATEGORY_INFO[a[0]]?.sortOrder ?? 99) - (CATEGORY_INFO[b[0]]?.sortOrder ?? 99)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-500" />
            <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-colors',
                  s <= step ? 'bg-teal-500' : 'bg-gray-200'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t.stepOf.replace('{step}', String(step)).replace('{total}', '3')}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {step === 1 && (
            <Step1Templates
              t={t}
              language={language}
              onSelect={handleTemplateSelect}
              catalogLoading={catalogLoading}
              catalogCount={catalog?.length ?? 0}
            />
          )}

          {step === 2 && (
            <Step2Categories
              t={t}
              language={language}
              sortedCategories={sortedCategories}
              selectedItems={selectedItems}
              expandedCategories={expandedCategories}
              searchQuery={searchQuery}
              searchFiltered={searchFiltered}
              onSearchChange={setSearchQuery}
              onToggleItem={toggleItem}
              onToggleCategory={toggleCategory}
              onToggleExpanded={toggleExpanded}
            />
          )}

          {step === 3 && (
            <Step3Summary
              t={t}
              language={language}
              summaryByCategory={summaryByCategory}
              totalCount={selectedArray.length}
              saving={saving}
              saved={saved}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          {step > 1 && !saved && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={saving}
            >
              {t.back}
            </button>
          )}
          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600"
            >
              {t.next} ({selectedItems.size} {t.selected})
            </button>
          )}
          {step === 3 && !saved && (
            <button
              onClick={handleSave}
              disabled={saving || selectedArray.length === 0}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? t.saving : t.saveAndStart}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Template Selection ────────────────────────────────────────

function Step1Templates({
  t,
  language,
  onSelect,
  catalogLoading,
  catalogCount,
}: {
  t: typeof DE;
  language: string;
  onSelect: (template: PantryTemplate) => void;
  catalogLoading: boolean;
  catalogCount: number;
}) {
  if (catalogLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
      </div>
    );
  }

  const templates: PantryTemplate[] = ['basis', 'fitness', 'vegan', 'empty'];

  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm text-gray-600">{t.step1Desc}</p>

      {templates.map((key) => {
        const tmpl = PANTRY_TEMPLATES[key];
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="w-full flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-teal-50 hover:border-teal-200 border border-gray-100 transition-all text-left"
          >
            <span className="text-2xl">{tmpl.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">
                {language === 'de' ? tmpl.labelDe : tmpl.labelEn}
              </p>
              <p className="text-xs text-gray-500">
                {language === 'de' ? tmpl.descDe : tmpl.descEn}
              </p>
            </div>
          </button>
        );
      })}

      <p className="text-xs text-gray-400 text-center pt-2">
        {t.catalogInfo.replace('{count}', String(catalogCount))}
      </p>
    </div>
  );
}

// ── Step 2: Category Review ───────────────────────────────────────────

function Step2Categories({
  t,
  language,
  sortedCategories,
  selectedItems,
  expandedCategories,
  searchQuery,
  searchFiltered,
  onSearchChange,
  onToggleItem,
  onToggleCategory,
  onToggleExpanded,
}: {
  t: typeof DE;
  language: string;
  sortedCategories: [IngredientCategory, IngredientCatalogItem[]][];
  selectedItems: Set<string>;
  expandedCategories: Set<IngredientCategory>;
  searchQuery: string;
  searchFiltered: IngredientCatalogItem[] | null;
  onSearchChange: (q: string) => void;
  onToggleItem: (id: string) => void;
  onToggleCategory: (cat: IngredientCategory) => void;
  onToggleExpanded: (cat: IngredientCategory) => void;
}) {
  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm text-gray-600">{t.step2Desc}</p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Search Results */}
      {searchFiltered && (
        <div className="bg-yellow-50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-medium text-yellow-700">
            {searchFiltered.length} {t.resultsFor} &quot;{searchQuery}&quot;
          </p>
          {searchFiltered.slice(0, 20).map((item) => (
            <ItemChip
              key={item.id}
              item={item}
              selected={selectedItems.has(item.id)}
              onToggle={() => onToggleItem(item.id)}
            />
          ))}
        </div>
      )}

      {/* Categories */}
      {!searchFiltered &&
        sortedCategories.map(([cat, items]) => {
          const info = CATEGORY_INFO[cat];
          const expanded = expandedCategories.has(cat);
          const selectedInCat = items.filter((i) => selectedItems.has(i.id)).length;
          const allSelected = selectedInCat === items.length;

          return (
            <div key={cat} className="border border-gray-100 rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => onToggleExpanded(cat)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-left"
              >
                <span className="text-base">{info.icon}</span>
                <span className="flex-1 text-sm font-medium text-gray-800">
                  {language === 'de' ? info.labelDe : info.labelEn}
                </span>
                <span className="text-xs text-gray-500">
                  {selectedInCat}/{items.length}
                </span>
                {/* Select all toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCategory(cat);
                  }}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full border transition-colors',
                    allSelected
                      ? 'bg-teal-100 text-teal-700 border-teal-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300'
                  )}
                >
                  {allSelected ? t.deselectAll : t.selectAll}
                </button>
                {expanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {/* Items */}
              {expanded && (
                <div className="px-3 py-2 flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <ItemChip
                      key={item.id}
                      item={item}
                      selected={selectedItems.has(item.id)}
                      onToggle={() => onToggleItem(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

// ── Step 3: Summary ───────────────────────────────────────────────────

function Step3Summary({
  t,
  language,
  summaryByCategory,
  totalCount,
  saved,
}: {
  t: typeof DE;
  language: string;
  summaryByCategory: Map<IngredientCategory, number>;
  totalCount: number;
  saving?: boolean;
  saved: boolean;
}) {
  const sorted = [...summaryByCategory.entries()].sort(
    (a, b) => (CATEGORY_INFO[a[0]]?.sortOrder ?? 99) - (CATEGORY_INFO[b[0]]?.sortOrder ?? 99)
  );

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-teal-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{t.savedTitle}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {t.savedDesc.replace('{count}', String(totalCount))}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="text-center">
        <p className="text-3xl font-bold text-teal-600">{totalCount}</p>
        <p className="text-sm text-gray-600">{t.itemsSelected}</p>
      </div>

      <div className="space-y-2">
        {sorted.map(([cat, count]) => {
          const info = CATEGORY_INFO[cat];
          return (
            <div key={cat} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-base">{info.icon}</span>
              <span className="flex-1 text-sm text-gray-700">
                {language === 'de' ? info.labelDe : info.labelEn}
              </span>
              <span className="text-sm font-medium text-teal-600">{count}</span>
            </div>
          );
        })}
      </div>

      {totalCount === 0 && (
        <p className="text-sm text-amber-600 text-center bg-amber-50 p-3 rounded-lg">
          {t.noItemsWarning}
        </p>
      )}
    </div>
  );
}

// ── Item Chip Component ───────────────────────────────────────────────

function ItemChip({
  item,
  selected,
  onToggle,
}: {
  item: IngredientCatalogItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all',
        selected
          ? 'bg-teal-100 text-teal-800 border-teal-200'
          : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
      )}
    >
      {selected && <Check className="h-3 w-3" />}
      {item.name_de}
    </button>
  );
}

// ── i18n Constants ────────────────────────────────────────────────────

const DE = {
  title: 'Vorrat einrichten',
  stepOf: 'Schritt {step} von {total}',
  step1Desc: 'Wähle eine Vorlage als Ausgangspunkt. Du kannst danach alles anpassen.',
  step2Desc: 'Passe deinen Vorrat an — wähle Zutaten aus oder ab.',
  searchPlaceholder: 'Zutat suchen...',
  resultsFor: 'Ergebnisse für',
  selectAll: 'Alle',
  deselectAll: 'Keine',
  selected: 'ausgewählt',
  back: 'Zurück',
  next: 'Weiter',
  saveAndStart: 'Vorrat speichern',
  saving: 'Wird gespeichert...',
  savedTitle: 'Vorrat eingerichtet! ✓',
  savedDesc: '{count} Zutaten in deinem Vorrat gespeichert.',
  itemsSelected: 'Zutaten ausgewählt',
  noItemsWarning: 'Du hast keine Zutaten ausgewählt. Du kannst jederzeit Zutaten über den Chat hinzufügen.',
  catalogInfo: '{count} Zutaten im Katalog verfügbar',
};

const EN = {
  title: 'Set Up Pantry',
  stepOf: 'Step {step} of {total}',
  step1Desc: 'Choose a template as a starting point. You can adjust everything afterwards.',
  step2Desc: 'Customize your pantry — select or deselect ingredients.',
  searchPlaceholder: 'Search ingredient...',
  resultsFor: 'results for',
  selectAll: 'All',
  deselectAll: 'None',
  selected: 'selected',
  back: 'Back',
  next: 'Next',
  saveAndStart: 'Save Pantry',
  saving: 'Saving...',
  savedTitle: 'Pantry Set Up! ✓',
  savedDesc: '{count} ingredients saved to your pantry.',
  itemsSelected: 'ingredients selected',
  noItemsWarning: 'You haven\'t selected any ingredients. You can always add items via the chat.',
  catalogInfo: '{count} ingredients available in catalog',
};
