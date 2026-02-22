/**
 * FeatureTour — Modal carousel shown on first login.
 *
 * 5 steps introducing the Buddy's capabilities.
 * Uses localStorage to track completion per user.
 * Animated slide transitions via CSS.
 */

import { useState, useCallback } from 'react';
import { X, Utensils, Dumbbell, ClipboardList, Heart, BarChart3, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface FeatureTourProps {
  userId: string;
  onComplete: () => void;
  onSendMessage?: (msg: string) => void;
}

const STORAGE_KEY_PREFIX = 'fitbuddy_feature_tour_completed_';

export function isFeatureTourCompleted(userId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) === 'true';
  } catch {
    return false;
  }
}

export function markFeatureTourCompleted(userId: string): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, 'true');
  } catch {
    // localStorage not available
  }
}

interface TourStep {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  exampleKey: string;
  gradient: string;
}

export function FeatureTour({ userId, onComplete, onSendMessage }: FeatureTourProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TourStep[] = [
    { icon: <Utensils className="h-8 w-8" />, titleKey: 'step1Title', descKey: 'step1Desc', exampleKey: 'step1Example', gradient: 'from-emerald-400 to-teal-500' },
    { icon: <Dumbbell className="h-8 w-8" />, titleKey: 'step2Title', descKey: 'step2Desc', exampleKey: 'step2Example', gradient: 'from-blue-400 to-indigo-500' },
    { icon: <ClipboardList className="h-8 w-8" />, titleKey: 'step3Title', descKey: 'step3Desc', exampleKey: 'step3Example', gradient: 'from-purple-400 to-fuchsia-500' },
    { icon: <Heart className="h-8 w-8" />, titleKey: 'step4Title', descKey: 'step4Desc', exampleKey: 'step4Example', gradient: 'from-rose-400 to-red-500' },
    { icon: <BarChart3 className="h-8 w-8" />, titleKey: 'step5Title', descKey: 'step5Desc', exampleKey: 'step5Example', gradient: 'from-amber-400 to-orange-500' },
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleComplete = useCallback(() => {
    markFeatureTourCompleted(userId);
    onComplete();
  }, [userId, onComplete]);

  const handleSkip = useCallback(() => {
    markFeatureTourCompleted(userId);
    onComplete();
  }, [userId, onComplete]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLast, handleComplete]);

  const handleExampleTap = useCallback(() => {
    const exampleText = (t.tour as Record<string, string>)[step.exampleKey];
    if (onSendMessage && exampleText) {
      markFeatureTourCompleted(userId);
      onSendMessage(exampleText);
      onComplete();
    }
  }, [step, t.tour, onSendMessage, userId, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-br ${step.gradient} p-8 text-white text-center relative`}>
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mb-3">{step.icon}</div>
          <h2 className="text-lg font-bold">
            {(t.tour as Record<string, string>)[step.titleKey]}
          </h2>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {(t.tour as Record<string, string>)[step.descKey]}
          </p>

          {/* Example message bubble */}
          <button
            onClick={handleExampleTap}
            className="w-full text-left bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <span className="text-[10px] text-teal-500 block mb-1">
              {t.buddy.helpHint.split(':')[0]}:
            </span>
            &ldquo;{(t.tour as Record<string, string>)[step.exampleKey]}&rdquo;
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5">
          {/* Dots */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-4 bg-teal-500'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t.tour.skip}
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600 transition-colors"
            >
              {isLast ? t.tour.done : t.tour.next}
              {!isLast && <ChevronRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
