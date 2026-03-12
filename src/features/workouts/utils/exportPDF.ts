/**
 * exportPDF — Generates a PDF report with embedded chart screenshots and data tables.
 * Uses jsPDF + jspdf-autotable + html2canvas.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

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

/**
 * Capture all visible chart elements in the progress dashboard and build a PDF report.
 */
export async function exportToPDF(data: ExportData, isDE: boolean): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - 2 * margin;
  let y = margin;

  // --- Cover / Title ---
  pdf.setFontSize(20);
  pdf.setTextColor(20, 184, 166); // teal-500
  pdf.text('FitBuddy', margin, y + 6);
  pdf.setFontSize(12);
  pdf.setTextColor(100);
  pdf.text(isDE ? 'Fortschrittsbericht' : 'Progress Report', margin + 48, y + 6);
  y += 14;

  pdf.setFontSize(10);
  pdf.setTextColor(120);
  pdf.text(
    `${isDE ? 'Zeitraum' : 'Period'}: ${data.timeRange.from}  –  ${data.timeRange.to}`,
    margin, y
  );
  y += 4;
  pdf.text(
    `${isDE ? 'Erstellt am' : 'Generated on'}: ${new Date().toLocaleDateString(isDE ? 'de-DE' : 'en-US')}`,
    margin, y
  );
  y += 8;

  // Horizontal line
  pdf.setDrawColor(200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageW - margin, y);
  y += 6;

  // --- Capture chart screenshots ---
  // Find chart containers in the DOM
  const chartEls = document.querySelectorAll<HTMLElement>('.bg-white.rounded-xl.shadow-sm');
  if (chartEls.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(50);
    pdf.text(isDE ? 'Grafiken' : 'Charts', margin, y);
    y += 8;

    for (const el of Array.from(chartEls)) {
      try {
        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgW = contentW;
        const imgH = (canvas.height / canvas.width) * imgW;

        // Check if we need a new page
        if (y + imgH + 6 > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH);
        y += imgH + 6;
      } catch {
        // Skip if chart can't be captured
      }
    }
  }

  // --- Data tables ---
  // Training data
  if (data.metrics.some(m => ['volume', 'e1rm', 'prs', 'frequency'].includes(m)) && data.workouts.length > 0) {
    if (y + 30 > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(12);
    pdf.setTextColor(50);
    pdf.text(isDE ? 'Trainingsdaten' : 'Training Data', margin, y);
    y += 4;

    const tableRows: any[][] = [];
    for (const w of data.workouts) {
      const exercises = w.session_exercises || w.exercises || [];
      for (const ex of exercises) {
        if (ex.skipped) continue;
        if (data.exercises.length > 0 && !data.exercises.includes(ex.name)) continue;
        const sets = ex.sets || [];
        const workingSets = sets.filter((s: any) => s.completed && s.set_tag !== 'warmup');
        const maxWeight = Math.max(0, ...workingSets.map((s: any) => s.actual_weight_kg ?? s.weight_kg ?? 0));
        const volume = workingSets.reduce((sum: number, s: any) =>
          sum + ((s.actual_reps ?? s.reps ?? 0) * (s.actual_weight_kg ?? s.weight_kg ?? 0)), 0);
        const maxReps = Math.max(0, ...workingSets.map((s: any) => s.actual_reps ?? s.reps ?? 0));
        const e1rm = maxWeight > 0 && maxReps > 0 ? Math.round(maxWeight * (1 + maxReps / 30) * 10) / 10 : '';
        tableRows.push([w.date, ex.name, workingSets.length, maxWeight, Math.round(volume), e1rm]);
      }
    }

    if (tableRows.length > 0) {
      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [[
          isDE ? 'Datum' : 'Date',
          isDE ? 'Übung' : 'Exercise',
          isDE ? 'Sätze' : 'Sets',
          isDE ? 'Max (kg)' : 'Max (kg)',
          isDE ? 'Volumen (kg)' : 'Volume (kg)',
          'e1RM (kg)',
        ]],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
      y = (pdf as any).lastAutoTable?.finalY ?? y + 20;
      y += 6;
    }
  }

  // Body composition table
  if (data.metrics.includes('bodycomp') && data.bodyData?.length) {
    if (y + 20 > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(12);
    pdf.setTextColor(50);
    pdf.text(isDE ? 'Körperdaten' : 'Body Composition', margin, y);
    y += 4;

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[isDE ? 'Datum' : 'Date', isDE ? 'Gewicht' : 'Weight', isDE ? 'KFA %' : 'BF %', 'BMI']],
      body: data.bodyData.map(m => [
        m.date,
        m.weight_kg != null ? `${m.weight_kg} kg` : '–',
        m.body_fat_pct ?? m.body_fat_percentage ?? '–',
        m.bmi ?? '–',
      ]),
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    y = (pdf as any).lastAutoTable?.finalY ?? y + 20;
    y += 6;
  }

  // Blood pressure table
  if (data.metrics.includes('bp') && data.bpData?.length) {
    if (y + 20 > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(12);
    pdf.setTextColor(50);
    pdf.text(isDE ? 'Blutdruck' : 'Blood Pressure', margin, y);
    y += 4;

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[isDE ? 'Datum' : 'Date', 'Sys', 'Dia', isDE ? 'Puls' : 'Pulse']],
      body: data.bpData.map(l => [l.date, l.systolic, l.diastolic, l.pulse ?? '–']),
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    y = (pdf as any).lastAutoTable?.finalY ?? y + 20;
    y += 6;
  }

  // Sleep table
  if (data.metrics.includes('sleep') && data.sleepData?.length) {
    if (y + 20 > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(12);
    pdf.setTextColor(50);
    pdf.text(isDE ? 'Schlaf' : 'Sleep', margin, y);
    y += 4;

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[isDE ? 'Datum' : 'Date', isDE ? 'Dauer' : 'Duration', isDE ? 'Qualität' : 'Quality']],
      body: data.sleepData.map(l => {
        const hrs = l.duration_minutes ? `${Math.round(l.duration_minutes / 6) / 10}h` : '–';
        return [l.date, hrs, l.quality != null ? `${l.quality}/5` : '–'];
      }),
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    y = (pdf as any).lastAutoTable?.finalY ?? y + 20;
    y += 6;
  }

  // Footer on each page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(180);
    pdf.text(
      `FitBuddy – ${isDE ? 'Seite' : 'Page'} ${i}/${totalPages}`,
      pageW / 2, pdf.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  // Download
  pdf.save(`fitbuddy-report-${data.timeRange.from}-${data.timeRange.to}.pdf`);
}
