/**
 * TextImportDialog — Parse recipe text into structured data.
 * Extracted from RecipeEditor for use in the AddRecipeMethodDialog flow.
 */

import { useState, useCallback } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipeImport } from '../hooks/useRecipeImport';
import { useTranslation } from '../../../i18n';
import type { Recipe } from '../types';

interface TextImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: (data: Partial<Recipe>) => void;
}

export function TextImportDialog({ open, onClose, onImported }: TextImportDialogProps) {
  const { t, language } = useTranslation();
  const de = language === 'de';
  const { parseText, parsedRecipe, error, reset } = useRecipeImport();
  const [text, setText] = useState('');

  const handleParse = useCallback(() => {
    if (!text.trim()) return;
    parseText(text);
  }, [text, parseText]);

  const handleConfirm = useCallback(() => {
    if (!parsedRecipe) return;
    onImported(parsedRecipe);
    setText('');
    reset();
    onClose();
  }, [parsedRecipe, onImported, onClose, reset]);

  const handleClose = useCallback(() => {
    setText('');
    reset();
    onClose();
  }, [onClose, reset]);

  if (!open) return null;

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
              <FileText className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-semibold">
                {t.recipes.importFromText}
              </h2>
            </div>
            <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-sm text-gray-500">
              {de
                ? 'Fuege einen Rezepttext ein. Abschnitte wie "Zutaten" und "Zubereitung" werden automatisch erkannt.'
                : 'Paste a recipe text. Sections like "Ingredients" and "Instructions" are detected automatically.'}
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.recipes.importPlaceholder}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              autoFocus
            />

            {error && (
              <div className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {parsedRecipe && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {de ? 'Erkannt:' : 'Detected:'}
                </p>
                <ul className="text-xs text-green-600 dark:text-green-400 space-y-0.5">
                  {parsedRecipe.title && <li>📝 {parsedRecipe.title}</li>}
                  {parsedRecipe.ingredients?.length && (
                    <li>🥕 {parsedRecipe.ingredients.length} {de ? 'Zutaten' : 'ingredients'}</li>
                  )}
                  {parsedRecipe.steps?.length && (
                    <li>📋 {parsedRecipe.steps.length} {de ? 'Schritte' : 'steps'}</li>
                  )}
                  {parsedRecipe.servings && (
                    <li>🍽 {parsedRecipe.servings} {de ? 'Portionen' : 'servings'}</li>
                  )}
                </ul>
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
            {parsedRecipe ? (
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
              >
                {de ? 'Uebernehmen & Bearbeiten' : 'Apply & Edit'}
              </button>
            ) : (
              <button
                onClick={handleParse}
                disabled={!text.trim()}
                className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.recipes.parseImport}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
