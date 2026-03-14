/**
 * ShoppingTabContent — Main shopping list management view.
 * Shows all active shopping lists. Empty state with instructions.
 */

import { ShoppingCart } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useShoppingLists } from '../hooks/useShoppingLists';
import { ShoppingListView } from './ShoppingListView';

export function ShoppingTabContent() {
  const { language } = useTranslation();
  const t = language === 'de' ? DE : EN;
  const { data: lists, isLoading } = useShoppingLists();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (!lists || lists.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">{t.emptyTitle}</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">{t.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="flex gap-2">
        <div className="flex-1 bg-teal-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-teal-700">{lists.length}</p>
          <p className="text-xs text-teal-600">{t.activeLists}</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-gray-700">
            {lists.reduce((sum, l) => sum + (l.items?.length ?? 0), 0)}
          </p>
          <p className="text-xs text-gray-500">{t.totalItems}</p>
        </div>
      </div>

      {/* Lists */}
      {lists.map((list) => (
        <ShoppingListView key={list.id} list={list} />
      ))}
    </div>
  );
}

// ── i18n ──────────────────────────────────────────────────────────────

const DE = {
  loading: 'Laden...',
  emptyTitle: 'Keine Einkaufslisten',
  emptyDesc: 'Erstelle eine Einkaufsliste aus einem Rezept. Oeffne ein Rezept und tippe auf "Zur Einkaufsliste".',
  activeLists: 'Aktive Listen',
  totalItems: 'Zutaten',
};

const EN = {
  loading: 'Loading...',
  emptyTitle: 'No shopping lists',
  emptyDesc: 'Create a shopping list from a recipe. Open a recipe and tap "Add to Shopping List".',
  activeLists: 'Active Lists',
  totalItems: 'Items',
};
