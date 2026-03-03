import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTranslation } from '../../i18n';

/**
 * Thin banner at the top of the screen when the user is offline.
 * Yellow/amber color to signal limited functionality.
 */
export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-amber-600 px-4 py-1.5">
            <WifiOff className="h-3.5 w-3.5 text-amber-100" />
            <p className="text-xs font-medium text-amber-100">
              {t.pwa.offlineMessage}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
