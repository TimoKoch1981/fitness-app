/**
 * GuidedTour — Multi-step product tour overlay for first-time users.
 *
 * Step 0: Welcome modal with buddy greeting + tour offer.
 * Steps 1-5: Highlight navigation items with descriptive tooltips.
 *
 * Uses framer-motion for smooth transitions, tailwind for styling.
 * Targets nav items via data-tour-nav attributes on Navigation component.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

interface GuidedTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  navKey: string | null; // data-tour-nav attribute value, null for welcome + buddy
  titleKey: keyof typeof STEP_KEYS;
  descKey: keyof typeof STEP_KEYS;
  icon: React.ReactNode;
  gradient: string;
}

// Maps to guidedTour i18n keys
const STEP_KEYS = {
  cockpitTitle: 'cockpitTitle',
  cockpitDesc: 'cockpitDesc',
  nutritionTitle: 'nutritionTitle',
  nutritionDesc: 'nutritionDesc',
  trainingTitle: 'trainingTitle',
  trainingDesc: 'trainingDesc',
  medicalTitle: 'medicalTitle',
  medicalDesc: 'medicalDesc',
  buddyTitle: 'buddyTitle',
  buddyDesc: 'buddyDesc',
} as const;

const TOUR_STEPS: TourStep[] = [
  {
    navKey: 'cockpit',
    titleKey: 'cockpitTitle',
    descKey: 'cockpitDesc',
    icon: <LayoutDashboard className="h-6 w-6" />,
    gradient: 'from-teal-400 to-teal-600',
  },
  {
    navKey: 'nutrition',
    titleKey: 'nutritionTitle',
    descKey: 'nutritionDesc',
    icon: <UtensilsCrossed className="h-6 w-6" />,
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    navKey: 'training',
    titleKey: 'trainingTitle',
    descKey: 'trainingDesc',
    icon: <Dumbbell className="h-6 w-6" />,
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    navKey: 'medical',
    titleKey: 'medicalTitle',
    descKey: 'medicalDesc',
    icon: <Heart className="h-6 w-6" />,
    gradient: 'from-rose-400 to-rose-600',
  },
  {
    navKey: null, // Buddy floating button — no nav item to highlight
    titleKey: 'buddyTitle',
    descKey: 'buddyDesc',
    icon: <MessageCircle className="h-6 w-6" />,
    gradient: 'from-purple-400 to-purple-600',
  },
];

const TOTAL_STEPS = TOUR_STEPS.length;

/**
 * Get the bounding rect of a nav item by its data-tour-nav value.
 * Returns null if element is not found.
 */
function getNavItemRect(navKey: string): DOMRect | null {
  const el = document.querySelector(`[data-tour-nav="${navKey}"]`);
  return el ? el.getBoundingClientRect() : null;
}

export function GuidedTour({ onComplete, onSkip }: GuidedTourProps) {
  const { t } = useTranslation();
  const gt = t.guidedTour as Record<string, string>;

  // -1 = welcome screen, 0..4 = tour steps
  const [currentStep, setCurrentStep] = useState(-1);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  // Update highlight position for current step
  const updateHighlight = useCallback(() => {
    if (currentStep < 0 || currentStep >= TOUR_STEPS.length) {
      setHighlightRect(null);
      return;
    }
    const step = TOUR_STEPS[currentStep];
    if (step.navKey) {
      const rect = getNavItemRect(step.navKey);
      setHighlightRect(rect);
    } else {
      // Buddy step — try to find the floating buddy button
      const buddyBtn = document.querySelector('[data-tour-buddy]');
      if (buddyBtn) {
        setHighlightRect(buddyBtn.getBoundingClientRect());
      } else {
        setHighlightRect(null);
      }
    }
  }, [currentStep]);

  useEffect(() => {
    updateHighlight();
    // Also update on resize/scroll
    const handleResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateHighlight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateHighlight]);

  const handleStartTour = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep >= TOTAL_STEPS - 1) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, onComplete]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  const isWelcome = currentStep === -1;
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const step = currentStep >= 0 ? TOUR_STEPS[currentStep] : null;

  // Calculate tooltip position (above the highlighted element)
  const tooltipStyle: React.CSSProperties = {};
  if (highlightRect) {
    // Position centered above the highlighted item
    const centerX = highlightRect.left + highlightRect.width / 2;
    tooltipStyle.left = `${centerX}px`;
    tooltipStyle.bottom = `${window.innerHeight - highlightRect.top + 16}px`;
    tooltipStyle.transform = 'translateX(-50%)';
  }

  return (
    <div className="fixed inset-0 z-[200]" aria-modal="true" role="dialog">
      <AnimatePresence mode="wait">
        {/* ── Welcome Screen ─────────────────────────────────────────────── */}
        {isWelcome && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-teal-400 to-emerald-500 p-8 text-white text-center">
                <div className="text-5xl mb-4" role="img" aria-label="Robot">
                  {'\u{1F916}'}
                </div>
                <h2 className="text-xl font-bold">{gt.welcome}</h2>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-sm text-gray-600 leading-relaxed text-center">
                  {gt.welcomeMessage}
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex flex-col gap-3">
                <button
                  onClick={handleStartTour}
                  className="w-full py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all"
                >
                  {gt.startTour}
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {gt.skip}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── Tour Steps ─────────────────────────────────────────────────── */}
        {!isWelcome && step && (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            {/* Semi-transparent backdrop with cutout */}
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            >
              <defs>
                <mask id="tour-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {highlightRect && (
                    <rect
                      x={highlightRect.left - 6}
                      y={highlightRect.top - 6}
                      width={highlightRect.width + 12}
                      height={highlightRect.height + 12}
                      rx="12"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.6)"
                mask="url(#tour-mask)"
                style={{ pointerEvents: 'auto' }}
              />
            </svg>

            {/* Highlight ring around nav item */}
            {highlightRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute rounded-xl border-2 border-teal-400 shadow-[0_0_0_4px_rgba(20,184,166,0.2)]"
                style={{
                  left: highlightRect.left - 6,
                  top: highlightRect.top - 6,
                  width: highlightRect.width + 12,
                  height: highlightRect.height + 12,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Tooltip card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="absolute z-10 w-[calc(100%-2rem)] max-w-sm"
              style={
                highlightRect
                  ? tooltipStyle
                  : {
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }
              }
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Step header with gradient */}
                <div
                  className={`bg-gradient-to-br ${step.gradient} px-5 py-4 text-white flex items-center gap-3`}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold">{gt[step.titleKey]}</h3>
                    <p className="text-xs text-white/70 mt-0.5">
                      {gt.stepOf
                        .replace('{current}', String(currentStep + 1))
                        .replace('{total}', String(TOTAL_STEPS))}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {gt[step.descKey]}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 pb-4">
                  {/* Step dots */}
                  <div className="flex gap-1.5">
                    {TOUR_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === currentStep
                            ? 'w-5 bg-teal-500'
                            : i < currentStep
                              ? 'w-1.5 bg-teal-300'
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
                      {gt.skip}
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-4 py-1.5 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600 active:scale-[0.97] transition-all"
                    >
                      {isLastStep ? gt.finish : gt.next}
                    </button>
                  </div>
                </div>
              </div>

              {/* Arrow pointing down to the highlighted element */}
              {highlightRect && (
                <div className="flex justify-center -mt-px">
                  <div className="w-3 h-3 bg-white rotate-45 transform -translate-y-1.5 shadow-sm" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
