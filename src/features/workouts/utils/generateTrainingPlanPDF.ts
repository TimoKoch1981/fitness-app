/**
 * generateTrainingPlanPDF — Generates a printable PDF from a TrainingPlan.
 *
 * Uses jsPDF + jspdf-autotable for clean, formatted tables.
 *
 * Two PDF types:
 * 1. generateTrainingPlanPDF — Clean view of the plan (portrait A4)
 * 2. generateTrainingLogPDF — Soll/Ist logbook with per-set rows + last workout data (landscape A4)
 *
 * @reference docs/PROJEKTPLAN.md — Teil 3: Trainingsplan-PDF
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TrainingPlan, TrainingPlanDay, PlanExercise, WorkoutExerciseResult, Workout } from '../../../types/health';
import { supabase } from '../../../lib/supabase';

/** Detect if an exercise is endurance-type (has duration but no sets) */
function isEnduranceExercise(ex: PlanExercise): boolean {
  return ex.exercise_type === 'cardio' ||
    (ex.duration_minutes != null && ex.sets == null && ex.reps == null);
}

/** Format exercise details for PDF: returns [detail, weight/info] tuple */
function formatExerciseForPDF(ex: PlanExercise, _language?: string): { detail: string; info: string } {
  if (isEnduranceExercise(ex)) {
    const parts: string[] = [];
    if (ex.duration_minutes != null) parts.push(`${ex.duration_minutes} Min`);
    if (ex.distance_km != null) parts.push(`${ex.distance_km} km`);
    if (ex.pace) parts.push(ex.pace);
    const info = ex.intensity ?? '';
    return { detail: parts.join(' / '), info };
  }
  // Strength default
  return {
    detail: `${ex.sets ?? '—'} × ${ex.reps ?? '—'}`,
    info: ex.weight_kg != null ? `${ex.weight_kg} kg` : '—',
  };
}

const SPLIT_LABELS: Record<string, Record<string, string>> = {
  de: {
    ppl: 'Push/Pull/Legs',
    upper_lower: 'Upper/Lower',
    full_body: 'Ganzkörper',
    custom: 'Custom',
    running: 'Laufplan',
    swimming: 'Schwimmplan',
    cycling: 'Radfahrplan',
    yoga: 'Yoga',
    martial_arts: 'Kampfsport',
    mixed: 'Gemischt',
  },
  en: {
    ppl: 'Push/Pull/Legs',
    upper_lower: 'Upper/Lower',
    full_body: 'Full Body',
    custom: 'Custom',
    running: 'Running Plan',
    swimming: 'Swimming Plan',
    cycling: 'Cycling Plan',
    yoga: 'Yoga',
    martial_arts: 'Martial Arts',
    mixed: 'Mixed',
  },
};

/**
 * Generate and download a PDF for the given training plan.
 */
