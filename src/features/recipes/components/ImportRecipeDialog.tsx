/**
 * ImportRecipeDialog — Import a recipe from a URL.
 * 3-tier extraction: JSON-LD → Microdata → AI fallback (server-side via Edge Function).
 * Shows a preview of the extracted data, then opens RecipeEditor with prefilled data.
 */

import { useState, useCallback } from 'react';
import {
  X,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Link as LinkIcon,
} from 'lucide-react';
import { RecipePreviewCard } from './RecipePreviewCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useImportRecipeFromUrl } from '../hooks/useImportRecipeFromUrl';
import type { ImportStatus } from '../hooks/useImportRecipeFromUrl';
import { useTranslation } from '../../../i18n';

interface ImportRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: (recipeData: Record<string, unknown>) => void;
}

const STATUS_LABELS: Record<ImportStatus, Record<string, string>> = {
  idle: { de: '', en: '' },
  fetching: { de: 'Seite wird geladen...', en: 'Loading page...' },
  extracting: { de: 'Rezept wird extrahiert...', en: 'Extracting recipe...' },
  done: { de: 'Rezept gefunden!', en: 'Recipe found!' },
  error: { de: 'Fehler', en: 'Error' },
};

const SOURCE_LABELS: Record<string, Record<string, string>> = {
  json_ld: { de: 'Strukturierte Daten', en: 'Structured Data' },
  microdata: { de: 'Microdata', en: 'Microdata' },
  ai: { de: 'KI-Extraktion', en: 'AI Extraction' },
};

export function ImportRecipeDialog({ open, onClose, onImported }: ImportRecipeDialogProps) {
  const { language } = useTranslation();
  const de = language === 'de';
  const { status, importedRecipe, error, importFromUrl, reset } = useImportRecipeFromUrl();
  const [url, setUrl] = useState('');

  const handleImport = useCallback(async () => {
    if (!url.trim()) return;
    const result = await importFromUrl(url.trim());
    // If successful, recipe data is in importedRecipe state
    if (result.success && result.recipe) {
      // Don't auto-close — show preview first
    }
  }, [url, importFromUrl]);

  const handleConfirm = useCallback(() => {
    if (!importedRecipe) return;
    // Pass recipe data to parent (will open RecipeEditor with prefilled data)
    onImported(importedRecipe as unknown as Record<string, unknown>);
    setUrl('');
    reset();
    onClose();
  }, [importedRecipe, onImported, onClose, reset]);

  const handleClose = useCallback(() => {
    setUrl('');
    reset();
    onClose();
  }, [onClose, reset]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim() && status === 'idle') {
      handleImport();
    }
  };

  if (!open) return null;

  const isLoading = status === 'fetching' || status === 'extracting';
  const recipe = importedRecipe;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-semibold">
                {de ? 'Rezept importieren' : 'Import Recipe'}
              </h2>
            </div>
            <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {de ? 'Rezept-URL einfuegen' : 'Paste recipe URL'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://chefkoch.de/rezepte/..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleImport}
                  disabled={!url.trim() || isLoading}
                  className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  {de ? 'Importieren' : 'Import'}
                </button>
              </div>
            </div>

            {/* Status */}
            {status !== 'idle' && status !== 'done' && (
              <div className={`flex items-center gap-2 text-sm rounded-lg p-3 ${
                status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
              }`}>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
                {status === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{error || STATUS_LABELS[status][de ? 'de' : 'en']}</span>
              </div>
            )}

            {/* Recipe Preview */}
            {recipe && status === 'done' && (
              <div className="space-y-3">
                {/* Success banner */}
                <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg p-3">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {STATUS_LABELS.done[de ? 'de' : 'en']}
                    {' · '}
                    <span className="opacity-75">
                      {SOURCE_LABELS[recipe.import_method || 'json_ld']?.[de ? 'de' : 'en'] || recipe.import_method}
                    </span>
                  </span>
                </div>

                <RecipePreviewCard recipe={recipe as unknown as Record<string, unknown>} language={language} />
              </div>
            )}

            {/* Hint when idle */}
            {status === 'idle' && !url && (
              <div className="text-center py-6 text-gray-400">
                <Globe className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {de
                    ? 'Fuege die URL eines Rezepts ein (z.B. von Chefkoch, EatSmarter, BBC Good Food...)'
                    : 'Paste a recipe URL (e.g. from AllRecipes, BBC Good Food...)'}
                </p>
                <p className="text-xs mt-1 opacity-60">
                  {de
                    ? 'Funktioniert mit den meisten Food-Blogs und Rezeptseiten.'
                    : 'Works with most food blogs and recipe sites.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {de ? 'Abbrechen' : 'Cancel'}
            </button>
            {recipe && status === 'done' && (
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center justify-center gap-1.5"
              >
                {de ? 'Bearbeiten & Speichern' : 'Edit & Save'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
