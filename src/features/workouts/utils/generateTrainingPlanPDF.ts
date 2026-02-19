/**
 * generateTrainingPlanPDF — Generates a printable PDF from a TrainingPlan.
 *
 * Uses jsPDF + jspdf-autotable for clean, formatted tables.
 *
 * @reference docs/PROJEKTPLAN.md — Teil 3: Trainingsplan-PDF
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TrainingPlan, TrainingPlanDay } from '../../../types/health';

const SPLIT_LABELS: Record<string, Record<string, string>> = {
  de: {
    ppl: 'Push/Pull/Legs',
    upper_lower: 'Upper/Lower',
    full_body: 'Ganzkörper',
    custom: 'Custom',
  },
  en: {
    ppl: 'Push/Pull/Legs',
    upper_lower: 'Upper/Lower',
    full_body: 'Full Body',
    custom: 'Custom',
  },
};

/**
 * Generate and download a PDF for the given training plan.
 */
export function generateTrainingPlanPDF(
  plan: TrainingPlan,
  language: 'de' | 'en' = 'de'
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

    // Exercise table
    const tableHeaders = [['#', t.exercise, t.sets, t.reps, t.weight, t.notes]];
    const tableRows = day.exercises.map((ex, idx) => [
      String(idx + 1),
      ex.name,
      String(ex.sets),
      ex.reps,
      ex.weight_kg != null ? `${ex.weight_kg} kg` : '—',
      ex.notes ?? '',
    ]);

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

function addFooter(doc: jsPDF, pageLabel: string, language: string): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageNumber = doc.getNumberOfPages();

  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175); // gray-400

  // Left: App name
  doc.text(
    `FitBuddy — ${language === 'de' ? 'Trainingsplan' : 'Training Plan'}`,
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
