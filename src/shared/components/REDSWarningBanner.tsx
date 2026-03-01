/**
 * RED-S / Underweight Warning Banner.
 *
 * Shows a prominent warning when RED-S risk or underweight is detected.
 * Two severity levels: amber (warning) and red (danger).
 * Dismissable per session (like GapAlertBanner).
 *
 * @see useREDSWarning — the hook that calculates risk state
 * @reference Mountjoy et al. (2018) — IOC RED-S consensus
 */

import { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useREDSWarning } from '../hooks/useREDSWarning';

interface REDSWarningBannerProps {
  /** Today's consumed calories */
  caloriesConsumed?: number;
  /** Daily calorie goal */
  caloriesGoal?: number;
  /** Calculated TDEE (null if profile incomplete) */
  tdee?: number | null;
}

export function REDSWarningBanner({
  caloriesConsumed = 0,
  caloriesGoal = 0,
  tdee = null,
}: REDSWarningBannerProps) {
  const { t, language } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const warning = useREDSWarning(caloriesConsumed, caloriesGoal, tdee);

  // Access reds translations with fallback
  const reds = (t as Record<string, unknown>).reds as Record<string, string> | undefined;

  if (!warning.hasWarning || warning.isLoading || dismissed || !reds) return null;

  const isDanger = warning.severity === 'danger';

  // Build specific warning messages
  const messages: string[] = [];

  if (warning.isSevereUnderweight && warning.bmi !== null) {
    messages.push(
      (reds.severeUnderweight ?? '').replace('{bmi}', warning.bmi.toFixed(1))
    );
  } else if (warning.isUnderweight && warning.bmi !== null) {
    messages.push(
      (reds.underweight ?? '').replace('{bmi}', warning.bmi.toFixed(1))
    );
  }

  if (warning.hasLowEnergyAvailability && warning.energyAvailability !== null) {
    messages.push(
      (reds.lowEnergyAvailability ?? '').replace('{ea}', warning.energyAvailability.toString())
    );
  }

  if (warning.hasExcessiveDeficit && warning.calorieDeficit !== null) {
    messages.push(
      (reds.excessiveDeficit ?? '').replace('{deficit}', Math.round(warning.calorieDeficit).toString())
    );
  }

  if (warning.hasDangerouslyLowIntake) {
    messages.push(reds.dangerouslyLowIntake ?? '');
  }

  if (messages.length === 0) return null;

  return (
    <div
      className={`rounded-xl border p-3 ${
        isDanger
          ? 'bg-red-50 border-red-300'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
          isDanger ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          {isDanger ? (
            <ShieldAlert className="h-4 w-4 text-red-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-sm font-semibold ${
              isDanger ? 'text-red-800' : 'text-amber-800'
            }`}>
              {isDanger ? reds.dangerTitle : reds.warningTitle}
            </h3>
          </div>
          <div className="space-y-0.5">
            {messages.map((msg, i) => (
              <p key={i} className={`text-[11px] leading-relaxed ${
                isDanger ? 'text-red-700' : 'text-amber-700'
              }`}>
                {msg}
              </p>
            ))}
          </div>
          <p className={`text-[10px] mt-1.5 ${
            isDanger ? 'text-red-400' : 'text-amber-400'
          }`}>
            {reds.disclaimer}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={`p-1 flex-shrink-0 ${
            isDanger ? 'text-red-300 hover:text-red-500' : 'text-amber-300 hover:text-amber-500'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
