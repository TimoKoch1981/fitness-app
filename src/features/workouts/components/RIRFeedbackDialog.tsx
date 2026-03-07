/**
 * RIRFeedbackDialog — RIR (Reps in Reserve) Feedback nach erstem Satz
 *
 * Wird NUR in der allerersten Session eines kalibrierten Plans gezeigt.
 * Nach dem ersten Satz jeder Uebung: "Wie war das Gewicht?"
 *
 * 3 Buttons: Zu leicht (+15%) / Passt (behalten) / Zu schwer (−15%)
 *
 * Konzept: KONZEPT_KI_TRAINER.md Block B, RIR-Feedback
 */

import { Smile, ThumbsUp, Frown } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { calculateRIRAdjustment } from '../hooks/useCalibration';

interface RIRFeedbackDialogProps {
  exerciseName: string;
  currentWeight: number;
  onAdjust: (newWeight: number) => void;
  onDismiss: () => void;
}

export function RIRFeedbackDialog({
  exerciseName,
  currentWeight,
  onAdjust,
  onDismiss,
}: RIRFeedbackDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const t = useTranslation().t as Record<string, unknown>;
  const rir = (t.rirFeedback ?? {}) as Record<string, string>;

  const label = (key: string, fallbackDE: string, fallbackEN: string): string =>
    (rir[key] as string) ?? (isDE ? fallbackDE : fallbackEN);

  const handleTooLight = () => {
    const newWeight = calculateRIRAdjustment(currentWeight, 'lighter', exerciseName);
    onAdjust(newWeight);
  };

  const handleTooHeavy = () => {
    const newWeight = calculateRIRAdjustment(currentWeight, 'heavier', exerciseName);
    onAdjust(newWeight);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onDismiss} />

      {/* Dialog */}
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl p-5 mb-4 sm:mb-0 animate-in slide-in-from-bottom-4">
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 text-center">
          {label('title', 'Wie war das Gewicht?', 'How was the weight?')}
        </h3>
        <p className="text-sm text-gray-500 text-center mt-1">
          {exerciseName} — {currentWeight} kg
        </p>

        {/* 3 Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {/* Zu leicht */}
          <button
            onClick={handleTooLight}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-blue-100 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 transition-colors"
          >
            <Smile className="h-7 w-7 text-blue-500" />
            <span className="text-xs font-medium text-blue-700">
              {label('tooLight', 'Zu leicht', 'Too light')}
            </span>
            <span className="text-[10px] text-blue-400 leading-tight text-center">
              {label('tooLightHint', '4+ Wdh Reserve', '4+ reps left')}
            </span>
          </button>

          {/* Passt */}
          <button
            onClick={onDismiss}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-teal-100 bg-teal-50 hover:border-teal-300 hover:bg-teal-100 transition-colors"
          >
            <ThumbsUp className="h-7 w-7 text-teal-500" />
            <span className="text-xs font-medium text-teal-700">
              {label('justRight', 'Passt', 'Just right')}
            </span>
            <span className="text-[10px] text-teal-400 leading-tight text-center">
              {label('justRightHint', '2-3 Wdh Reserve', '2-3 reps left')}
            </span>
          </button>

          {/* Zu schwer */}
          <button
            onClick={handleTooHeavy}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-amber-100 bg-amber-50 hover:border-amber-300 hover:bg-amber-100 transition-colors"
          >
            <Frown className="h-7 w-7 text-amber-500" />
            <span className="text-xs font-medium text-amber-700">
              {label('tooHeavy', 'Zu schwer', 'Too heavy')}
            </span>
            <span className="text-[10px] text-amber-400 leading-tight text-center">
              {label('tooHeavyHint', 'Kaum geschafft', 'Barely made it')}
            </span>
          </button>
        </div>

        {/* Skip hint */}
        <p className="text-[10px] text-gray-400 text-center mt-3">
          {label('skipHint', 'Nur in der ersten Session — danach automatisch', 'First session only — auto-calibrates after')}
        </p>
      </div>
    </div>
  );
}
