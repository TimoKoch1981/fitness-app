/**
 * ShoppingListView — Displays a single shopping list with checkable items.
 * Items grouped by category. Supports check/uncheck, clipboard export, delete.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Trash2,
  CheckCircle2,
  ShoppingCart,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useToggleShoppingItem, useDeleteShoppingList, useCompleteShoppingList } from '../hooks/useShoppingLists';
import { shoppingListToClipboardText } from '../utils/shoppingListBuilder';
import { CATEGORY_INFO, type IngredientCategory } from '../../pantry/types';
import type { ShoppingList } from '../types';

interface ShoppingListViewProps {
  list: ShoppingList;
}

export function ShoppingListView({ list }: ShoppingListViewProps) {
  const { language } = useTranslation();
  const t = language === 'de' ? DE : EN;

  const toggleItem = useToggleShoppingItem();
  const deleteList = useDeleteShoppingList();
  const completeList = useCompleteShoppingList();

  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const items = list.items ?? [];
  const checkedCount = items.filter((i) => i.is_checked).length;
  const totalCount = items.length;
  const allChecked = totalCount > 0 && checkedCount === totalCount;

  // Group items by category
  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    // Sort by CATEGORY_INFO sortOrder
    return [...map.entries()].sort((a, b) => {
      const oa = CATEGORY_INFO[a[0] as IngredientCategory]?.sortOrder ?? 99;
      const ob = CATEGORY_INFO[b[0] as IngredientCategory]?.sortOrder ?? 99;
      return oa - ob;
    });
  }, [items]);

  const handleToggle = useCallback(
    (itemId: string, currentChecked: boolean) => {
      toggleItem.mutate({ id: itemId, is_checked: !currentChecked });
    },
    [toggleItem],
  );

  const handleCopy = useCallback(async () => {
    const text = shoppingListToClipboardText(list.name, items);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [list.name, items]);

  const handleDelete = useCallback(() => {
    deleteList.mutate(list.id);
    setConfirmDelete(false);
  }, [deleteList, list.id]);

  const handleComplete = useCallback(() => {
    completeList.mutate(list.id);
  }, [completeList, list.id]);

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <ShoppingCart className="h-4 w-4 text-teal-500 flex-shrink-0" />
        <span className="flex-1 text-sm font-medium text-gray-800 truncate">
          {list.name || t.untitled}
        </span>
        <span className="text-xs text-gray-500">
          {checkedCount}/{totalCount}
        </span>
        {/* Progress bar mini */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${allChecked ? 'bg-green-500' : 'bg-teal-500'}`}
            style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 py-2 space-y-3">
          {/* Items grouped by category */}
          {grouped.map(([cat, catItems]) => {
            const info = CATEGORY_INFO[cat as IngredientCategory];
            return (
              <div key={cat}>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {info ? `${info.icon} ${language === 'de' ? info.labelDe : info.labelEn}` : cat}
                </p>
                <div className="space-y-1">
                  {catItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleToggle(item.id, item.is_checked)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <span
                        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          item.is_checked
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {item.is_checked && <Check className="h-3 w-3" />}
                      </span>
                      <span
                        className={`flex-1 text-sm ${
                          item.is_checked ? 'line-through text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {item.amount && item.unit
                          ? `${item.amount} ${item.unit} `
                          : item.amount
                          ? `${item.amount} `
                          : ''}
                        {item.ingredient_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            {/* Copy to clipboard */}
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              {copied ? t.copied : t.copyToClipboard}
            </button>

            {/* Mark complete */}
            {allChecked && (
              <button
                onClick={handleComplete}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t.markComplete}
              </button>
            )}

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex-1 flex gap-1">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600"
                >
                  {t.confirmDelete}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200"
                >
                  {t.cancel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── i18n ──────────────────────────────────────────────────────────────

const DE = {
  untitled: 'Einkaufsliste',
  copyToClipboard: 'Kopieren',
  copied: 'Kopiert!',
  markComplete: 'Erledigt',
  confirmDelete: 'Loeschen',
  cancel: 'Abbrechen',
};

const EN = {
  untitled: 'Shopping List',
  copyToClipboard: 'Copy',
  copied: 'Copied!',
  markComplete: 'Complete',
  confirmDelete: 'Delete',
  cancel: 'Cancel',
};
