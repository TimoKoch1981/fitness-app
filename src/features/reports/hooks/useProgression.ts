/**
 * useProgression — Computes trend analysis and forecasting from body data.
 */

import { useMemo } from 'react';
import { useBodyTrend } from './useReportData';
import { useProfile } from '../../auth/hooks/useProfile';
import {
  calculateLinearRegression,
  predictValue,
  calculateMovingAverage,
  detectPlateau,
  calculateWeeklyRate,
  estimateTimeToTarget,
  calculateGoalDate,
  datesToNumericPoints,
  type RegressionResult,
  type PlateauResult,
} from '../../../lib/calculations/progression';

export interface ProgressionData {
  // Weight
  weightRegression: RegressionResult | null;
  weightPrediction30d: number | null;
  weightPlateau: PlateauResult;
  weightWeeklyRate: number | null;
  weightTimeToTarget: number | null;
  weightGoalDate: string | null;      // ISO date when target weight will be reached
  // Body Fat
  bodyFatRegression: RegressionResult | null;
  bodyFatPrediction30d: number | null;
  bodyFatTimeToTarget: number | null;
  bodyFatGoalDate: string | null;     // ISO date when target body fat will be reached
  // Chart data (historical + MA)
  weightChartData: { date: string; label: string; weight_kg: number | null; ma7: number | null }[];
  bodyFatChartData: { date: string; label: string; body_fat_pct: number | null; ma7: number | null }[];
  // Target values from profile
  targetWeight: number | null;
  targetBodyFat: number | null;
}

const MIN_POINTS = 5;

export function useProgression() {
  const { data: bodyData, isLoading: bodyLoading } = useBodyTrend(90);
  const { data: profile } = useProfile();

  const data = useMemo((): ProgressionData | null => {
    if (!bodyData || bodyData.length < MIN_POINTS) return null;

    const targetWeight = profile?.personal_goals?.target_weight_kg ?? null;
    const targetBodyFat = profile?.personal_goals?.target_body_fat_pct ?? null;

    // --- Weight ---
    const weightPoints = bodyData
      .filter(b => b.weight_kg != null)
      .map(b => ({ date: b.date, value: b.weight_kg! }));

    let weightRegression: RegressionResult | null = null;
    let weightPrediction30d: number | null = null;
    let weightWeeklyRate: number | null = null;
    let weightTimeToTarget: number | null = null;
    let weightPlateau: PlateauResult = { isPlateau: false, durationDays: 0, averageValue: 0 };

    if (weightPoints.length >= MIN_POINTS) {
      const numPoints = datesToNumericPoints(weightPoints);
      weightRegression = calculateLinearRegression(numPoints);
      if (weightRegression) {
        const lastX = numPoints[numPoints.length - 1].x;
        weightPrediction30d = Math.round(predictValue(weightRegression, lastX + 30) * 10) / 10;
      }
      weightWeeklyRate = calculateWeeklyRate(weightPoints);
      weightPlateau = detectPlateau(weightPoints);

      if (targetWeight && weightRegression) {
        weightTimeToTarget = estimateTimeToTarget(
          weightPoints[weightPoints.length - 1].value,
          targetWeight,
          weightRegression.slope
        );
      }
    }

    // Weight chart data with moving average
    const weightValues = bodyData.map(b => b.weight_kg ?? 0);
    const weightMA = calculateMovingAverage(
      weightValues.filter(v => v > 0),
      7
    );
    let maIdx = 0;
    const weightChartData = bodyData.map(b => {
      const hasWeight = b.weight_kg != null && b.weight_kg > 0;
      const ma = hasWeight ? (weightMA[maIdx++] ?? null) : null;
      return {
        date: b.date,
        label: b.label,
        weight_kg: b.weight_kg ?? null,
        ma7: ma ? Math.round(ma * 10) / 10 : null,
      };
    });

    // --- Body Fat ---
    const bfPoints = bodyData
      .filter(b => b.body_fat_pct != null)
      .map(b => ({ date: b.date, value: b.body_fat_pct! }));

    let bodyFatRegression: RegressionResult | null = null;
    let bodyFatPrediction30d: number | null = null;
    let bodyFatTimeToTarget: number | null = null;

    if (bfPoints.length >= MIN_POINTS) {
      const numPoints = datesToNumericPoints(bfPoints);
      bodyFatRegression = calculateLinearRegression(numPoints);
      if (bodyFatRegression) {
        const lastX = numPoints[numPoints.length - 1].x;
        bodyFatPrediction30d = Math.round(predictValue(bodyFatRegression, lastX + 30) * 10) / 10;
      }
      if (targetBodyFat && bodyFatRegression) {
        bodyFatTimeToTarget = estimateTimeToTarget(
          bfPoints[bfPoints.length - 1].value,
          targetBodyFat,
          bodyFatRegression.slope
        );
      }
    }

    // Body fat chart data with MA
    const bfValues = bodyData.filter(b => b.body_fat_pct != null).map(b => b.body_fat_pct!);
    const bfMA = calculateMovingAverage(bfValues, 7);
    let bfMaIdx = 0;
    const bodyFatChartData = bodyData
      .filter(b => b.body_fat_pct != null)
      .map(b => ({
        date: b.date,
        label: b.label,
        body_fat_pct: b.body_fat_pct ?? null,
        ma7: bfMA[bfMaIdx++] ?? null,
      }));

    return {
      weightRegression,
      weightPrediction30d,
      weightPlateau,
      weightWeeklyRate,
      weightTimeToTarget,
      weightGoalDate: calculateGoalDate(weightTimeToTarget),
      bodyFatRegression,
      bodyFatPrediction30d,
      bodyFatTimeToTarget,
      bodyFatGoalDate: calculateGoalDate(bodyFatTimeToTarget),
      weightChartData,
      bodyFatChartData,
      targetWeight,
      targetBodyFat,
    };
  }, [bodyData, profile]);

  return { data, isLoading: bodyLoading };
}
