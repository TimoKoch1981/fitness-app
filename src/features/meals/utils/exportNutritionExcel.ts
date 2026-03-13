/**
 * exportNutritionExcel — Generates .xlsx from nutrition history + energy balance.
 * Uses SheetJS (xlsx) — same library as workout exports.
 */
import * as XLSX from 'xlsx';
import type { MealHistoryData } from '../hooks/useMealHistory';
import type { NutritionBalanceData } from '../hooks/useNutritionBalance';

interface NutritionExportData {
  timeRange: { from: string; to: string };
  history: MealHistoryData;
  balanceData?: NutritionBalanceData;
  metrics: string[];
}

export function exportNutritionExcel(data: NutritionExportData, isDE: boolean): void {
  const wb = XLSX.utils.book_new();
  const { history, balanceData, metrics } = data;
  const hasBalance = balanceData?.hasProfile && (metrics.includes('expenditure') || metrics.includes('balance'));

  // --- Daily Data Sheet ---
  const headers: string[] = [isDE ? 'Datum' : 'Date'];
  if (metrics.includes('calories')) headers.push(isDE ? 'Aufnahme (kcal)' : 'Intake (kcal)');
  if (metrics.includes('protein')) headers.push(isDE ? 'Protein (g)' : 'Protein (g)');
  if (metrics.includes('carbs')) headers.push(isDE ? 'Kohlenhydrate (g)' : 'Carbs (g)');
  if (metrics.includes('fat')) headers.push(isDE ? 'Fett (g)' : 'Fat (g)');
  if (metrics.includes('mealCount')) headers.push(isDE ? 'Mahlzeiten' : 'Meals');
  if (hasBalance && metrics.includes('expenditure')) {
    headers.push(isDE ? 'Verbrauch (kcal)' : 'Expenditure (kcal)');
    headers.push('BMR');
    headers.push(isDE ? 'Aktivität' : 'Activity');
    headers.push('Training');
  }
  if (hasBalance && metrics.includes('balance')) headers.push(isDE ? 'Bilanz (kcal)' : 'Balance (kcal)');

  const rows: (string | number | null)[][] = [headers];

  // Use balanceData.days if available (has expenditure info), otherwise history.days
  const days = hasBalance && balanceData ? balanceData.days : history.days;

  for (const day of days) {
    const row: (string | number | null)[] = [day.date];
    if (metrics.includes('calories')) row.push(day.calories);
    if (metrics.includes('protein')) row.push(Math.round(day.protein));
    if (metrics.includes('carbs')) row.push(Math.round(day.carbs));
    if (metrics.includes('fat')) row.push(Math.round(day.fat));
    if (metrics.includes('mealCount')) row.push(day.mealCount);
    if (hasBalance && metrics.includes('expenditure') && 'totalExpenditure' in day) {
      row.push((day as any).totalExpenditure);
      row.push((day as any).bmr);
      row.push((day as any).activityCalories);
      row.push((day as any).workoutCalories);
    }
    if (hasBalance && metrics.includes('balance') && 'balance' in day) {
      row.push((day as any).balance);
    }
    rows.push(row);
  }

  // Add averages row
  if (history.daysWithData > 0) {
    rows.push([]); // separator
    const avgRow: (string | number | null)[] = [isDE ? 'Durchschnitt' : 'Average'];
    if (metrics.includes('calories')) avgRow.push(history.averages.calories);
    if (metrics.includes('protein')) avgRow.push(history.averages.protein);
    if (metrics.includes('carbs')) avgRow.push(history.averages.carbs);
    if (metrics.includes('fat')) avgRow.push(history.averages.fat);
    if (metrics.includes('mealCount')) avgRow.push(history.averages.mealsPerDay);
    if (hasBalance && metrics.includes('expenditure') && balanceData) {
      avgRow.push(balanceData.averages.expenditure);
      avgRow.push(balanceData.bmr);
      avgRow.push(balanceData.tdee - balanceData.bmr);
      avgRow.push(null); // avg workout varies
    }
    if (hasBalance && metrics.includes('balance') && balanceData) {
      avgRow.push(balanceData.averages.balance);
    }
    rows.push(avgRow);

    // Totals row
    const totalRow: (string | number | null)[] = [isDE ? 'Gesamt' : 'Total'];
    if (metrics.includes('calories')) totalRow.push(history.totals.calories);
    if (metrics.includes('protein')) totalRow.push(Math.round(history.totals.protein));
    if (metrics.includes('carbs')) totalRow.push(Math.round(history.totals.carbs));
    if (metrics.includes('fat')) totalRow.push(Math.round(history.totals.fat));
    if (metrics.includes('mealCount')) {
      totalRow.push(history.days.reduce((sum, d) => sum + d.mealCount, 0));
    }
    if (hasBalance && metrics.includes('expenditure') && balanceData) {
      const totalExp = balanceData.days.reduce((sum, d) => sum + d.totalExpenditure, 0);
      const totalWk = balanceData.days.reduce((sum, d) => sum + d.workoutCalories, 0);
      totalRow.push(totalExp);
      totalRow.push(balanceData.bmr * history.daysWithData);
      totalRow.push((balanceData.tdee - balanceData.bmr) * history.daysWithData);
      totalRow.push(totalWk);
    }
    if (hasBalance && metrics.includes('balance') && balanceData) {
      totalRow.push(balanceData.days.reduce((sum, d) => sum + d.balance, 0));
    }
    rows.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = headers.map((_, i) => ({ wch: i === 0 ? 14 : 16 }));
  XLSX.utils.book_append_sheet(wb, ws, isDE ? 'Ernährung' : 'Nutrition');

  // Download
  const filename = `fitbuddy-ernaehrung-${data.timeRange.from}-${data.timeRange.to}.xlsx`;
  XLSX.writeFile(wb, filename);
}
