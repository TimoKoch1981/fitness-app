/**
 * Hook for accessing the current training mode and its feature flags.
 * Controls which features are visible in the UI based on:
 * - Standard: General fitness tracking (default)
 * - Power: Natural Bodybuilding (competition, periodization, no PED content)
 * - Power+: Enhanced training (substance monitoring, blood work, cycles)
 *
 * @version 1.0.0
 */

import { useProfile } from '../../features/auth/hooks/useProfile';
import type { TrainingMode, TrainingPhase, CycleStatus } from '../../types/health';

export interface TrainingModeFlags {
  /** Current training mode */
  mode: TrainingMode;
  /** Current training phase (bulk, cut, etc.) */
  phase: TrainingPhase;
  /** Current cycle status (natural, blast, cruise, pct) */
  cycleStatus: CycleStatus;

  // === Feature Flags ===
  /** Power or Power+ active */
  isPower: boolean;
  /** Power+ specifically active */
  isPowerPlus: boolean;
  /** Natural mode (Standard or Power) */
  isNatural: boolean;
  /** Enhanced mode (Power+) */
  isEnhanced: boolean;

  // === UI Visibility Flags ===
  /** Show PED content (anabolics, cycles, dosages) */
  showPEDContent: boolean;
  /** Show competition features (countdown, peak week, posing) */
  showCompetitionFeatures: boolean;
  /** Show blood work dashboard */
  showBloodWorkDashboard: boolean;
  /** Show cycle tracker widget */
  showCycleTracker: boolean;
  /** Show PCT countdown */
  showPCTCountdown: boolean;
  /** Show PED substance presets (Trenbolon, Deca, etc.) */
  showSubstancePresets: boolean;
  /** Show supplement presets (always true) */
  showSupplementPresets: boolean;
  /** Show refeed/diet-break planner */
  showRefeedPlanner: boolean;
  /** Show peak week planner */
  showPeakWeek: boolean;
  /** Show posing photos feature */
  showPosingPhotos: boolean;
  /** Show natural limit calculator (FFMI) */
  showNaturalLimits: boolean;
  /** Show RED-S warning for aggressive deficits */
  showREDSWarning: boolean;
  /** Show hematocrit alert banner */
  showHematocritAlert: boolean;
  /** Show doctor report export */
  showDoctorReport: boolean;
  /** Show phase progress bar */
  showPhaseProgress: boolean;
}

export function useTrainingMode(): TrainingModeFlags {
  const { data: profile } = useProfile();

  const mode: TrainingMode = profile?.training_mode ?? 'standard';
  const phase: TrainingPhase = profile?.current_phase ?? 'maintenance';
  const cycleStatus: CycleStatus = profile?.cycle_status ?? 'natural';

  const isPower = mode === 'power' || mode === 'power_plus';
  const isPowerPlus = mode === 'power_plus';

  return {
    mode,
    phase,
    cycleStatus,

    isPower,
    isPowerPlus,
    isNatural: mode === 'standard' || mode === 'power',
    isEnhanced: isPowerPlus,

    showPEDContent: isPowerPlus,
    showCompetitionFeatures: isPower,
    showBloodWorkDashboard: isPowerPlus,
    showCycleTracker: isPowerPlus,
    showPCTCountdown: isPowerPlus,
    showSubstancePresets: isPowerPlus,
    showSupplementPresets: true,
    showRefeedPlanner: isPower,
    showPeakWeek: isPower,
    showPosingPhotos: isPower,
    showNaturalLimits: mode === 'power',
    showREDSWarning: mode === 'power',
    showHematocritAlert: isPowerPlus,
    showDoctorReport: isPowerPlus,
    showPhaseProgress: isPower,
  };
}
