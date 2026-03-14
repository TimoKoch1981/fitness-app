/**
 * exportNutritionExcel — Generates .xlsx from nutrition history + energy balance.
 * Uses SheetJS (xlsx) — same library as workout exports.
 */
import * as XLSX from 'xlsx';
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

export function exportNutritionExcel(data: NutritionExportData, isDE: boolean): void {
  const wb = XLSX.utils.book_new();
  const { history, balanceData, metrics, dayScores, avgScores } = data;
  const hasBalance = balanceData?.hasProfile && (metrics.includes('expenditure') || metrics.includes('balance'));

  // Scoring flags
  const hasWWSmart = metrics.includes('wwSmartPoints') && dayScores;
  const hasWWClassic = metrics.includes('wwClassic') && dayScores;
  const hasNoom = metrics.includes('noom') && dayScores;
  const hasNutriScore = metrics.includes('nutriScore') && dayScores;

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
  if (hasWWSmart) headers.push('WW SmartPoints');
  if (hasWWClassic) headers.push(isDE ? 'WW Klassisch' : 'WW Classic');
  if (hasNoom) headers.push(isDE ? 'Noom Farbe' : 'Noom Color');
  if (hasNoom) headers.push(isDE ? 'Kaloriendichte' : 'Cal. Density');
  if (hasNutriScore) headers.push('Nutri-Score');

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
    // Scoring columns
    const ds = dayScores?.get(day.date);
    if (hasWWSmart) row.push(ds?.wwPoints ?? '');
    if (hasWWClassic) row.push(ds?.wwClassicPoints ?? '');
    if (hasNoom) {
      row.push(ds ? (isDE
        ? (ds.noomColor === 'green' ? 'Gruen' : ds.noomColor === 'yellow' ? 'Gelb' : 'Rot')
        : (ds.noomColor === 'green' ? 'Green' : ds.noomColor === 'yellow' ? 'Yellow' : 'Red')
      ) : '');
      row.push(ds?.noomCalorieDensity ?? '');
    }
    if (hasNutriScore) row.push(ds?.nutriScoreGrade ?? '');
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
    // Scoring averages
    if (hasWWSmart) avgRow.push(avgScores?.wwPoints ?? '');
    if (hasWWClassic) avgRow.push(avgScores?.wwClassicPoints ?? '');
    if (hasNoom) {
      avgRow.push(avgScores ? (isDE
        ? (avgScores.noomColor === 'green' ? 'Gruen' : avgScores.noomColor === 'yellow' ? 'Gelb' : 'Rot')
        : (avgScores.noomColor === 'green' ? 'Green' : avgScores.noomColor === 'yellow' ? 'Yellow' : 'Red')
      ) : '');
      avgRow.push(avgScores?.noomCalorieDensity ?? '');
    }
    if (hasNutriScore) avgRow.push(avgScores?.nutriScoreGrade ?? '');
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
    // Scoring totals — sums for points, n/a for colors/grades
    if (hasWWSmart) {
      const totalWW = Array.from(dayScores!.values()).reduce((sum, s) => sum + s.wwPoints, 0);
      totalRow.push(totalWW);
    }
    if (hasWWClassic) {
      const totalWWC = Array.from(dayScores!.values()).reduce((sum, s) => sum + s.wwClassicPoints, 0);
      totalRow.push(totalWWC);
    }
    if (hasNoom) { totalRow.push(''); totalRow.push(''); }
    if (hasNutriScore) totalRow.push('');
    rows.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = headers.map((_, i) => ({ wch: i === 0 ? 14 : 16 }));
  XLSX.utils.book_append_sheet(wb, ws, isDE ? 'Ernährung' : 'Nutrition');

  // Download
  const filename = `fitbuddy-ernaehrung-${data.timeRange.from}-${data.timeRange.to}.xlsx`;
  XLSX.writeFile(wb, filename);
}
