/**
 * SetBySetTracker — Focuses on ONE set at a time.
 * Shows target, last-time values, input fields for actual reps/weight.
 * "Set done" button logs the set and optionally triggers rest timer.
 *
 * UX improvements:
 * - Clear progress indicators with completed/current/remaining dots
 * - Prominent current set label
 * - Large, clearly labeled input fields
 * - Info hint explaining the workflow
 */

import { useState, useEffect, useCallback } from 'react';
import { Check, SkipForward, Info, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useExerciseCatalog } from '../hooks/useExerciseCatalog';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import type { WorkoutExerciseResult, SetTag } from '../../../types/health';

/** Tag display config */
const TAG_CONFIG: Record<SetTag, { letter: string; bg: string; text: string }> = {
  normal: { letter: '', bg: '', text: '' },
  warmup: { letter: 'W', bg: 'bg-amber-100', text: 'text-amber-700' },
  drop: { letter: 'D', bg: 'bg-purple-100', text: 'text-purple-700' },
  failure: { letter: 'F', bg: 'bg-red-100', text: 'text-red-700' },
};
const TAG_CYCLE: SetTag[] = ['normal', 'warmup', 'drop', 'failure'];
const TAG_LABELS: Record<string, Record<SetTag, string>> = {
  de: { normal: 'Normal', warmup: 'Aufwärm', drop: 'Drop', failure: 'Failure' },
  en: { normal: 'Normal', warmup: 'Warm-up', drop: 'Drop', failure: 'Failure' },
};

interface SetBySetTrackerProps {
  exercise: WorkoutExerciseResult;
  exerciseIndex: number;
  currentSetIndex: number;
  lastExercise?: WorkoutExerciseResult;
  onLogSet: (exerciseIdx: number, setIdx: number, reps: number, weightKg?: number, notes?: string, durationMinutes?: number, distanceKm?: number) => void;
  onSkipSet: (exerciseIdx: number, setIdx: number) => void;
}

