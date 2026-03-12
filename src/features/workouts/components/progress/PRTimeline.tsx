/**
 * PRTimeline — Personal records displayed as a timeline.
 */
import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import type { TimeRange } from './TimeRangeSelector';

interface PRTimelineProps {
  workouts: any[];
  timeRange: TimeRange;
}

interface PR {
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  estimated1RM: number;
}

export function PRTimeline({ workouts, timeRange }: PRTimelineProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const prs = useMemo(() => {
    if (!workouts?.length) return [];

    // Track best e1RM per exercise, detect when new PR is set
    const bestByExercise = new Map<string, number>();
    const prList: PR[] = [];

    // Sort oldest first
    const sorted = [...workouts]
      .filter(w => w.date >= timeRange.from && w.date <= timeRange.to)
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const w of sorted) {
      const exercises = w.session_exercises || w.exercises || [];
      for (const ex of exercises) {
        if (ex.skipped || ex.exercise_type === 'cardio') continue;
        const sets = ex.sets || [];
        for (const s of sets) {
          if (!s.completed || s.set_tag === 'warmup') continue;
          const weight = s.actual_weight_kg ?? s.weight_kg ?? 0;
          const reps = s.actual_reps ?? s.reps ?? 0;
          if (weight <= 0 || reps <= 0) continue;
          const e1rm = weight * (1 + reps / 30); // Epley formula
          const prev = bestByExercise.get(ex.name) ?? 0;
          if (e1rm > prev) {
            bestByExercise.set(ex.name, e1rm);
            if (prev > 0) { // Not the very first entry
              prList.push({ date: w.date, exercise: ex.name, weight, reps, estimated1RM: e1rm });
            }
          }
        }
      }
    }

    return prList.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  }, [workouts, timeRange]);

  if (prs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          <Trophy className="h-4 w-4 inline text-yellow-500 mr-1" />
          {isDE ? 'Bestleistungen' : 'Personal Records'}
        </h4>
        <p className="text-sm text-gray-400 py-4 text-center">
          {isDE ? 'Noch keine PRs im gew\u00e4hlten Zeitraum' : 'No PRs in selected period'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        <Trophy className="h-4 w-4 inline text-yellow-500 mr-1" />
        {isDE ? 'Bestleistungen' : 'Personal Records'}
        <span className="text-xs text-gray-400 ml-1">({prs.length})</span>
      </h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {prs.map((pr, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-[10px] text-gray-400 w-16 flex-shrink-0">{pr.date.slice(5)}</span>
            <span className="text-xs text-gray-700 flex-1 truncate">{pr.exercise}</span>
            <span className="text-xs font-bold text-yellow-600">{pr.weight}kg \u00d7{pr.reps}</span>
            <span className="text-[10px] text-gray-400">e1RM {Math.round(pr.estimated1RM)}kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}
