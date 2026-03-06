/**
 * PostSessionFeedback — Shown after saving a workout session.
 * Collects user feeling (4 buttons) + optional joint pain feedback.
 * Saves to workouts.session_feedback JSONB.
 *
 * Can be disabled in profile settings (ai_trainer_enabled).
 */

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { supabase } from '../../../lib/supabase';
import type { SessionFeedback } from '../../../types/health';

interface PostSessionFeedbackProps {
  workoutId: string;
  completionRate: number;
  exercisesSkipped: string[];
  onComplete: () => void;
  onSkip: () => void;
}

const FEELING_OPTIONS = [
  { key: 'easy' as const, emoji: '😴', labelDE: 'Zu leicht', labelEN: 'Too easy' },
  { key: 'good' as const, emoji: '✅', labelDE: 'Gut', labelEN: 'Good' },
  { key: 'hard' as const, emoji: '💪', labelDE: 'Hart', labelEN: 'Hard' },
  { key: 'exhausted' as const, emoji: '😵', labelDE: 'Kaputt', labelEN: 'Exhausted' },
];

const JOINT_AREAS = [
  { key: 'left_shoulder', labelDE: 'L. Schulter', labelEN: 'L. Shoulder' },
  { key: 'right_shoulder', labelDE: 'R. Schulter', labelEN: 'R. Shoulder' },
  { key: 'left_elbow', labelDE: 'L. Ellbogen', labelEN: 'L. Elbow' },
  { key: 'right_elbow', labelDE: 'R. Ellbogen', labelEN: 'R. Elbow' },
  { key: 'left_wrist', labelDE: 'L. Handgelenk', labelEN: 'L. Wrist' },
  { key: 'right_wrist', labelDE: 'R. Handgelenk', labelEN: 'R. Wrist' },
  { key: 'lower_back', labelDE: 'Unterer Rücken', labelEN: 'Lower Back' },
  { key: 'left_knee', labelDE: 'L. Knie', labelEN: 'L. Knee' },
  { key: 'right_knee', labelDE: 'R. Knie', labelEN: 'R. Knee' },
  { key: 'left_hip', labelDE: 'L. Hüfte', labelEN: 'L. Hip' },
  { key: 'right_hip', labelDE: 'R. Hüfte', labelEN: 'R. Hip' },
  { key: 'neck', labelDE: 'Nacken', labelEN: 'Neck' },
];

export function PostSessionFeedback({
  workoutId,
  completionRate,
  exercisesSkipped,
  onComplete,
  onSkip,
}: PostSessionFeedbackProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [feeling, setFeeling] = useState<SessionFeedback['overall_feeling'] | null>(null);
  const [showJointPain, setShowJointPain] = useState(false);
  const [selectedJoints, setSelectedJoints] = useState<string[]>([]);
  const [jointRating, setJointRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const toggleJoint = (key: string) => {
    setSelectedJoints(prev =>
      prev.includes(key) ? prev.filter(j => j !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!feeling) return;
    setIsSaving(true);

    const feedback: SessionFeedback = {
      overall_feeling: feeling,
      joint_pain: selectedJoints,
      joint_pain_rating: selectedJoints.length > 0 ? jointRating : 0,
      completion_rate: completionRate,
      exercises_skipped: exercisesSkipped,
    };

    try {
      await supabase
        .from('workouts')
        .update({ session_feedback: feedback })
        .eq('id', workoutId);
    } catch (err) {
      console.error('[PostSessionFeedback] Save failed:', err);
    }

    onComplete();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {isDE ? 'Wie war dein Training?' : 'How was your workout?'}
        </h3>
        <button onClick={onSkip} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 4 Feeling Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {FEELING_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFeeling(opt.key)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
              feeling === opt.key
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-[10px] font-medium text-gray-600">
              {isDE ? opt.labelDE : opt.labelEN}
            </span>
          </button>
        ))}
      </div>

      {/* Optional Joint Pain (collapsible) */}
      <button
        onClick={() => setShowJointPain(!showJointPain)}
        className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs text-gray-500">
          {isDE ? 'Gelenkschmerz melden (optional)' : 'Report joint pain (optional)'}
        </span>
        {showJointPain ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>

      {showJointPain && (
        <div className="space-y-3 px-1">
          {/* Joint selection chips */}
          <div className="flex flex-wrap gap-1.5">
            {JOINT_AREAS.map(area => (
              <button
                key={area.key}
                onClick={() => toggleJoint(area.key)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  selectedJoints.includes(area.key)
                    ? 'bg-amber-100 border-amber-400 text-amber-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {isDE ? area.labelDE : area.labelEN}
              </button>
            ))}
          </div>

          {/* Pain rating (1-5) */}
          {selectedJoints.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                {isDE ? 'Schmerzstärke:' : 'Pain level:'}
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setJointRating(level)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium border-2 transition-all ${
                      jointRating === level
                        ? level <= 2
                          ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                          : level <= 4
                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                            : 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400">
                {isDE ? '1 = leicht, 5 = sehr stark' : '1 = mild, 5 = severe'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!feeling || isSaving}
        className="w-full py-3 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
      >
        {isSaving
          ? (isDE ? 'Speichern...' : 'Saving...')
          : (isDE ? 'Feedback senden' : 'Submit feedback')}
      </button>
    </div>
  );
}
