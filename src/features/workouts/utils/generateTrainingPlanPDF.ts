/**
 * generateTrainingPlanPDF — Generates a printable PDF from a TrainingPlan.
 *
 * Uses jsPDF + jspdf-autotable for clean, formatted tables.
 *
 * @reference docs/PROJEKTPLAN.md — Teil 3: Trainingsplan-PDF
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TrainingPlan, TrainingPlanDay, PlanExercise } from '../../../types/health';

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

// ── Training LOG PDF ──────────────────────────────────────────────────────
// Printable logbook with Soll (plan) values + empty fields for Ist (actual)
// + optional "last time" values from previous workouts.

export interface LastExerciseData {
  reps: string;
  weight_kg: number | null;
}

/**
 * Generate a printable TRAINING LOG PDF.
 * Shows plan values (target reps/weight), optional last-workout values,
 * and blank fields for the user to fill in actual reps/weight by hand.
 */
export function generateTrainingLogPDF(
  plan: TrainingPlan,
  lastWorkouts?: Map<string, LastExerciseData>,
  language: string = 'de'
): void {
  const doc = new jsPDF({
    orientation: 'landscape', // Landscape for more columns
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let yPos = 15;

  const t = {
    title: language === 'de' ? 'Trainingslogbuch' : 'Training Log',
    split: 'Split',
    frequency: language === 'de' ? 'Frequenz' : 'Frequency',
    perWeek: language === 'de' ? 'x pro Woche' : 'x per week',
    date: language === 'de' ? 'Datum' : 'Date',
    day: language === 'de' ? 'Tag' : 'Day',
    focus: language === 'de' ? 'Fokus' : 'Focus',
    exercise: language === 'de' ? 'Übung' : 'Exercise',
    targetReps: language === 'de' ? 'Soll\nWdh' : 'Target\nReps',
    targetWeight: language === 'de' ? 'Soll\nGew.' : 'Target\nWeight',
    lastTime: language === 'de' ? 'Letztes\nMal' : 'Last\nTime',
    actualReps: language === 'de' ? 'Ist Wdh' : 'Actual Reps',
    actualWeight: language === 'de' ? 'Ist Gew.' : 'Actual Wt.',
    notes: language === 'de' ? 'Notizen' : 'Notes',
    page: language === 'de' ? 'Seite' : 'Page',
    blankField: '________',
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
    if (yPos > doc.internal.pageSize.getHeight() - 35) {
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

    // Table headers: #, Exercise, Target Reps, Target Weight, Last Time, Actual Reps, Actual Weight, Notes
    const tableHeaders = [['#', t.exercise, t.targetReps, t.targetWeight, t.lastTime, t.actualReps, t.actualWeight, t.notes]];

    const tableRows = day.exercises.map((ex, idx) => {
      const lastData = lastWorkouts?.get(ex.name.toLowerCase());
      const lastTimeStr = lastData
        ? `${lastData.reps}${lastData.weight_kg != null ? ` × ${lastData.weight_kg}kg` : ''}`
        : '—';

      // Adaptive format for endurance exercises
      if (isEnduranceExercise(ex)) {
        const fmt = formatExerciseForPDF(ex, language);
        return [
          String(idx + 1),
          ex.name,
          fmt.detail,
          fmt.info || '—',
          lastTimeStr,
          t.blankField,
          t.blankField,
          t.blankField,
        ];
      }

      return [
        String(idx + 1),
        ex.name,
        ex.reps ?? '—',
        ex.weight_kg != null ? `${ex.weight_kg} kg` : '—',
        lastTimeStr,
        t.blankField,
        t.blankField,
        t.blankField,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: tableHeaders,
      body: tableRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [200, 200, 200],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },     // #
        1: { cellWidth: 50 },                        // Exercise
        2: { cellWidth: 20, halign: 'center' },      // Target Reps
        3: { cellWidth: 20, halign: 'center' },      // Target Weight
        4: { cellWidth: 28, halign: 'center', textColor: [107, 114, 128] },  // Last Time (gray)
        5: { cellWidth: 28, halign: 'center' },      // Actual Reps (blank)
        6: { cellWidth: 28, halign: 'center' },      // Actual Weight (blank)
        7: { cellWidth: 'auto' },                    // Notes (blank)
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

    if (dayIndex < days.length - 1) {
      yPos += 6;
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
