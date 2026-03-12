/**
 * exportJSON — Exports workout/health data as JSON and triggers download.
 */

interface ExportData {
  timeRange: { from: string; to: string };
  workouts: any[];
  metrics: string[];
  exercises: string[];
  bodyData?: any[];
  bpData?: any[];
  bloodWork?: any[];
  sleepData?: any[];
}

export function exportToJSON(data: ExportData): void {
  const exportObj: Record<string, any> = {
    exportDate: new Date().toISOString(),
    timeRange: data.timeRange,
    selectedMetrics: data.metrics,
  };

  if (data.metrics.some(m => ['volume', 'e1rm', 'prs', 'frequency'].includes(m))) {
    exportObj.workouts = data.workouts.map(w => ({
      date: w.date,
      name: w.name,
      type: w.type,
      duration_minutes: w.duration_minutes,
      calories_burned: w.calories_burned,
      exercises: (w.session_exercises || w.exercises || [])
        .filter((ex: any) => !ex.skipped && (data.exercises.length === 0 || data.exercises.includes(ex.name)))
        .map((ex: any) => ({
          name: ex.name,
          type: ex.exercise_type,
          sets: (ex.sets || []).map((s: any) => ({
            reps: s.actual_reps ?? s.reps,
            weight_kg: s.actual_weight_kg ?? s.weight_kg,
            tag: s.set_tag,
            completed: s.completed,
          })),
        })),
    }));
  }

  if (data.metrics.includes('bodycomp') && data.bodyData?.length) {
    exportObj.bodyComposition = data.bodyData;
  }
  if (data.metrics.includes('bp') && data.bpData?.length) {
    exportObj.bloodPressure = data.bpData;
  }
  if (data.metrics.includes('sleep') && data.sleepData?.length) {
    exportObj.sleep = data.sleepData;
  }
  if (data.metrics.includes('bloodwork') && data.bloodWork?.length) {
    exportObj.bloodWork = data.bloodWork;
  }

  const json = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitbuddy-export-${data.timeRange.from}-${data.timeRange.to}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
