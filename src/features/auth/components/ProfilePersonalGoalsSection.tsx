/**
 * ProfilePersonalGoalsSection — Primary goal type + target weight/bodyfat/date/notes.
 * Extracted from ProfilePage (v14.20 / P1-7). Pure presentational: state stays
 * in ProfilePage and is passed down via props.
 */

import { HelpCircle } from 'lucide-react';
import type { PrimaryGoal } from '../../../types/health';

interface ProfilePersonalGoalsSectionProps {
  language: 'de' | 'en' | string;
  t: {
    profile: {
      personalGoals: string;
      goalType: string;
      goalMuscle: string;
      goalFatLoss: string;
      goalHealth: string;
      goalPerformance: string;
      goalRecomp: string;
      goalsHelpToggle: string;
      goalMuscleHelp: string;
      goalFatLossHelp: string;
      goalHealthHelp: string;
      goalPerformanceHelp: string;
      goalRecompHelp: string;
      goalFieldsHelp: string;
      targetWeight: string;
      targetBodyFat: string;
      targetDate: string;
      goalNotes: string;
    };
  };
  primaryGoal: PrimaryGoal | '';
  targetWeight: string;
  targetBodyFat: string;
  targetDate: string;
  goalNotes: string;
  showGoalsHelp: boolean;
  onShowGoalsHelpChange: (next: boolean) => void;
  onPrimaryGoalChange: (next: PrimaryGoal | '') => void;
  onTargetWeightChange: (next: string) => void;
  onTargetBodyFatChange: (next: string) => void;
  onTargetDateChange: (next: string) => void;
  onGoalNotesChange: (next: string) => void;
}

export function ProfilePersonalGoalsSection(props: ProfilePersonalGoalsSectionProps) {
  const {
    language, t,
    primaryGoal, targetWeight, targetBodyFat, targetDate, goalNotes,
    showGoalsHelp,
    onShowGoalsHelpChange,
    onPrimaryGoalChange, onTargetWeightChange, onTargetBodyFatChange,
    onTargetDateChange, onGoalNotesChange,
  } = props;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">{t.profile.personalGoals}</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t.profile.goalType}
          </label>
          <div className="flex gap-1 flex-wrap">
            {([
              ['muscle_gain', t.profile.goalMuscle],
              ['fat_loss', t.profile.goalFatLoss],
              ['health', t.profile.goalHealth],
              ['performance', t.profile.goalPerformance],
              ['body_recomp', t.profile.goalRecomp],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => onPrimaryGoalChange(primaryGoal === val ? '' : val)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  primaryGoal === val
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Goals Help */}
        <button
          type="button"
          onClick={() => onShowGoalsHelpChange(!showGoalsHelp)}
          className="flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 transition-colors"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {t.profile.goalsHelpToggle}
        </button>
        {showGoalsHelp && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-[10px] text-gray-600 leading-relaxed">
            <p>💪 {t.profile.goalMuscleHelp}</p>
            <p>🔥 {t.profile.goalFatLossHelp}</p>
            <p>❤️ {t.profile.goalHealthHelp}</p>
            <p>⚡ {t.profile.goalPerformanceHelp}</p>
            <p>🔄 {t.profile.goalRecompHelp}</p>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <p className="text-gray-700 font-medium">📊 {t.profile.goalFieldsHelp}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t.profile.targetWeight}
            </label>
            <div className="relative">
              <input
                type="number"
                value={targetWeight}
                onChange={(e) => onTargetWeightChange(e.target.value)}
                placeholder="85"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                min="30"
                max="300"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">kg</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t.profile.targetBodyFat}
            </label>
            <div className="relative">
              <input
                type="number"
                value={targetBodyFat}
                onChange={(e) => onTargetBodyFatChange(e.target.value)}
                placeholder="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                min="3"
                max="50"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t.profile.targetDate}
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => onTargetDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t.profile.goalNotes}
          </label>
          <input
            type="text"
            value={goalNotes}
            onChange={(e) => onGoalNotesChange(e.target.value)}
            placeholder={language === 'de' ? 'z.B. Sixpack bis Sommer' : 'e.g. Get a sixpack by summer'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
          />
        </div>
      </div>
    </div>
  );
}
