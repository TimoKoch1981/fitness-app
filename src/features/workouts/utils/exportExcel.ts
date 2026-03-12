/**
 * exportExcel — Generates .xlsx from selected workout/health data and triggers download.
 * Uses SheetJS (xlsx) for proper Excel format with multiple worksheets.
 */
import * as XLSX from 'xlsx';

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

export function exportToExcel(data: ExportData, isDE: boolean): void {
  const wb = XLSX.utils.book_new();

  // Workout data (volume, e1rm, prs, frequency)
  if (data.metrics.some(m => ['volume', 'e1rm', 'prs', 'frequency'].includes(m))) {
    const rows: any[][] = [];
    rows.push([
      isDE ? 'Datum' : 'Date',
      isDE ? 'Übung' : 'Exercise',
      isDE ? 'Typ' : 'Type',
      isDE ? 'Sätze' : 'Sets',
      isDE ? 'Wdh' : 'Reps',
      isDE ? 'Gewicht (kg)' : 'Weight (kg)',
      isDE ? 'Volumen (kg)' : 'Volume (kg)',
      'e1RM (kg)',
    ]);

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
        const e1rm = maxWeight > 0 && maxReps > 0 ? Math.round(maxWeight * (1 + maxReps / 30) * 10) / 10 : null;
        const avgReps = workingSets.length > 0 ? Math.round(totalReps / workingSets.length) : 0;

        rows.push([
          w.date, ex.name, ex.exercise_type || 'strength',
          workingSets.length, avgReps, maxWeight,
          Math.round(volume), e1rm,
        ]);
      }
    }

    if (rows.length > 1) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 12 },
        { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, isDE ? 'Training' : 'Workouts');
    }
  }

  // Body composition
  if (data.metrics.includes('bodycomp') && data.bodyData?.length) {
    const rows: any[][] = [
      [isDE ? 'Datum' : 'Date', isDE ? 'Gewicht (kg)' : 'Weight (kg)', isDE ? 'KFA (%)' : 'Body Fat (%)', isDE ? 'Muskelmasse (kg)' : 'Muscle Mass (kg)', 'BMI'],
    ];
    for (const m of data.bodyData) {
      rows.push([m.date, m.weight_kg ?? null, m.body_fat_pct ?? m.body_fat_percentage ?? null, m.muscle_mass_kg ?? null, m.bmi ?? null]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, isDE ? 'Körper' : 'Body');
  }

  // Blood pressure
  if (data.metrics.includes('bp') && data.bpData?.length) {
    const rows: any[][] = [
      [isDE ? 'Datum' : 'Date', isDE ? 'Systolisch' : 'Systolic', isDE ? 'Diastolisch' : 'Diastolic', isDE ? 'Puls' : 'Pulse'],
    ];
    for (const l of data.bpData) {
      rows.push([l.date, l.systolic, l.diastolic, l.pulse ?? null]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, isDE ? 'Blutdruck' : 'Blood Pressure');
  }

  // Sleep
  if (data.metrics.includes('sleep') && data.sleepData?.length) {
    const rows: any[][] = [
      [isDE ? 'Datum' : 'Date', isDE ? 'Dauer (min)' : 'Duration (min)', isDE ? 'Stunden' : 'Hours', isDE ? 'Qualität (1-5)' : 'Quality (1-5)'],
    ];
    for (const l of data.sleepData) {
      const hours = l.duration_minutes ? Math.round((l.duration_minutes / 60) * 10) / 10 : null;
      rows.push([l.date, l.duration_minutes ?? null, hours, l.quality ?? null]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, isDE ? 'Schlaf' : 'Sleep');
  }

  // Blood work
  if (data.metrics.includes('bloodwork') && data.bloodWork?.length) {
    const markers = Object.keys(data.bloodWork[0]).filter(k =>
      k !== 'id' && k !== 'user_id' && k !== 'date' && k !== 'notes' && k !== 'created_at' && k !== 'photo_url'
    );
    const rows: any[][] = [[isDE ? 'Datum' : 'Date', ...markers]];
    for (const l of data.bloodWork) {
      rows.push([l.date, ...markers.map(m => (l as any)[m] ?? null)]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, ...markers.map(() => ({ wch: 14 }))];
    XLSX.utils.book_append_sheet(wb, ws, isDE ? 'Blutwerte' : 'Blood Work');
  }

  // Download
  const filename = `fitbuddy-export-${data.timeRange.from}-${data.timeRange.to}.xlsx`;
  XLSX.writeFile(wb, filename);
}
