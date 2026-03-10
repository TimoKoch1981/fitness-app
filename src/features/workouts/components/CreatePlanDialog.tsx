/**
 * CreatePlanDialog — Create a new training plan.
 *
 * Minimal version: Name, Split-Type, Days/Week, Notes.
 * Creates plan with default day names ("Tag 1", "Tag 2", ...),
 * then opens PlanEditorDialog for the first day.
 */

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Dumbbell, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddTrainingPlan } from '../hooks/useTrainingPlans';
import type { SplitType } from '../../../types/health';

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after plan is successfully created, with the new plan's ID */
  onCreated?: (planId: string) => void;
}

const SPLIT_OPTIONS: { value: SplitType; labelDE: string; labelEN: string }[] = [
  { value: 'ppl', labelDE: 'Push/Pull/Legs', labelEN: 'Push/Pull/Legs' },
  { value: 'upper_lower', labelDE: 'Upper/Lower', labelEN: 'Upper/Lower' },
  { value: 'full_body', labelDE: 'Ganzkörper', labelEN: 'Full Body' },
  { value: 'custom', labelDE: 'Custom', labelEN: 'Custom' },
  { value: 'running', labelDE: 'Laufplan', labelEN: 'Running Plan' },
  { value: 'swimming', labelDE: 'Schwimmplan', labelEN: 'Swimming Plan' },
  { value: 'cycling', labelDE: 'Radfahrplan', labelEN: 'Cycling Plan' },
  { value: 'yoga', labelDE: 'Yoga', labelEN: 'Yoga' },
  { value: 'martial_arts', labelDE: 'Kampfsport', labelEN: 'Martial Arts' },
  { value: 'mixed', labelDE: 'Gemischt', labelEN: 'Mixed' },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6, 7];

/** Default day name patterns based on split type */
function getDefaultDayNames(splitType: SplitType, daysPerWeek: number, isDE: boolean): string[] {
  const day = isDE ? 'Tag' : 'Day';

  switch (splitType) {
    case 'ppl': {
      const cycle = isDE
        ? ['Push', 'Pull', 'Legs']
        : ['Push', 'Pull', 'Legs'];
      return Array.from({ length: daysPerWeek }, (_, i) => cycle[i % 3]);
    }
    case 'upper_lower': {
      const cycle = isDE
        ? ['Oberkörper', 'Unterkörper']
        : ['Upper Body', 'Lower Body'];
      return Array.from({ length: daysPerWeek }, (_, i) => {
        const base = cycle[i % 2];
        const letter = String.fromCharCode(65 + Math.floor(i / 2)); // A, B, C...
        return `${base} ${letter}`;
      });
    }
    case 'full_body':
      return Array.from({ length: daysPerWeek }, (_, i) =>
        `${isDE ? 'Ganzkörper' : 'Full Body'} ${String.fromCharCode(65 + i)}`
      );
    default:
      return Array.from({ length: daysPerWeek }, (_, i) => `${day} ${i + 1}`);
  }
}

export function CreatePlanDialog({ open, onClose, onCreated }: CreatePlanDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const t = (useTranslation().t as unknown as Record<string, Record<string, string>>).plans;

  const addPlan = useAddTrainingPlan();

  // Step 1: Plan metadata
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('upper_lower');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [notes, setNotes] = useState('');

  // Step 2: Day configuration
  const [dayNames, setDayNames] = useState<string[]>([]);
  const [dayFocuses, setDayFocuses] = useState<string[]>([]);

  // Error feedback
  const [error, setError] = useState<string | null>(null);

  // Reset ALL state when dialog opens (component stays mounted via open prop)
  useEffect(() => {
    if (open) {
      setStep(1);
      setName('');
      setSplitType('upper_lower');
      setDaysPerWeek(4);
      setNotes('');
      setDayNames([]);
      setDayFocuses([]);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleNextStep = () => {
    const defaults = getDefaultDayNames(splitType, daysPerWeek, isDE);
    setDayNames(defaults);
    setDayFocuses(new Array(daysPerWeek).fill(''));
    setStep(2);
  };

  const handleCreate = async () => {
    setError(null);
    try {
      const newPlan = await addPlan.mutateAsync({
        name: name.trim() || (isDE ? 'Neuer Plan' : 'New Plan'),
        split_type: splitType,
        days_per_week: daysPerWeek,
        notes: notes.trim() || undefined,
        days: dayNames.map((dayName, i) => ({
          day_number: i + 1,
          name: dayName.trim() || `${isDE ? 'Tag' : 'Day'} ${i + 1}`,
          focus: dayFocuses[i]?.trim() || undefined,
          exercises: [],
        })),
      });
      onCreated?.(newPlan.id);
      onClose();
    } catch (err) {
      console.error('[CreatePlanDialog] Create failed:', err);
      setError(isDE
        ? 'Plan konnte nicht gespeichert werden. Bitte erneut versuchen.'
        : 'Failed to save plan. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl mx-4 sm:mx-auto overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="p-1 rounded-full hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-teal-500" />
              <h3 className="text-base font-semibold text-gray-900">
                {t?.createNew ?? 'Create New Plan'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
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
            {step === 1 ? (t?.step1 ?? 'Plan Details') : (t?.step2 ?? 'Configure Days')}
          </p>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          {step === 1 ? (
            <>
              {/* Plan Name */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  {t?.planName ?? 'Plan Name'} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isDE ? 'z.B. 4-Tage Upper/Lower' : 'e.g. 4-Day Upper/Lower'}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Split Type */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  {t?.splitType ?? 'Split Type'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SPLIT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSplitType(opt.value)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                        splitType === opt.value
                          ? 'bg-teal-500 text-white font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isDE ? opt.labelDE : opt.labelEN}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days per Week */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  {t?.daysPerWeek ?? 'Days/week'}
                </label>
                <div className="flex gap-2">
                  {DAYS_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setDaysPerWeek(n)}
                      className={`w-10 h-10 text-sm font-medium rounded-xl transition-colors ${
                        daysPerWeek === n
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  {t?.notes ?? 'Notes'} <span className="text-gray-300">({t?.optional ?? 'optional'})</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={isDE ? 'z.B. Fokus auf Hypertrophie' : 'e.g. Focus on hypertrophy'}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
                />
              </div>
            </>
          ) : (
            /* Step 2: Day Configuration */
            <div className="space-y-3">
              {dayNames.map((dayName, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-teal-600">
                      {isDE ? 'Tag' : 'Day'} {i + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 mb-0.5 block">
                        {t?.dayName ?? 'Day Name'}
                      </label>
                      <input
                        type="text"
                        value={dayName}
                        onChange={(e) => {
                          const next = [...dayNames];
                          next[i] = e.target.value;
                          setDayNames(next);
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-0.5 block">
                        {t?.dayFocus ?? 'Focus'}
                      </label>
                      <input
                        type="text"
                        value={dayFocuses[i] ?? ''}
                        onChange={(e) => {
                          const next = [...dayFocuses];
                          next[i] = e.target.value;
                          setDayFocuses(next);
                        }}
                        placeholder={isDE ? 'z.B. Brust, Rücken' : 'e.g. Chest, Back'}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex-shrink-0">
          {step === 1 ? (
            <button
              onClick={handleNextStep}
              disabled={!name.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDE ? 'Weiter' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={addPlan.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              <Dumbbell className="h-4 w-4" />
              {addPlan.isPending
                ? (t?.creating ?? 'Creating...')
                : (t?.create ?? 'Create Plan')
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
