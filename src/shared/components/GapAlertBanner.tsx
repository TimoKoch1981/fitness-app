import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useGapDetection } from '../hooks/useGapDetection';

/**
 * Shows a friendly re-engagement banner when the user hasn't logged meals or
 * workouts for 2+ days. Dismissable for the current session.
 */
export function GapAlertBanner() {
  const { t, language } = useTranslation();
  const { mealGapDays, workoutGapDays, hasGap, isLoading } = useGapDetection();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !hasGap || dismissed) return null;

  // Build message parts
  const parts: string[] = [];
  if (mealGapDays !== null && mealGapDays >= 2) {
    parts.push(
      language === 'de'
        ? `${mealGapDays} Tage keine Mahlzeit`
        : `${mealGapDays} days no meals`
    );
  }
  if (workoutGapDays !== null && workoutGapDays >= 2) {
    parts.push(
      language === 'de'
        ? `${workoutGapDays} Tage kein Training`
        : `${workoutGapDays} days no workout`
    );
  }

  const gapDetail = parts.join(language === 'de' ? ' & ' : ' & ');

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800">
          {t.gaps.title}
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          {gapDetail} — {t.gaps.message}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-amber-400 hover:text-amber-600 flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
