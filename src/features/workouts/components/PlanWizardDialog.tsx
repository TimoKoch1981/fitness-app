/**
 * PlanWizardDialog — Unified 2-step wizard for creating and editing training plans.
 *
 * Replaces CreatePlanDialog and EditPlanMetaDialog with a side-by-side
 * Buddy experience. When docked, wizard takes 55% left (desktop) or
 * 60vh top (mobile), buddy takes the rest.
 */

import { ChevronLeft, ChevronRight, Dumbbell, Save, AlertCircle, MessageCircle, X } from 'lucide-react';
import { usePlanWizard } from '../context/PlanWizardContext';
import { useInlineBuddyChat } from '../../../shared/components/InlineBuddyChatContext';
import { PlanWizardMetaStep } from './PlanWizardMetaStep';
import { PlanWizardExerciseStep } from './PlanWizardExerciseStep';
import { useTranslation } from '../../../i18n';

export function PlanWizardDialog() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const t = (useTranslation().t as unknown as Record<string, Record<string, string>>).plans;

  const {
    isActive,
    mode,
    step,
    buddyDocked,
    name,
    isSaving,
    error,
    closeWizard,
    setStep,
    setBuddyDocked,
    goToStep2,
    saveWizard,
  } = usePlanWizard();

  const { openBuddyChat, setDocked } = useInlineBuddyChat();

  if (!isActive) return null;

  const handleBuddyHelp = () => {
    setBuddyDocked(true);
    setDocked(true);
    // Open buddy docked without auto-message — user types their own request
    openBuddyChat(undefined, 'training');
  };

  const handleClose = () => {
    setDocked(false);
    closeWizard();
  };

  const title = mode === 'create'
    ? (t?.createNew ?? (isDE ? 'Neuen Plan erstellen' : 'Create New Plan'))
    : (isDE ? 'Plan bearbeiten' : 'Edit Plan');

  // When buddy is docked, wizard takes left/top portion
  const wizardClasses = buddyDocked
    ? 'fixed inset-0 z-50 flex flex-col md:flex-row'
    : 'fixed inset-0 z-50 flex items-end justify-center sm:items-center';

  const panelClasses = buddyDocked
    ? 'relative bg-white flex flex-col w-full md:w-[55%] h-[60vh] md:h-full overflow-hidden md:border-r border-gray-200'
    : 'relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl mx-4 sm:mx-auto overflow-hidden max-h-[85vh] flex flex-col';

  return (
    <div className={wizardClasses}>
      {/* Backdrop (only when not docked) */}
      {!buddyDocked && <div className="absolute inset-0 bg-black/30" onClick={handleClose} />}

      {/* Wizard Panel */}
      <div className={panelClasses}>
        {/* Header */}
        <div className={`sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10 flex-shrink-0 ${!buddyDocked ? 'rounded-t-2xl' : ''}`}>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="p-1 rounded-full hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-teal-500" />
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 pt-3 flex-shrink-0">
          <div className="flex gap-2">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-teal-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-teal-500' : 'bg-gray-200'}`} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {step === 1 ? (t?.step1 ?? 'Plan Details') : (t?.step2 ?? (isDE ? 'Übungen zuweisen' : 'Assign Exercises'))}
          </p>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {step === 1 ? <PlanWizardMetaStep /> : <PlanWizardExerciseStep />}
        </div>

        {/* Error feedback */}
        {error && (
          <div className="px-5 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex-shrink-0 space-y-2">
          {step === 1 ? (
            <>
              <button
                onClick={goToStep2}
                disabled={!name.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDE ? 'Weiter' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </button>
              {!buddyDocked && (
                <button
                  onClick={handleBuddyHelp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-teal-600 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  {isDE ? 'Buddy helfen lassen' : 'Let Buddy help'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => saveWizard()}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving
                  ? (isDE ? 'Speichere...' : 'Saving...')
                  : mode === 'create'
                    ? (t?.create ?? (isDE ? 'Plan erstellen' : 'Create Plan'))
                    : (isDE ? 'Speichern' : 'Save')
                }
              </button>
              {!buddyDocked && (
                <button
                  onClick={handleBuddyHelp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-teal-600 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  {isDE ? 'Buddy helfen lassen' : 'Let Buddy help'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Docked buddy placeholder area — actual buddy renders via InlineBuddyChat */}
      {buddyDocked && (
        <div className="flex-1 bg-gray-50 md:block hidden" />
      )}
    </div>
  );
}