export function generateTrainingPlanPDF(
  plan: TrainingPlan,
  language: string = 'de'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  const t = {
    title: language === 'de' ? 'Trainingsplan' : 'Training Plan',
    split: 'Split',
    frequency: language === 'de' ? 'Frequenz' : 'Frequency',
    perWeek: language === 'de' ? 'x pro Woche' : 'x per week',
    created: language === 'de' ? 'Erstellt am' : 'Created on',
    day: language === 'de' ? 'Tag' : 'Day',
    focus: language === 'de' ? 'Fokus' : 'Focus',
    exercise: language === 'de' ? 'Übung' : 'Exercise',
    sets: language === 'de' ? 'Sätze' : 'Sets',
    reps: language === 'de' ? 'Wdh' : 'Reps',
    weight: language === 'de' ? 'Gewicht' : 'Weight',
    notes: language === 'de' ? 'Notizen' : 'Notes',
    page: language === 'de' ? 'Seite' : 'Page',
  };

  // ── Header ──────────────────────────────────────────────────────────

  // App name
  doc.setFontSize(10);
  doc.setTextColor(20, 184, 166); // teal-500
  doc.text('FitBuddy', margin, yPos);

  // Title
  yPos += 8;
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text(t.title, margin, yPos);

  // Plan name
  yPos += 8;
  doc.setFontSize(14);
  doc.setTextColor(55, 65, 81); // gray-700
  doc.text(plan.name, margin, yPos);

  // Meta info line
  yPos += 7;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // gray-500
  const splitLabel = SPLIT_LABELS[language]?.[plan.split_type] ?? plan.split_type;
  const createdDate = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  doc.text(
    `${t.split}: ${splitLabel}  |  ${t.frequency}: ${plan.days_per_week}${t.perWeek}  |  ${t.created}: ${createdDate}`,
    margin,
    yPos
  );

  if (plan.notes) {
    yPos += 5;
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text(plan.notes, margin, yPos);
  }

  // Separator line
  yPos += 5;
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // ── Day Tables ──────────────────────────────────────────────────────

  const days = (plan.days ?? []).sort((a, b) => a.day_number - b.day_number);

  days.forEach((day: TrainingPlanDay, dayIndex: number) => {
    // Check if we need a new page (if less than 40mm remaining)
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = 20;
    }

    // Day heading
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(`${t.day} ${day.day_number} — ${day.name}`, margin, yPos);

    if (day.focus) {
      yPos += 5;
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`${t.focus}: ${day.focus}`, margin, yPos);
    }

    yPos += 3;

    // Exercise table — adaptive headers based on exercise types
    const hasEndurance = day.exercises.some(isEnduranceExercise);
    const detailHeader = hasEndurance
      ? (language === 'de' ? 'Details' : 'Details')
      : t.sets;
    const infoHeader = hasEndurance
      ? (language === 'de' ? 'Info' : 'Info')
      : t.reps;

    const tableHeaders = [['#', t.exercise, detailHeader, infoHeader, t.weight, t.notes]];
    const tableRows = day.exercises.map((ex, idx) => {
      const fmt = formatExerciseForPDF(ex, language);
      return [
        String(idx + 1),
        ex.name,
        isEnduranceExercise(ex) ? fmt.detail : String(ex.sets ?? '—'),
        isEnduranceExercise(ex) ? fmt.info : (ex.reps ?? '—'),
        isEnduranceExercise(ex) ? (ex.intensity ?? '—') : (ex.weight_kg != null ? `${ex.weight_kg} kg` : '—'),
        ex.notes ?? '',
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: tableHeaders,
      body: tableRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [229, 231, 235],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [20, 184, 166], // teal-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // gray-50
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },   // #
        1: { cellWidth: 55 },                      // Exercise name
        2: { cellWidth: 15, halign: 'center' },    // Sets
        3: { cellWidth: 20, halign: 'center' },    // Reps
        4: { cellWidth: 22, halign: 'center' },    // Weight
        5: { cellWidth: 'auto' },                   // Notes
      },
      didDrawPage: () => {
        // Footer on each page
        addFooter(doc, t.page, language);
      },
    });

    // Update yPos after table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 30;

    if (day.notes) {
      yPos += 3;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(day.notes, margin, yPos);
      yPos += 3;
    }

    // Space between day tables
    if (dayIndex < days.length - 1) {
      yPos += 8;
    }
  });

  // Add footer to last page
  addFooter(doc, t.page, language);

  // ── Download ────────────────────────────────────────────────────────

  const fileName = `Trainingsplan_${plan.name.replace(/[^a-zA-Z0-9äöüÄÖÜ\s-]/g, '').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

// ── Fetch Last Workouts (async, called before PDF generation) ─────────

/** Per-day last workout data: Map<day_number, WorkoutExerciseResult[]> */
export type LastWorkoutsByDay = Map<number, WorkoutExerciseResult[]>;

/**
 * Fetch the most recent workout session for each day in a plan.
 * Returns a Map<day_number, WorkoutExerciseResult[]> with per-set details.
 * Called once before generating the log PDF.
 */
export async function fetchLastWorkoutsForPlan(planId: string, dayNumbers: number[]): Promise<LastWorkoutsByDay> {
  const result: LastWorkoutsByDay = new Map();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return result;

  // Fetch all recent workouts for this plan in one query (sorted newest first)
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_id', planId)
    .not('session_exercises', 'is', null)
    .order('date', { ascending: false })
    .limit(dayNumbers.length * 3); // Fetch enough to cover all days

  if (error || !workouts) return result;

  // For each day_number, find the most recent workout
  for (const dayNum of dayNumbers) {
    const match = (workouts as Workout[]).find(w => w.plan_day_number === dayNum);
    if (match && match.session_exercises) {
      result.set(dayNum, match.session_exercises as WorkoutExerciseResult[]);
    }
  }

  return result;
}

// ── Training LOG PDF ──────────────────────────────────────────────────────
// Printable logbook with Soll (plan) vs. Ist (actual) — PER SET.
// Each strength exercise expands into N rows (one per set).
// Shows per-set "last time" values from the most recent workout.

// Legacy type kept for backwards compatibility
export interface LastExerciseData {
  reps: string;
  weight_kg: number | null;
}

/**
 * Generate a printable TRAINING LOG PDF with per-set rows.
 *
 * For each strength exercise: one row per set showing:
 *   - Set number (S1, S2, ...)
 *   - Target reps + weight from plan (Soll)
 *   - Last workout reps + weight per set (Letztes Mal)
 *   - Blank fields for user to fill in actual values (Ist)
 *
 * For endurance exercises: single row with duration/distance info.
 */
export function generateTrainingLogPDF(
  plan: TrainingPlan,
  lastWorkoutsByDay?: LastWorkoutsByDay,
  language: string = 'de'
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let yPos = 15;

  const isDE = language === 'de';
  const t = {
    title: isDE ? 'Trainingslogbuch' : 'Training Log',
    split: 'Split',
    frequency: isDE ? 'Frequenz' : 'Frequency',
    perWeek: isDE ? 'x pro Woche' : 'x per week',
    date: isDE ? 'Datum' : 'Date',
    day: isDE ? 'Tag' : 'Day',
    focus: isDE ? 'Fokus' : 'Focus',
    exercise: isDE ? 'Übung' : 'Exercise',
    set: isDE ? 'Satz' : 'Set',
    targetReps: isDE ? 'Soll\nWdh' : 'Target\nReps',
    targetWeight: isDE ? 'Soll\nkg' : 'Target\nkg',
    lastReps: isDE ? 'Letzte\nWdh' : 'Last\nReps',
    lastWeight: isDE ? 'Letzte\nkg' : 'Last\nkg',
    actualReps: isDE ? 'Ist\nWdh' : 'Actual\nReps',
    actualWeight: isDE ? 'Ist\nkg' : 'Actual\nkg',
    notes: isDE ? 'Notizen' : 'Notes',
    page: isDE ? 'Seite' : 'Page',
    blank: '',
    skipped: isDE ? 'übersprungen' : 'skipped',
  };

  // ── Header ──────────────────────────────────────────────────────────

  doc.setFontSize(9);
  doc.setTextColor(20, 184, 166);
  doc.text('FitBuddy', margin, yPos);

  yPos += 6;
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text(t.title, margin, yPos);

  // Plan name + date field
  yPos += 7;
  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81);
  doc.text(plan.name, margin, yPos);

  // Date field on the right
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`${t.date}: _______________`, pageWidth - margin - 60, yPos);

  // Meta info
  yPos += 5;
  doc.setFontSize(8);
  const splitLabel = SPLIT_LABELS[language]?.[plan.split_type] ?? plan.split_type;
  doc.text(`${t.split}: ${splitLabel}  |  ${t.frequency}: ${plan.days_per_week}${t.perWeek}`, margin, yPos);

  // Separator
  yPos += 4;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 4;

  // ── Day Tables ──────────────────────────────────────────────────────

  const days = (plan.days ?? []).sort((a, b) => a.day_number - b.day_number);

  days.forEach((day: TrainingPlanDay, dayIndex: number) => {
    // Each day starts on a new page (except the first day which follows the header)
    if (dayIndex > 0) {
      doc.addPage();
      yPos = 15;
    }

    // Day heading
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`${t.day} ${day.day_number} — ${day.name}`, margin, yPos);

    if (day.focus) {
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`  (${t.focus}: ${day.focus})`, margin + doc.getTextWidth(`${t.day} ${day.day_number} — ${day.name}`) + 2, yPos);
    }

    yPos += 2;

    // Get last workout data for this day
    const lastExercises = lastWorkoutsByDay?.get(day.day_number);

    // Table headers: #, Exercise, Set, Soll Wdh, Soll kg, Letzte Wdh, Letzte kg, Ist Wdh, Ist kg, Notizen
    const tableHeaders = [[
      '#', t.exercise, t.set,
      t.targetReps, t.targetWeight,
      t.lastReps, t.lastWeight,
      t.actualReps, t.actualWeight,
      t.notes,
    ]];

    // Build rows — per set for strength, single row for endurance
    const tableRows: string[][] = [];

    day.exercises.forEach((ex, exIdx) => {
      // Find matching exercise from last workout
      const lastEx = lastExercises?.find(
        le => le.plan_exercise_index === exIdx || le.name.toLowerCase() === ex.name.toLowerCase()
      );

      if (isEnduranceExercise(ex)) {
        // Endurance: single row with duration/distance info
        const fmt = formatExerciseForPDF(ex, language);
        const lastInfo = lastEx && !lastEx.skipped
          ? `${lastEx.duration_minutes ?? '—'} min`
          : '—';
        tableRows.push([
          String(exIdx + 1),
          ex.name,
          '—',
          fmt.detail,
          fmt.info || '—',
          lastInfo,
          '—',
          t.blank,
          t.blank,
          t.blank,
        ]);
        return;
      }

      // Strength: one row per set
      const numSets = ex.sets ?? 3;
      for (let s = 0; s < numSets; s++) {
        const lastSet = lastEx?.sets?.[s];
        const hasLastData = lastSet?.completed && !lastSet?.skipped;

        tableRows.push([
          s === 0 ? String(exIdx + 1) : '',           // # only on first set row
          s === 0 ? ex.name : '',                      // Name only on first set row
          `S${s + 1}`,                                 // Set number
          ex.reps ?? '—',                              // Soll Wdh (same for all sets from plan)
          ex.weight_kg != null ? String(ex.weight_kg) : '—',  // Soll kg
          hasLastData ? String(lastSet.actual_reps ?? '—') : '—',     // Letzte Wdh
          hasLastData && lastSet.actual_weight_kg != null
            ? String(lastSet.actual_weight_kg) : '—',                  // Letzte kg
          t.blank,                                     // Ist Wdh (blank for user)
          t.blank,                                     // Ist kg (blank for user)
          s === 0 ? (ex.notes ?? '') : '',             // Notes only on first row
        ]);
      }
    });

    autoTable(doc, {
      startY: yPos,
      head: tableHeaders,
      body: tableRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.15,
        minCellHeight: 6,
      },
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.5,
        halign: 'center',
        minCellHeight: 10,
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },      // #
        1: { cellWidth: 44, fontStyle: 'bold' },                        // Exercise
        2: { cellWidth: 10, halign: 'center', textColor: [107, 114, 128] },  // Set (S1, S2...)
        3: { cellWidth: 16, halign: 'center' },                         // Soll Wdh
        4: { cellWidth: 16, halign: 'center' },                         // Soll kg
        5: { cellWidth: 18, halign: 'center', textColor: [34, 197, 94] },    // Letzte Wdh (green)
        6: { cellWidth: 18, halign: 'center', textColor: [34, 197, 94] },    // Letzte kg (green)
        7: { cellWidth: 22, halign: 'center' },                         // Ist Wdh (blank)
        8: { cellWidth: 22, halign: 'center' },                         // Ist kg (blank)
        9: { cellWidth: 'auto' },                                       // Notes
      },
      // Draw horizontal separator between exercises (thicker line before new exercise)
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const cellText = data.cell.raw as string;
          // If this is the first set row of a new exercise, draw a top border
          if (cellText && cellText !== '' && data.row.index > 0) {
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.4);
            doc.line(
              margin,
              data.cell.y,
              pageWidth - margin,
              data.cell.y
            );
          }
        }
      },
      // Alternate row colors per exercise group (not per row)
      didParseCell: (data) => {
        if (data.section !== 'body') return;

        // Determine which exercise group this row belongs to
        // Count non-empty # cells up to this row to know the exercise index
        let exGroup = 0;
        for (let r = 0; r <= data.row.index; r++) {
          const rowData = tableRows[r];
          if (rowData && rowData[0] !== '') exGroup++;
        }

        // Alternate background per exercise group
        if (exGroup % 2 === 0) {
          data.cell.styles.fillColor = [249, 250, 251]; // gray-50
        } else {
          data.cell.styles.fillColor = [255, 255, 255]; // white
        }

        // Make blank Ist cells have a subtle underline feel
        if ((data.column.index === 7 || data.column.index === 8) && data.cell.raw === '') {
          data.cell.styles.fillColor = [245, 247, 250]; // slightly blue-gray for fill-in fields
        }
      },
      didDrawPage: () => {
        addFooter(doc, t.page, language, true);
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 30;

    if (day.notes) {
      yPos += 2;
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(day.notes, margin, yPos);
      yPos += 2;
    }
  });

  addFooter(doc, t.page, language, true);

  const fileName = `Trainingslog_${plan.name.replace(/[^a-zA-Z0-9äöüÄÖÜ\s-]/g, '').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

function addFooter(doc: jsPDF, pageLabel: string, language: string, isLog = false): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageNumber = doc.getNumberOfPages();

  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175); // gray-400

  // Left: App name
  const label = isLog
    ? (language === 'de' ? 'Trainingslogbuch' : 'Training Log')
    : (language === 'de' ? 'Trainingsplan' : 'Training Plan');
  doc.text(
    `FitBuddy — ${label}`,
    15,
    pageHeight - 8
  );

  // Right: Page number
  doc.text(
    `${pageLabel} ${pageNumber}`,
    pageWidth - 15,
    pageHeight - 8,
    { align: 'right' }
  );
}
