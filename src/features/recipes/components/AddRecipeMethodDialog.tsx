/**
 * AddRecipeMethodDialog — Single entry point for adding recipes.
 * Replaces the two separate "Neues Rezept" + "URL importieren" buttons.
 * Offers 4 methods: Manual, URL Import, Web Search, Text Import.
 */

import { X, Pencil, Globe, Search, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../../i18n';

interface AddRecipeMethodDialogProps {
  open: boolean;
  onClose: () => void;
  onManual: () => void;
  onImportUrl: () => void;
  onWebSearch: () => void;
  onImportText: () => void;
}

interface MethodOption {
  id: string;
  icon: typeof Pencil;
  titleKey: 'methodManual' | 'methodUrl' | 'methodSearch' | 'methodText';
  descKey: 'methodManualDesc' | 'methodUrlDesc' | 'methodSearchDesc' | 'methodTextDesc';
  onClick: () => void;
  color: string;
  bgColor: string;
}

export function AddRecipeMethodDialog({
  open,
  onClose,
  onManual,
  onImportUrl,
  onWebSearch,
  onImportText,
}: AddRecipeMethodDialogProps) {
  const { t, language } = useTranslation();
  const de = language === 'de';

  const methods: MethodOption[] = [
    {
      id: 'manual',
      icon: Pencil,
      titleKey: 'methodManual',
      descKey: 'methodManualDesc',
      onClick: () => { onClose(); onManual(); },
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    },
    {
      id: 'url',
      icon: Globe,
      titleKey: 'methodUrl',
      descKey: 'methodUrlDesc',
      onClick: () => { onClose(); onImportUrl(); },
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      id: 'search',
      icon: Search,
      titleKey: 'methodSearch',
      descKey: 'methodSearchDesc',
      onClick: () => { onClose(); onWebSearch(); },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      id: 'text',
      icon: FileText,
      titleKey: 'methodText',
      descKey: 'methodTextDesc',
      onClick: () => { onClose(); onImportText(); },
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">
              {(t.recipes as Record<string, string>).addRecipeMethod || (de ? 'Rezept hinzufuegen' : 'Add Recipe')}
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Method options */}
          <div className="p-4 space-y-2">
            {methods.map((method) => {
              const Icon = method.icon;
              const title = (t.recipes as Record<string, string>)[method.titleKey];
              const desc = (t.recipes as Record<string, string>)[method.descKey];

              return (
                <button
                  key={method.id}
                  onClick={method.onClick}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-lg ${method.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${method.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
