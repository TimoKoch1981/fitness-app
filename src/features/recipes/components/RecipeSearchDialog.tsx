/**
 * RecipeSearchDialog — Search the web for recipes, select one, import it.
 * Flow: Search → Results → Select → Import (via recipe-import) → Preview → Edit & Save.
 */

import { useState, useCallback } from 'react';
import {
  X,
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Globe,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipeSearch } from '../hooks/useRecipeSearch';
import { useImportRecipeFromUrl } from '../hooks/useImportRecipeFromUrl';
import { RecipePreviewCard } from './RecipePreviewCard';
import { useTranslation } from '../../../i18n';
import type { SearchResult } from '../hooks/useRecipeSearch';

interface RecipeSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: (recipeData: Record<string, unknown>) => void;
}

type Phase = 'search' | 'importing' | 'preview';

export function RecipeSearchDialog({ open, onClose, onImported }: RecipeSearchDialogProps) {
  const { t, language } = useTranslation();
  const de = language === 'de';
  const recipes = t.recipes as Record<string, string>;

  const {
    status: searchStatus,
    results,
    queryUsed,
    error: searchError,
    search,
    reset: resetSearch,
  } = useRecipeSearch();

  const {
    status: importStatus,
    importedRecipe,
    error: importError,
    importFromUrl,
    reset: resetImport,
  } = useImportRecipeFromUrl();

  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('search');
  const [showImportError, setShowImportError] = useState(false);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setShowImportError(false);
    search(query);
  }, [query, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim() && searchStatus !== 'searching') {
      handleSearch();
    }
  };

  const handleSelectResult = useCallback(async (result: SearchResult) => {
    setShowImportError(false);
    resetImport(); // clear previous import error
    setPhase('importing');
    const res = await importFromUrl(result.url);
    if (res.success && res.recipe) {
      setPhase('preview');
    } else {
      setPhase('search');
      setShowImportError(true);
    }
  }, [importFromUrl, resetImport]);

  const handleConfirmImport = useCallback(() => {
    if (!importedRecipe) return;
    onImported(importedRecipe as unknown as Record<string, unknown>);
    handleReset();
    onClose();
  }, [importedRecipe, onImported, onClose]);

  const handleBackToResults = useCallback(() => {
    resetImport();
    setPhase('search');
  }, [resetImport]);

  const handleReset = useCallback(() => {
    setQuery('');
    setPhase('search');
    setShowImportError(false);
    resetSearch();
    resetImport();
  }, [resetSearch, resetImport]);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  if (!open) return null;

  const isSearching = searchStatus === 'searching';

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
              {phase !== 'search' && (
                <button onClick={handleBackToResults} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <Search className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">
                {recipes.searchRecipes || (de ? 'Rezepte suchen' : 'Search Recipes')}
              </h2>
            </div>
            <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* ── Phase: Search ─────────────────────────────────────── */}
            {phase === 'search' && (
              <>
                {/* Search input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={recipes.searchPlaceholder || 'z.B. Low Carb Haehnchen Brokkoli'}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isSearching}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={!query.trim() || isSearching}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {recipes.searchButton || (de ? 'Suchen' : 'Search')}
                  </button>
                </div>

                {/* Search status */}
                {isSearching && (
                  <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>{de ? 'Suche laeuft...' : 'Searching...'}</span>
                  </div>
                )}

                {/* Search error */}
                {searchStatus === 'error' && searchError && (
                  <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                {/* Import error (shown after going back from failed import) */}
                {showImportError && importStatus === 'error' && importError && (
                  <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{de ? 'Import fehlgeschlagen: ' : 'Import failed: '}{importError}</span>
                  </div>
                )}

                {/* Results */}
                {searchStatus === 'done' && results.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {results.length} {recipes.searchResults || (de ? 'Suchergebnisse' : 'Search Results')}
                      </p>
                      {queryUsed && queryUsed !== query && (
                        <p className="text-xs text-purple-500">
                          KI: &quot;{queryUsed}&quot;
                        </p>
                      )}
                    </div>

                    {results.map((result, i) => (
                      <button
                        key={`${result.url}-${i}`}
                        onClick={() => handleSelectResult(result)}
                        className="w-full flex gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors text-left"
                      >
                        {/* Thumbnail */}
                        {result.thumbnail ? (
                          <img
                            src={result.thumbnail}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-6 h-6 text-gray-300" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                            {result.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                            {result.snippet}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            <ExternalLink className="w-3 h-3" />
                            <span>{result.source}</span>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                      </button>
                    ))}

                    {/* Powered by */}
                    <p className="text-[10px] text-gray-300 text-center pt-1">
                      {recipes.poweredBySearch || 'Search by DuckDuckGo'}
                    </p>
                  </div>
                )}

                {/* No results */}
                {searchStatus === 'done' && results.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">
                      {recipes.noSearchResults || (de ? 'Keine Rezepte gefunden.' : 'No recipes found.')}
                    </p>
                  </div>
                )}

                {/* Idle hint */}
                {searchStatus === 'idle' && !query && (
                  <div className="text-center py-8 text-gray-400">
                    <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">
                      {de
                        ? 'Suche nach Rezepten im Web — die KI optimiert deine Suche automatisch.'
                        : 'Search for recipes on the web — AI optimizes your search automatically.'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                      {(de
                        ? ['High Protein Bowl', 'Schnelles Abendessen', 'Low Carb Snack', 'Meal Prep Ideen']
                        : ['High Protein Bowl', 'Quick Dinner', 'Low Carb Snack', 'Meal Prep Ideas']
                      ).map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => { setQuery(suggestion); }}
                          className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-xs rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Phase: Importing ──────────────────────────────────── */}
            {phase === 'importing' && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
                <p className="text-sm font-medium">
                  {recipes.importingSelected || (de ? 'Rezept wird importiert...' : 'Importing recipe...')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {de ? 'Daten werden extrahiert und aufbereitet.' : 'Extracting and processing data.'}
                </p>
              </div>
            )}

            {/* ── Phase: Preview ─────────────────────────────────────── */}
            {phase === 'preview' && importedRecipe && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg p-3">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{de ? 'Rezept erfolgreich extrahiert!' : 'Recipe extracted successfully!'}</span>
                </div>

                <RecipePreviewCard
                  recipe={importedRecipe as unknown as Record<string, unknown>}
                  language={language}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <button
              onClick={phase === 'preview' ? handleBackToResults : handleClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {phase === 'preview'
                ? (de ? 'Zurueck' : 'Back')
                : (de ? 'Abbrechen' : 'Cancel')}
            </button>
            {phase === 'preview' && importedRecipe && (
              <button
                onClick={handleConfirmImport}
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
