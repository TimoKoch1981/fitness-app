/**
 * PlanWizardMetaStep — Step 1 of the PlanWizard.
 *
 * Collects: Training type, Plan name, split type, days/week, notes.
 * Phase 2: Added training type selection with 6 big buttons.
 */

import { useState } from 'react';
import { usePlanWizard } from '../context/PlanWizardContext';
import { TRAINING_TYPE_GROUPS, SPLIT_OPTIONS, DAYS_OPTIONS } from '../data/planConstants';
import { useTranslation } from '../../../i18n';

type TrainingTypeKey = 'strength' | 'yoga' | 'tai_chi' | 'five_tibetans' | 'endurance' | 'mixed';

/** Map TRAINING_TYPE_GROUPS index to a stable key */
const GROUP_KEYS: TrainingTypeKey[] = ['strength', 'yoga', 'tai_chi', 'five_tibetans', 'endurance', 'mixed'];

export function PlanWizardMetaStep() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const t = (useTranslation().t as unknown as Record<string, Record<string, string>>).plans;

  const { name, splitType, daysPerWeek, notes, updateMeta } = usePlanWizard();

  // Track which training type group is selected
  const [selectedGroup, setSelectedGroup] = useState<TrainingTypeKey | null>(() => {
    // Infer from current splitType
    for (let i = 0; i < TRAINING_TYPE_GROUPS.length; i++) {
      if (TRAINING_TYPE_GROUPS[i].type.includes(splitType)) {
        return GROUP_KEYS[i];
      }
    }
    return null;
  });

  /** When a training type group button is clicked */
  const handleGroupSelect = (groupKey: TrainingTypeKey, groupIndex: number) => {
    setSelectedGroup(groupKey);
    const group = TRAINING_TYPE_GROUPS[groupIndex];

    switch (groupKey) {
      case 'yoga':
        updateMeta('splitType', 'yoga');
        break;
      case 'tai_chi':
        updateMeta('splitType', 'tai_chi');
        break;
      case 'five_tibetans':
        updateMeta('splitType', 'five_tibetans');
        updateMeta('daysPerWeek', 7);
        break;
      case 'mixed':
        updateMeta('splitType', 'mixed');
        break;
      case 'strength':
        // Default to upper_lower if not already a strength split
        if (!group.type.includes(splitType)) {
          updateMeta('splitType', 'upper_lower');
        }
        break;
      case 'endurance':
        // Default to running if not already an endurance split
        if (!group.type.includes(splitType)) {
          updateMeta('splitType', 'running');
        }
        break;
    }
  };

  // Filter SPLIT_OPTIONS to show only splits for the selected group
  const visibleSplitOptions = selectedGroup
    ? SPLIT_OPTIONS.filter((opt) => {
        const groupIndex = GROUP_KEYS.indexOf(selectedGroup);
        if (groupIndex < 0) return true;
        return TRAINING_TYPE_GROUPS[groupIndex].type.includes(opt.value);
      })
    : [];

  // Determine if we should show sub-split selection
  // yoga, tai_chi, five_tibetans, mixed => no sub-split needed (single split type)
  const showSubSplit = selectedGroup === 'strength' || selectedGroup === 'endurance';

  // Determine if we should show days per week
  // five_tibetans => auto 7, skip days selection
  const showDaysPerWeek = selectedGroup && selectedGroup !== 'five_tibetans';

  return (
    <div className="space-y-4">
      {/* Training Type Selection — 6 big buttons */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">
          {isDE ? 'Trainingsart' : 'Training Type'}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TRAINING_TYPE_GROUPS.map((group, i) => {
            const key = GROUP_KEYS[i];
            const isSelected = selectedGroup === key;
            return (
              <button
                key={key}
                onClick={() => handleGroupSelect(key, i)}
                className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-teal-500 text-white shadow-md scale-[1.02]'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                <span className="text-2xl">{group.icon}</span>
                <span className="text-xs font-medium leading-tight">
                  {isDE ? group.labelDE : group.labelEN}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Name */}
      {selectedGroup && (
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
      )}

      {/* Sub-Split Type (only for strength/endurance) */}
      {showSubSplit && visibleSplitOptions.length > 1 && (
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            {t?.splitType ?? 'Split Type'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {visibleSplitOptions.map((opt) => (
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
      )}

      {/* Days per Week */}
      {showDaysPerWeek && (
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
      )}

      {/* Notes */}
      {selectedGroup && (
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
      )}
    </div>
  );
}
