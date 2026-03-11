/**
 * ActionErrorMessage — displays action errors in the chat.
 *
 * Replaces silent failures with visible feedback.
 * Shows what went wrong and offers a retry option.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';

interface ActionErrorMessageProps {
  /** User-facing error message */
  message: string;
  /** Detailed error info (optional, shown in collapsed section) */
  details?: string;
  /** Retry callback (optional — shows retry button if provided) */
  onRetry?: () => void;
}

export function ActionErrorMessage({ message, details, onRetry }: ActionErrorMessageProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm">
      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-red-700 dark:text-red-300 font-medium">{message}</p>
        {details && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1 truncate">{details}</p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Nochmal versuchen
          </button>
        )}
      </div>
    </div>
  );
}
