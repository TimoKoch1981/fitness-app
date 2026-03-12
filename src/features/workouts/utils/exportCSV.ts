/**
 * exportCSV — Generates CSV from selected workout/health data and triggers download.
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

export function exportToCSV(data: ExportData, isDE: boolean): void {
  const sections: string[] = [];
  const sep = ';';

  // Workout data (volume, e1rm, prs, frequency)
  if (data.metrics.some(m => ['volume', 'e1rm', 'prs', 'frequency'].includes(m))) {
    const header = ['Datum', '\u00dcbung', 'Typ', 'S\u00e4tze', 'Wdh', 'Gewicht_kg', 'Volumen_kg', 'e1RM_kg'].join(sep);
    sections.push(isDE ? '# Trainingsdaten' : '# Training Data');
    sections.push(header);

    for (const w of data.workouts) {
      const exercises = w.session_exercises || w.exercises || [];
      for (const ex of exercises) {
        if (ex.skipped) continue;
        if (data.exercises.length > 0 && !data.exercises.includes(ex.name)) continue;
        const sets = ex.sets || [];
        const workingSets = sets.filter((s: any) => s.completed && s.set_tag !== 'warmup');
        const totalReps = workingSets.reduce((sum: number, s: any) => sum + (s.actual_reps ?? s.reps ?? 0), 0);
        const maxWeight = Math.max(0, ...workingSets.map((s: any) => s.actual_weight_kg ?? s.weight_kg ?? 0));
        const volume = workingSets.reduce((sum: number, s: any) =>
          sum + ((s.actual_reps ?? s.reps ?? 0) * (s.actual_weight_kg ?? s.weight_kg ?? 0)), 0);
        const maxReps = Math.max(0, ...workingSets.map((s: any) => s.actual_reps ?? s.reps ?? 0));
        const e1rm = maxWeight > 0 && maxReps > 0 ? Math.round(maxWeight * (1 + maxReps / 30) * 10) / 10 : '';
        const avgReps = workingSets.length > 0 ? Math.round(totalReps / workingSets.length) : 0;

        sections.push([
          w.date, ex.name, ex.exercise_type || 'strength',
          workingSets.length, avgReps, maxWeight,
          Math.round(volume), e1rm
        ].join(sep));
      }
    }
    sections.push('');
  }

  // Body composition
  if (data.metrics.includes('bodycomp') && data.bodyData?.length) {
    sections.push(isDE ? '# K\u00f6rperdaten' : '# Body Composition');
    sections.push(['Datum', 'Gewicht_kg', 'KFA_%', 'Muskelmasse_kg', 'BMI'].join(sep));
    for (const m of data.bodyData) {
      sections.push([m.date, m.weight_kg ?? '', m.body_fat_pct ?? m.body_fat_percentage ?? '', m.muscle_mass_kg ?? '', m.bmi ?? ''].join(sep));
    }
    sections.push('');
  }

  // Blood pressure
  if (data.metrics.includes('bp') && data.bpData?.length) {
    sections.push(isDE ? '# Blutdruck' : '# Blood Pressure');
    sections.push(['Datum', 'Systolisch', 'Diastolisch', 'Puls'].join(sep));
    for (const l of data.bpData) {
      sections.push([l.date, l.systolic, l.diastolic, l.pulse ?? ''].join(sep));
    }
    sections.push('');
  }

  // Sleep
  if (data.metrics.includes('sleep') && data.sleepData?.length) {
    sections.push(isDE ? '# Schlaf' : '# Sleep');
    sections.push(['Datum', 'Dauer_min', 'Qualit\u00e4t_1-5'].join(sep));
    for (const l of data.sleepData) {
      sections.push([l.date, l.duration_minutes ?? '', l.quality ?? ''].join(sep));
    }
    sections.push('');
  }

  // Blood work
  if (data.metrics.includes('bloodwork') && data.bloodWork?.length) {
    sections.push(isDE ? '# Blutwerte' : '# Blood Work');
    const markers = Object.keys(data.bloodWork[0]).filter(k =>
      k !== 'id' && k !== 'user_id' && k !== 'date' && k !== 'notes' && k !== 'created_at' && k !== 'photo_url'
    );
    sections.push(['Datum', ...markers].join(sep));
    for (const l of data.bloodWork) {
      sections.push([l.date, ...markers.map(m => (l as any)[m] ?? '')].join(sep));
    }
    sections.push('');
  }

  // Trigger download
  const csv = sections.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitbuddy-export-${data.timeRange.from}-${data.timeRange.to}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