export function SetBySetTracker({
  exercise,
  exerciseIndex,
  currentSetIndex,
  lastExercise,
  onLogSet,
  onSkipSet,
}: SetBySetTrackerProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { setTag } = useActiveWorkout();

  const currentSet = exercise.sets[currentSetIndex];
  const lastSet = lastExercise?.sets[currentSetIndex];

  // Adaptive field detection (Phase D.2)
  const isCardio = exercise.exercise_type === 'cardio';

  /** Cycle the current set's tag */
  const cycleCurrentTag = useCallback(() => {
    const currentTag = currentSet?.set_tag ?? 'normal';
    const nextIdx = (TAG_CYCLE.indexOf(currentTag) + 1) % TAG_CYCLE.length;
    setTag(exerciseIndex, currentSetIndex, TAG_CYCLE[nextIdx]);
  }, [currentSet?.set_tag, exerciseIndex, currentSetIndex, setTag]);

  // Check if exercise is unilateral (needs L/R)
  const { data: catalog } = useExerciseCatalog();
  const catalogEntry = catalog?.find((c) => c.id === exercise.exercise_id);
  const isUnilateral = catalogEntry?.is_unilateral ?? false;
  const totalSets = exercise.sets.length;
  const completedCount = exercise.sets.filter(s => s.completed).length;

  // Strength fields
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  // Cardio fields (Phase D.2)
  const [duration, setDuration] = useState<string>('');
  const [distance, setDistance] = useState<string>('');

  // Auto-fill: plan target > PREVIOUS > empty (industry standard)
  useEffect(() => {
    if (isCardio) {
      setDuration('');
      setDistance('');
      const targetDuration = currentSet?.target_duration_minutes;
      const prevDuration = lastSet?.actual_duration_minutes;
      setDuration((targetDuration ?? prevDuration)?.toString() ?? '');
      const targetDistance = currentSet?.target_distance_km;
      const prevDistance = lastSet?.actual_distance_km;
      setDistance((targetDistance ?? prevDistance)?.toString() ?? '');
    } else {
      setReps('');
      const targetWeight = currentSet?.target_weight_kg;
      const prevWeight = lastSet?.actual_weight_kg;
      setWeight((targetWeight ?? prevWeight)?.toString() ?? '');
    }
  }, [currentSetIndex, isCardio, currentSet?.target_weight_kg, currentSet?.target_duration_minutes, currentSet?.target_distance_km, lastSet?.actual_weight_kg, lastSet?.actual_duration_minutes, lastSet?.actual_distance_km]);

  if (!currentSet) return null;

  // Parse target reps for default (e.g. "8-10" → use 10)
  const parseTargetReps = (target: string): number => {
    const parts = target.split('-');
    return parseInt(parts[parts.length - 1]) || 10;
  };

  const handleDone = () => {
    if (isCardio) {
      const actualDuration = duration ? parseFloat(duration) : (currentSet.target_duration_minutes ?? 0);
      const actualDistance = distance ? parseFloat(distance) : (currentSet.target_distance_km);
      onLogSet(exerciseIndex, currentSetIndex, 1, undefined, undefined, actualDuration, actualDistance);
    } else {
      const actualReps = reps ? parseInt(reps) : parseTargetReps(currentSet.target_reps);
      const actualWeight = weight ? parseFloat(weight) : (currentSet.target_weight_kg ?? lastSet?.actual_weight_kg);
      onLogSet(exerciseIndex, currentSetIndex, actualReps, actualWeight);
    }
  };

  const allDone = exercise.sets.every(s => s.completed || s.skipped);

  return (
    <div className="space-y-4">
      {/* Set progress bar */}
      <div className="flex items-center gap-2">
        {exercise.sets.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-2 rounded-full transition-all ${
                i === currentSetIndex
                  ? 'bg-teal-500 ring-2 ring-teal-200'
                  : s.completed
                    ? 'bg-teal-400'
                    : s.skipped
                      ? 'bg-gray-300'
                      : 'bg-gray-200'
              }`}
            />
            <span className={`text-[10px] font-medium ${
              s.set_tag && s.set_tag !== 'normal'
                ? TAG_CONFIG[s.set_tag].text
                : i === currentSetIndex ? 'text-teal-600' : s.completed ? 'text-teal-400' : 'text-gray-300'
            }`}>
              {s.set_tag && s.set_tag !== 'normal' ? TAG_CONFIG[s.set_tag].letter : i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Current Set Label + Tag Toggle */}
      <div className="flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
          <ArrowRight className="h-3.5 w-3.5" />
          {isDE ? 'Satz' : 'Set'} {currentSetIndex + 1} / {totalSets}
          <span className="text-teal-500 font-normal">
            ({completedCount} {isDE ? 'fertig' : 'done'})
          </span>
        </span>
        {/* Set Tag Toggle — tap to cycle W/D/F */}
        {(() => {
          const tag = currentSet.set_tag ?? 'normal';
          const config = TAG_CONFIG[tag];
          const label = TAG_LABELS[isDE ? 'de' : 'en'][tag];
          return (
            <button
              onClick={cycleCurrentTag}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors border ${
                tag !== 'normal'
                  ? `${config.bg} ${config.text} border-current`
                  : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
              }`}
              title={isDE ? 'Satz-Typ: Normal → Aufwärm → Drop → Failure' : 'Set type: Normal → Warm-up → Drop → Failure'}
            >
              {tag !== 'normal' ? `${config.letter} ${label}` : (isDE ? 'Typ' : 'Type')}
            </button>
          );
        })()}
      </div>

      {/* Target — adaptive for cardio vs strength */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 text-center">
        <p className="text-xs text-teal-500 uppercase tracking-wider mb-1.5 font-medium">
          {isDE ? 'Ziel' : 'Target'}
        </p>
        {isCardio ? (
          <>
            {currentSet.target_duration_minutes != null && (
              <p className="text-3xl font-bold text-teal-700">
                {currentSet.target_duration_minutes} <span className="text-xl font-semibold">Min</span>
              </p>
            )}
            {currentSet.target_distance_km != null && (
              <p className="text-xl font-semibold text-teal-600 mt-1">
                {currentSet.target_distance_km} km
              </p>
            )}
            {currentSet.target_duration_minutes == null && currentSet.target_distance_km == null && (
              <p className="text-lg text-teal-500">{isDE ? 'Freies Cardio' : 'Free Cardio'}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-teal-700">
              {currentSet.target_reps} <span className="text-xl font-semibold">{isDE ? 'Wdh' : 'Reps'}</span>
            </p>
            {currentSet.target_weight_kg != null && (
              <p className="text-xl font-semibold text-teal-600 mt-1">
                @ {currentSet.target_weight_kg} kg
              </p>
            )}
          </>
        )}
      </div>

      {/* Unilateral Hint */}
      {isUnilateral && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
          <ArrowLeftRight className="h-4 w-4 text-indigo-500 flex-shrink-0" />
          <p className="text-xs text-indigo-600 font-medium">
            {isDE
              ? 'Unilaterale Übung — beide Seiten (L/R) trainieren!'
              : 'Unilateral exercise — train both sides (L/R)!'}
          </p>
        </div>
      )}

      {/* PREVIOUS — Last session data (Strong/Hevy format), adaptive for cardio */}
      {lastSet && lastSet.completed && (
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
            {isDE ? 'Vorheriges' : 'Previous'}
          </p>
          <p className="text-sm font-medium text-gray-500 mt-0.5">
            {isCardio ? (
              <>
                {lastSet.actual_duration_minutes != null ? `${lastSet.actual_duration_minutes} Min` : '—'}
                {lastSet.actual_distance_km != null && (
                  <><span className="mx-1.5 text-gray-300">·</span>{lastSet.actual_distance_km} km</>
                )}
              </>
            ) : (
              <>
                {lastSet.actual_weight_kg != null ? `${lastSet.actual_weight_kg} kg` : '—'}
                <span className="mx-1.5 text-gray-300">×</span>
                {lastSet.actual_reps ?? '—'} {isDE ? 'Wdh' : 'reps'}
              </>
            )}
          </p>
        </div>
      )}

      {/* Input Fields — adaptive for cardio (Duration+Distance) vs strength (Reps+Weight) */}
      <div className="grid grid-cols-2 gap-3">
        {isCardio ? (
          <>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">
                {isDE ? 'Dauer (Min)' : 'Duration (min)'}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder={currentSet.target_duration_minutes?.toString() ?? '-'}
                className="w-full px-3 py-3.5 text-center text-xl font-bold border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 bg-white placeholder:text-gray-300 placeholder:font-normal"
              />
              <p className="text-[10px] text-gray-400 mt-1 text-center">
                {isDE ? 'Leer = Ziel übernehmen' : 'Empty = use target'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">
                {isDE ? 'Distanz (km)' : 'Distance (km)'}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                placeholder={currentSet.target_distance_km?.toString() ?? '-'}
                className="w-full px-3 py-3.5 text-center text-xl font-bold border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 bg-white placeholder:text-gray-300 placeholder:font-normal"
              />
              <p className="text-[10px] text-gray-400 mt-1 text-center">
                {isDE ? 'Optional' : 'Optional'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">
                {isDE ? 'Wiederholungen' : 'Reps'}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={e => setReps(e.target.value)}
                placeholder={currentSet.target_reps}
                className="w-full px-3 py-3.5 text-center text-xl font-bold border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 bg-white placeholder:text-gray-300 placeholder:font-normal"
              />
              <p className="text-[10px] text-gray-400 mt-1 text-center">
                {isDE ? 'Leer = Ziel übernehmen' : 'Empty = use target'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">
                {isDE ? 'Gewicht (kg)' : 'Weight (kg)'}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder={currentSet.target_weight_kg?.toString() ?? '-'}
                className="w-full px-3 py-3.5 text-center text-xl font-bold border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 bg-white placeholder:text-gray-300 placeholder:font-normal"
              />
              <p className="text-[10px] text-gray-400 mt-1 text-center">
                {isDE ? 'Leer = Ziel übernehmen' : 'Empty = use target'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Info hint (only for first set) */}
      {currentSetIndex === 0 && !allDone && (
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-500 leading-relaxed">
            {isCardio
              ? (isDE
                ? 'Trage Dauer und optional Distanz ein. Leere Felder übernehmen den Zielwert.'
                : 'Enter duration and optionally distance. Empty fields will use the target value.')
              : (isDE
                ? 'Trage deine Werte ein und drücke „Satz fertig". Leere Felder übernehmen automatisch den Zielwert.'
                : 'Enter your values and press "Set Done". Empty fields will use the target value automatically.')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSkipSet(exerciseIndex, currentSetIndex)}
          className="flex items-center justify-center gap-2 px-5 py-3.5 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
        >
          <SkipForward className="h-4 w-4" />
          {isDE ? 'Skip' : 'Skip'}
        </button>
        <button
          onClick={handleDone}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-base text-white bg-teal-500 rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors font-semibold shadow-sm"
        >
          <Check className="h-5 w-5" strokeWidth={3} />
          {isDE ? `Satz ${currentSetIndex + 1} fertig` : `Set ${currentSetIndex + 1} Done`}
        </button>
      </div>
    </div>
  );
}
