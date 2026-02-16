/**
 * Blood pressure classification according to ESC/ESH Guidelines (2023).
 *
 * @reference ESC/ESH Guidelines (2023), European Heart Journal
 * @reference docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 */

import type { BPClassification } from '../../types/health';
import { BP_CLASSIFICATIONS } from '../constants';

interface BPClassificationResult {
  classification: BPClassification;
  color: string;
  severity: number;
}

/**
 * Classify blood pressure according to ESC/ESH 2023 guidelines.
 * Uses the higher classification if systolic and diastolic
 * fall into different categories.
 *
 * | Category        | Systolic (mmHg) | Diastolic (mmHg) |
 * |-----------------|-----------------|------------------|
 * | Optimal         | < 120           | < 80             |
 * | Normal          | 120-129         | 80-84            |
 * | High-Normal     | 130-139         | 85-89            |
 * | Hypertension 1  | 140-159         | 90-99            |
 * | Hypertension 2  | 160-179         | 100-109          |
 * | Hypertension 3  | >= 180          | >= 110           |
 */
export function classifyBloodPressure(
  systolic: number,
  diastolic: number
): BPClassificationResult {
  // Determine systolic classification
  let systolicClass: BPClassification = 'optimal';
  if (systolic >= 180) systolicClass = 'hypertension_3';
  else if (systolic >= 160) systolicClass = 'hypertension_2';
  else if (systolic >= 140) systolicClass = 'hypertension_1';
  else if (systolic >= 130) systolicClass = 'high_normal';
  else if (systolic >= 120) systolicClass = 'normal';

  // Determine diastolic classification
  let diastolicClass: BPClassification = 'optimal';
  if (diastolic >= 110) diastolicClass = 'hypertension_3';
  else if (diastolic >= 100) diastolicClass = 'hypertension_2';
  else if (diastolic >= 90) diastolicClass = 'hypertension_1';
  else if (diastolic >= 85) diastolicClass = 'high_normal';
  else if (diastolic >= 80) diastolicClass = 'normal';

  // Use the more severe classification
  const systolicSeverity = BP_CLASSIFICATIONS[systolicClass].severity;
  const diastolicSeverity = BP_CLASSIFICATIONS[diastolicClass].severity;

  const classification = systolicSeverity >= diastolicSeverity
    ? systolicClass
    : diastolicClass;

  return {
    classification,
    color: BP_CLASSIFICATIONS[classification].color,
    severity: BP_CLASSIFICATIONS[classification].severity,
  };
}

/**
 * Detect blood pressure trend over multiple readings.
 * Returns true if BP is consistently rising over the last N readings.
 * Relevant for users on TRT/PEDs where BP monitoring is important.
 */
export function detectBPTrend(
  readings: Array<{ systolic: number; diastolic: number; date: string }>,
  minReadings = 3
): { rising: boolean; avgSystolic: number; avgDiastolic: number } {
  if (readings.length < minReadings) {
    return { rising: false, avgSystolic: 0, avgDiastolic: 0 };
  }

  // Sort by date ascending
  const sorted = [...readings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Take last N readings
  const recent = sorted.slice(-minReadings);

  // Check if each reading is higher than the previous
  let risingCount = 0;
  for (let i = 1; i < recent.length; i++) {
    if (
      recent[i].systolic > recent[i - 1].systolic ||
      recent[i].diastolic > recent[i - 1].diastolic
    ) {
      risingCount++;
    }
  }

  const avgSystolic = Math.round(
    recent.reduce((sum, r) => sum + r.systolic, 0) / recent.length
  );
  const avgDiastolic = Math.round(
    recent.reduce((sum, r) => sum + r.diastolic, 0) / recent.length
  );

  return {
    rising: risingCount >= minReadings - 1,
    avgSystolic,
    avgDiastolic,
  };
}
