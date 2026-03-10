/**
 * WorkoutStartDialog — Dual-entry dialog for starting a workout.
 *
 * Two primary options:
 * 1. "Freies Training" → Navigate to ActiveWorkoutPage in free mode
 * 2. "Training loggen" → Open AddWorkoutDialog (quick-log for completed workouts)
 *
 * Design follows industry standard (Strong, Hevy): empty-session start vs quick log.
 */

import { useNavigate } from 'react-router-dom';
import { X, ClipboardList, Play } from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface WorkoutStartDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called when user selects "Quick-Log" — parent opens AddWorkoutDialog */
  onQuickLog: () => void;
}

export function WorkoutStartDialog({ open, onClose, onQuickLog }: WorkoutStartDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const navigate = useNavigate();

  if (!open) return null;

  const handleFreeWorkout = () => {
    onClose();
    navigate('/active-workout?mode=free');
  };

  const handleQuickLog = () => {
    onClose();
    onQuickLog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl mx-4 sm:mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h3 className="text-base font-semibold text-gray-900">
            {isDE ? 'Workout' : 'Workout'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Options */}
        <div className="px-5 pb-5 space-y-3">
          {/* Primary: Start Free Workout */}
          <button
            onClick={handleFreeWorkout}
            className="w-full flex items-center gap-4 p-4 bg-teal-50 border-2 border-teal-200 rounded-xl hover:bg-teal-100 hover:border-teal-300 transition-colors text-left group"
          >
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
              <Play className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {isDE ? 'Freies Training starten' : 'Start Free Workout'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isDE
                  ? 'Übungen auswählen, Sätze live tracken'
                  : 'Pick exercises, track sets live'}
              </p>
            </div>
          </button>

          {/* Secondary: Quick-Log */}
          <button
            onClick={handleQuickLog}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-colors text-left group"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gray-300 transition-colors">
              <ClipboardList className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {isDE ? 'Training schnell loggen' : 'Quick-Log Workout'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isDE
                  ? 'Bereits absolviertes Training eintragen'
                  : 'Log a completed workout'}
              </p>
            </div>
          </button>

          {/* Hint */}
          <p className="text-[10px] text-gray-400 text-center pt-1">
            {isDE
              ? 'Plan-basierte Trainings starten über den "Plan"-Tab'
              : 'Plan-based workouts start from the "Plan" tab'}
          </p>
        </div>
      </div>
    </div>
  );
}
