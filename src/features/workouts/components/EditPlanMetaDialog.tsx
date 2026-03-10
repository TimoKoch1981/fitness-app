/**
 * EditPlanMetaDialog — Edit plan metadata (name, split type, days/week, notes).
 *
 * Bottom-sheet style dialog, matching CreatePlanDialog design.
 * Includes "Buddy helfen lassen" button to get AI help.
 */

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useUpdateTrainingPlan } from '../hooks/useTrainingPlans';
import { useInlineBuddyChat } from '../../../shared/components/InlineBuddyChatContext';
import { SPLIT_OPTIONS } from './CreatePlanDialog';
import type { TrainingPlan, SplitType } from '../../../types/health';

interface EditPlanMetaDialogProps {
  plan: TrainingPlan;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const DAYS_OPTIONS = [2, 3, 4, 5, 6, 7];

export function EditPlanMetaDialog({ plan, open, onClose, onSaved }: EditPlanMetaDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { openBuddyChat } = useInlineBuddyChat();
  const updatePlan = useUpdateTrainingPlan();

  const [name, setName] = useState(plan.name);
  const [splitType, setSplitType] = useState<SplitType>(plan.split_type);
  const [daysPerWeek, setDaysPerWeek] = useState(plan.days_per_week);
  const [notes, setNotes] = useState(plan.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  // Reset state when plan changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(plan.name);
      setSplitType(plan.split_type);
      setDaysPerWeek(plan.days_per_week);
      setNotes(plan.notes ?? '');
      setError(null);
    }
  }, [open, plan]);

  if (!open) return null;

  const hasChanges =
    name !== plan.name ||
    splitType !== plan.split_type ||
    daysPerWeek !== plan.days_per_week ||
    (notes ?? '') !== (plan.notes ?? '');

  const handleSave = async () => {
    setError(null);
    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        name: name.trim() || plan.name,
        split_type: splitType,
        days_per_week: daysPerWeek,
        notes: notes.trim() || undefined,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('[EditPlanMetaDialog] Save failed:', err);
      setError(isDE
        ? 'Speichern fehlgeschlagen. Bitte erneut versuchen.'
        : 'Failed to save. Please try again.');
    }
  };

  const handleBuddyHelp = () => {
    const msg = isDE
      ? `Hilf mir meinen Trainingsplan "${plan.name}" anzupassen. Aktuell: ${plan.split_type}, ${plan.days_per_week}x/Woche. Was schlägst du vor?`
      : `Help me adjust my training plan "${plan.name}". Currently: ${plan.split_type}, ${plan.days_per_week}x/week. What do you suggest?`;
    openBuddyChat(msg, 'training');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl mx-4 sm:mx-auto overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">
            {isDE ? 'Plan bearbeiten' : 'Edit Plan'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Plan Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              {isDE ? 'Name' : 'Name'} *
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
              {isDE ? 'Split-Typ' : 'Split Type'}
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
              {isDE ? 'Tage/Woche' : 'Days/week'}
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
              {isDE ? 'Notizen' : 'Notes'} <span className="text-gray-300">({isDE ? 'optional' : 'optional'})</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={isDE ? 'z.B. Fokus auf Hypertrophie' : 'e.g. Focus on hypertrophy'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
            />
          </div>
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
          <button
            onClick={handleSave}
            disabled={!hasChanges || updatePlan.isPending || !name.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {updatePlan.isPending
              ? (isDE ? 'Speichern...' : 'Saving...')
              : (isDE ? 'Speichern' : 'Save')
            }
          </button>
          <button
            onClick={handleBuddyHelp}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-teal-600 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {isDE ? 'Buddy helfen lassen' : 'Let Buddy help'}
          </button>
        </div>
      </div>
    </div>
  );
}
