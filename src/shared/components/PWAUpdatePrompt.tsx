import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle, X } from 'lucide-react';
import { useServiceWorker } from '../../hooks/useServiceWorker';
import { useTranslation } from '../../i18n';

/**
 * Global toast/banner shown at the bottom of the screen:
 * - When a new service worker version is available ("Neue Version verfuegbar")
 * - Briefly when the app is first cached for offline use ("App offline verfuegbar")
 */
export function PWAUpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker, close } = useServiceWorker();
  const { t } = useTranslation();

  // Auto-dismiss the "offline ready" toast after 5 seconds
  useEffect(() => {
    if (offlineReady && !needRefresh) {
      const timer = setTimeout(close, 5000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, needRefresh, close]);

  const isVisible = needRefresh || offlineReady;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md"
        >
          <div className="rounded-xl bg-gray-800 px-4 py-3 shadow-lg border border-gray-700">
            {needRefresh ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 shrink-0 text-teal-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {t.pwa.updateAvailable}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.pwa.newVersion}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={close}
                    className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {t.pwa.later}
                  </button>
                  <button
                    onClick={updateServiceWorker}
                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500 transition-colors"
                  >
                    {t.pwa.update}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-400" />
                <p className="flex-1 text-sm text-white">
                  {t.pwa.offlineReady}
                </p>
                <button
                  onClick={close}
                  className="shrink-0 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
