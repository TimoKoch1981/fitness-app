/**
 * PlanWizardMetaStep — Step 1 of the PlanWizard.
 *
 * Collects: Plan name, split type, days/week, notes.
 */

import { usePlanWizard } from '../context/PlanWizardContext';
import { SPLIT_OPTIONS, DAYS_OPTIONS } from '../data/planConstants';
import { useTranslation } from '../../../i18n';

export function PlanWizardMetaStep() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const t = (useTranslation().t as unknown as Record<string, Record<string, string>>).plans;

  const { name, splitType, daysPerWeek, notes, updateMeta } = usePlanWizard();

  return (
    <div className="space-y-4">
      {/* Plan Name */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">
          {t?.planName ?? 'Plan Name'} *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => updateMeta('name', e.target.value)}
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
              onClick={() => updateMeta('splitType', opt.value)}
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
              onClick={() => updateMeta('daysPerWeek', n)}
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
          onChange={(e) => updateMeta('notes', e.target.value)}
          rows={2}
          placeholder={isDE ? 'z.B. Fokus auf Hypertrophie' : 'e.g. Focus on hypertrophy'}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}
