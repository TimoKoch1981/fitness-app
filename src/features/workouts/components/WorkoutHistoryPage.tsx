/**
 * WorkoutHistoryPage — Two tabs: individual workouts + per-exercise trends.
 * Can be embedded in WorkoutsTabContent or used as standalone page.
 */

import { useState, useMemo } from 'react';
import {
  Clock, Flame, ChevronDown, ChevronRight,
  TrendingUp, Trophy, Dumbbell, BarChart3,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import {
  useAllWorkoutHistory,
  getExerciseProgress,
  getUniqueExerciseNames,
} from '../hooks/useWorkoutHistory';
import { ExerciseHistoryChart } from './ExerciseHistoryChart';
import type { Workout, WorkoutExerciseResult } from '../../../types/health';

interface WorkoutHistoryPageProps {
  embedded?: boolean;
}

export function WorkoutHistoryPage(_props: WorkoutHistoryPageProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const [tab, setTab] = useState<'sessions' | 'exercises'>('sessions');

  const { data: workouts, isLoading } = useAllWorkoutHistory(100);
  const locale = isDE ? 'de-DE' : 'en-US';

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
      </div>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="h-12 w-12 mx-auto text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm">
          {isDE ? 'Noch keine Trainings dokumentiert' : 'No workouts documented yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTab('sessions')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'sessions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          {isDE ? 'Trainings' : 'Sessions'}
        </button>
        <button
          onClick={() => setTab('exercises')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'exercises' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          {isDE ? 'Übungs-Verlauf' : 'Exercise Trends'}
        </button>
      </div>

      {tab === 'sessions' ? (
        <SessionsList workouts={workouts} locale={locale} isDE={isDE} />
      ) : (
        <ExerciseTrends workouts={workouts} isDE={isDE} />
      )}
    </div>
  );
}

// ── Sessions List ────────────────────────────────────────────────────────

function SessionsList({ workouts, locale, isDE }: { workouts: Workout[]; locale: string; isDE: boolean }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {workouts.map(w => {
        const isOpen = expanded.has(w.id);
        const sessionExercises = w.session_exercises as WorkoutExerciseResult[] | undefined;
        const completedCount = sessionExercises?.filter(e => !e.skipped).length ?? 0;

        return (
          <div key={w.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggle(w.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{w.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(w.date).toLocaleDateString(locale, {
                    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {w.duration_minutes && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" /> {w.duration_minutes}m
                  </span>
                )}
                {w.calories_burned && (
                  <span className="flex items-center gap-1 text-xs text-orange-500">
                    <Flame className="h-3 w-3" /> {w.calories_burned}
                  </span>
                )}
                <span className="text-xs text-gray-300">{completedCount} {isDE ? 'Üb.' : 'Ex.'}</span>
              </div>
            </button>

            {isOpen && sessionExercises && (
              <div className="px-4 pb-4 space-y-1.5 border-t border-gray-50">
                {sessionExercises.map((ex, i) => {
                  if (ex.skipped) {
                    return (
                      <p key={i} className="text-xs text-gray-300 line-through pl-6">{ex.name}</p>
                    );
                  }
                  const completed = ex.sets.filter(s => s.completed);
                  const maxW = completed.length > 0
                    ? Math.max(...completed.map(s => s.actual_weight_kg ?? 0))
                    : 0;
                  const avgR = completed.length > 0
                    ? Math.round(completed.reduce((s, set) => s + (set.actual_reps ?? 0), 0) / completed.length)
                    : 0;

                  return (
                    <div key={i} className="flex items-center justify-between py-1 pl-6">
                      <span className="text-xs text-gray-600 truncate">
                        {ex.is_addition && <span className="text-teal-500">+ </span>}
                        {ex.name}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {completed.length}×{avgR}{maxW > 0 && ` @ ${maxW}kg`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Exercise Trends ──────────────────────────────────────────────────────

function ExerciseTrends({ workouts, isDE }: { workouts: Workout[]; isDE: boolean }) {
  const exerciseNames = useMemo(() => getUniqueExerciseNames(workouts), [workouts]);
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] ?? '');
  const [showVolume, setShowVolume] = useState(false);

  const progressData = useMemo(
    () => selectedExercise ? getExerciseProgress(workouts, selectedExercise) : [],
    [workouts, selectedExercise],
  );

  // Best stats
  const bestWeight = progressData.length > 0 ? Math.max(...progressData.map(p => p.maxWeight)) : 0;
  const bestVolume = progressData.length > 0 ? Math.max(...progressData.map(p => p.totalVolume)) : 0;

  return (
    <div className="space-y-4">
      {/* Exercise Selector */}
      <select
        value={selectedExercise}
        onChange={e => setSelectedExercise(e.target.value)}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {exerciseNames.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {/* Best stats */}
      {progressData.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-teal-50 rounded-lg p-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-teal-600" />
            <div>
              <p className="text-xs text-teal-600">{isDE ? 'Bestes Gewicht' : 'Best Weight'}</p>
              <p className="text-sm font-bold text-teal-700">{bestWeight} kg</p>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            <div>
              <p className="text-xs text-indigo-600">{isDE ? 'Bestes Volumen' : 'Best Volume'}</p>
              <p className="text-sm font-bold text-indigo-700">{bestVolume.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            {isDE ? 'Gewichtsverlauf' : 'Weight Progression'}
          </h3>
          <label className="flex items-center gap-1.5 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={showVolume}
              onChange={e => setShowVolume(e.target.checked)}
              className="w-3 h-3 rounded border-gray-300 text-indigo-500"
            />
            {isDE ? 'Volumen' : 'Volume'}
          </label>
        </div>
        <ExerciseHistoryChart data={progressData} showVolume={showVolume} />
      </div>

      {/* Data table */}
      {progressData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {isDE ? 'Verlauf' : 'History'}
          </h3>
          <div className="space-y-1">
            {[...progressData].reverse().slice(0, 10).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1 text-xs">
                <span className="text-gray-500">{p.date}</span>
                <span className="text-gray-700">
                  {p.totalSets}×{p.avgReps} @ {p.maxWeight}kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
