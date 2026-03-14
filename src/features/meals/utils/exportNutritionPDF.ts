/**
 * exportNutritionPDF — Generates a PDF report for nutrition history + energy balance.
 * Uses jsPDF + jspdf-autotable.
 *
 * NOTE: jsPDF default fonts only support latin-1. Avoid Unicode symbols
 * like Σ, Ø, emojis etc. — use ASCII alternatives instead.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MealHistoryData } from '../hooks/useMealHistory';
import type { NutritionBalanceData } from '../hooks/useNutritionBalance';
import type { ScoringResult } from '../../nutrition/utils/alternativeScoring';

interface NutritionExportData {
  timeRange: { from: string; to: string };
  history: MealHistoryData;
  balanceData?: NutritionBalanceData;
  metrics: string[];
  dayScores?: Map<string, ScoringResult>;
  avgScores?: ScoringResult;
}

export function exportNutritionPDF(data: NutritionExportData, isDE: boolean): void {
  const { history, balanceData, metrics, dayScores, avgScores } = data;
  const hasBalance = balanceData?.hasProfile && (metrics.includes('expenditure') || metrics.includes('balance'));
  const hasWWSmart = metrics.includes('wwSmartPoints') && dayScores;
  const hasWWClassic = metrics.includes('wwClassic') && dayScores;
  const hasNoom = metrics.includes('noom') && dayScores;
  const hasNutriScore = metrics.includes('nutriScore') && dayScores;
  const hasAnyScoring = hasWWSmart || hasWWClassic || hasNoom || hasNutriScore;
  const pdf = new jsPDF({ orientation: (hasBalance || hasAnyScoring) ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  // --- Cover / Title ---
  pdf.setFontSize(20);
  pdf.setTextColor(20, 184, 166);
  pdf.text('FitBuddy', margin, y + 6);
  pdf.setFontSize(12);
  pdf.setTextColor(100);
  pdf.text(isDE ? 'Ernaehrungsbericht' : 'Nutrition Report', margin + 48, y + 6);
  y += 14;

  pdf.setFontSize(10);
  pdf.setTextColor(120);
  pdf.text(
    `${isDE ? 'Zeitraum' : 'Period'}: ${data.timeRange.from}  -  ${data.timeRange.to}`,
    margin, y
  );
  y += 4;
  pdf.text(
    `${isDE ? 'Erstellt am' : 'Generated on'}: ${new Date().toLocaleDateString(isDE ? 'de-DE' : 'en-US')}`,
    margin, y
  );
  y += 8;

  pdf.setDrawColor(200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  // --- Averages Summary ---
  if (history.daysWithData > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(50);
    pdf.text(isDE ? 'Tagesdurchschnitt' : 'Daily Averages', margin, y);
    y += 6;

    const summaryHeaders: string[] = [];
    const summaryRow: (string | number)[] = [];

    if (metrics.includes('calories')) {
      summaryHeaders.push(isDE ? 'Aufnahme' : 'Intake');
      summaryRow.push(`${history.averages.calories} kcal`);
    }
    if (hasBalance && balanceData) {
      summaryHeaders.push(isDE ? 'Verbrauch' : 'Expend.');
      summaryRow.push(`${balanceData.averages.expenditure} kcal`);
      summaryHeaders.push(isDE ? 'Bilanz' : 'Balance');
      summaryRow.push(`${balanceData.averages.balance > 0 ? '+' : ''}${balanceData.averages.balance} kcal`);
    }
    if (metrics.includes('protein')) {
      summaryHeaders.push('Protein');
      summaryRow.push(`${history.averages.protein}g`);
    }
    if (metrics.includes('carbs')) {
      summaryHeaders.push(isDE ? 'KH' : 'Carbs');
      summaryRow.push(`${history.averages.carbs}g`);
    }
    if (metrics.includes('fat')) {
      summaryHeaders.push(isDE ? 'Fett' : 'Fat');
      summaryRow.push(`${history.averages.fat}g`);
    }
    // Scoring averages in summary
    if (hasWWSmart && avgScores) {
      summaryHeaders.push('WW Smart');
      summaryRow.push(`${avgScores.wwPoints}`);
    }
    if (hasWWClassic && avgScores) {
      summaryHeaders.push('WW Classic');
      summaryRow.push(`${avgScores.wwClassicPoints}`);
    }
    if (hasNoom && avgScores) {
      summaryHeaders.push('Noom');
      const colorLabel = avgScores.noomColor === 'green'
        ? (isDE ? 'Gruen' : 'Green')
        : avgScores.noomColor === 'yellow'
          ? (isDE ? 'Gelb' : 'Yellow')
          : (isDE ? 'Rot' : 'Red');
      summaryRow.push(colorLabel);
    }
    if (hasNutriScore && avgScores) {
      summaryHeaders.push('Nutri');
      summaryRow.push(avgScores.nutriScoreGrade);
    }

    if (summaryHeaders.length > 0) {
      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [summaryHeaders],
        body: [summaryRow],
        styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
        headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
      });
      y = (pdf as any).lastAutoTable?.finalY ?? y + 20;
      y += 6;
    }

    // BMR/TDEE info line
    if (hasBalance && balanceData) {
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `BMR: ${balanceData.bmr} kcal | ${isDE ? 'Aktivitaet' : 'Activity'}: ${balanceData.tdee - balanceData.bmr} kcal | TDEE: ${balanceData.tdee} kcal`,
        margin, y
      );
      y += 6;
    }
  }

  // --- Daily Breakdown Table ---
  if (history.days.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(50);
    pdf.text(isDE ? 'Tagesuebersicht' : 'Daily Overview', margin, y);
    y += 4;

    const headers: string[] = [isDE ? 'Datum' : 'Date'];
    if (metrics.includes('calories')) headers.push(isDE ? 'Aufn.' : 'Intake');
    if (metrics.includes('protein')) headers.push('P (g)');
    if (metrics.includes('carbs')) headers.push(isDE ? 'KH (g)' : 'C (g)');
    if (metrics.includes('fat')) headers.push(isDE ? 'Fett (g)' : 'F (g)');
    if (metrics.includes('mealCount')) headers.push(isDE ? 'Mahlz.' : 'Meals');
    if (hasBalance && metrics.includes('expenditure')) {
      headers.push(isDE ? 'Verbr.' : 'Exp.');
      headers.push('Train.');
    }
    if (hasBalance && metrics.includes('balance')) headers.push(isDE ? 'Bilanz' : 'Bal.');
    if (hasWWSmart) headers.push('WW');
    if (hasWWClassic) headers.push('WWC');
    if (hasNoom) headers.push('Noom');
    if (hasNutriScore) headers.push('NS');

    const days = hasBalance && balanceData ? balanceData.days : history.days;
    const tableRows: (string | number)[][] = [];

    for (const day of days) {
      const row: (string | number)[] = [day.date];
      if (metrics.includes('calories')) row.push(day.calories);
      if (metrics.includes('protein')) row.push(Math.round(day.protein));
      if (metrics.includes('carbs')) row.push(Math.round(day.carbs));
      if (metrics.includes('fat')) row.push(Math.round(day.fat));
      if (metrics.includes('mealCount')) row.push(day.mealCount);
      if (hasBalance && metrics.includes('expenditure') && 'totalExpenditure' in day) {
        row.push((day as any).totalExpenditure);
        row.push((day as any).workoutCalories || 0);
      }
      if (hasBalance && metrics.includes('balance') && 'balance' in day) {
        const bal = (day as any).balance;
        row.push(`${bal > 0 ? '+' : ''}${bal}`);
      }
      // Scoring
      const ds = dayScores?.get(day.date);
      if (hasWWSmart) row.push(ds?.wwPoints ?? '');
      if (hasWWClassic) row.push(ds?.wwClassicPoints ?? '');
      if (hasNoom) {
        const c = ds?.noomColor;
        row.push(c ? (c === 'green' ? 'G' : c === 'yellow' ? 'Y' : 'R') : '');
      }
      if (hasNutriScore) row.push(ds?.nutriScoreGrade ?? '');
      tableRows.push(row);
    }

    // Total row
    const totalRow: (string | number)[] = [isDE ? 'Gesamt' : 'Total'];
    if (metrics.includes('calories')) totalRow.push(history.totals.calories);
    if (metrics.includes('protein')) totalRow.push(Math.round(history.totals.protein));
    if (metrics.includes('carbs')) totalRow.push(Math.round(history.totals.carbs));
    if (metrics.includes('fat')) totalRow.push(Math.round(history.totals.fat));
    if (metrics.includes('mealCount')) {
      totalRow.push(history.days.reduce((sum, d) => sum + d.mealCount, 0));
    }
    if (hasBalance && metrics.includes('expenditure') && balanceData) {
      totalRow.push(balanceData.days.reduce((sum, d) => sum + d.totalExpenditure, 0));
      totalRow.push(balanceData.days.reduce((sum, d) => sum + d.workoutCalories, 0));
    }
    if (hasBalance && metrics.includes('balance') && balanceData) {
      const totalBal = balanceData.days.reduce((sum, d) => sum + d.balance, 0);
      totalRow.push(`${totalBal > 0 ? '+' : ''}${totalBal}`);
    }
    // Scoring totals (sum points, n/a for colors)
    if (hasWWSmart && dayScores) {
      totalRow.push(Array.from(dayScores.values()).reduce((s, v) => s + v.wwPoints, 0));
    }
    if (hasWWClassic && dayScores) {
      totalRow.push(Array.from(dayScores.values()).reduce((s, v) => s + v.wwClassicPoints, 0));
    }
    if (hasNoom) totalRow.push('');
    if (hasNutriScore) totalRow.push('');
    tableRows.push(totalRow);

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [headers],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.row.index === tableRows.length - 1) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = [230, 245, 243];
        }
      },
    });
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(180);
    pdf.text(
      `FitBuddy - ${isDE ? 'Seite' : 'Page'} ${i}/${totalPages}`,
      pageW / 2, pdf.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  pdf.save(`fitbuddy-ernaehrung-${data.timeRange.from}-${data.timeRange.to}.pdf`);
}
