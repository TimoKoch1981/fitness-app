/**
 * Action Confirm Banner — compact confirmation UI for AI-detected data logging.
 *
 * Shown below the agent's chat message when an ACTION block is detected.
 * The user can:
 * - Confirm: save data to the database
 * - Reject: dismiss the banner without saving
 *
 * Design: compact card with icon, title, summary, and action buttons.
 */

import { Check, X, Loader2 } from 'lucide-react';
import type { ParsedAction, ActionStatus } from '../../../lib/ai/actions/types';
import { getActionDisplayInfo } from '../../../lib/ai/actions/types';

interface ActionConfirmBannerProps {
  action: ParsedAction;
  status: ActionStatus;
  errorMessage?: string | null;
  onConfirm: () => void;
  onReject: () => void;
}

export function ActionConfirmBanner({
  action,
  status,
  errorMessage,
  onConfirm,
  onReject,
}: ActionConfirmBannerProps) {
  const display = getActionDisplayInfo(action);

  // Already executed or rejected — show nothing
  if (status === 'executed' || status === 'rejected') return null;

  const isExecuting = status === 'executing';
  const isFailed = status === 'failed';

  return (
    <div className="ml-11 mb-3 max-w-[85%]">
      <div className={`rounded-xl border p-3 shadow-sm ${
        isFailed
          ? 'bg-red-50 border-red-200'
          : 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200'
      }`}>
        {/* Header: Icon + Title */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg">{display.icon}</span>
          <span className="text-sm font-semibold text-gray-800">{display.title}</span>
        </div>

        {/* Summary */}
        <p className="text-xs text-gray-600 mb-2.5 ml-7">{display.summary}</p>

        {/* Error message */}
        {isFailed && errorMessage && (
          <p className="text-xs text-red-600 mb-2.5 ml-7">{errorMessage}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 ml-7">
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isExecuting
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95'
            }`}
          >
            {isExecuting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            {isExecuting ? 'Speichert...' : isFailed ? 'Nochmal' : 'Speichern'}
          </button>

          <button
            onClick={onReject}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <X className="h-3 w-3" />
            Verwerfen
          </button>
        </div>
      </div>
    </div>
  );
}
