/**
 * useWaterIntake — Hook for daily water intake tracking.
 *
 * Stores individual water entries (ml amounts) in localStorage, scoped per user and date.
 * Uses TanStack Query for caching and reactivity.
 *
 * Default goal: 2500ml (configurable via profile.daily_water_goal * 250ml).
 * Each "glass" in the old system = 250ml, so we convert seamlessly.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useProfile } from '../../auth/hooks/useProfile';
import { today } from '../../../lib/utils';

// ── Constants ───────────────────────────────────────────────────────────

const WATER_STORAGE_PREFIX = 'fitbuddy_water_entries_';
const DEFAULT_GOAL_ML = 2500;
const ML_PER_GLASS = 250;
const WATER_QUERY_KEY = 'water_intake';

// ── Types ───────────────────────────────────────────────────────────────

export interface WaterEntry {
  id: string;
  amountMl: number;
  timestamp: number;
}

export interface WaterIntakeData {
  entries: WaterEntry[];
  totalMl: number;
  goalMl: number;
  percentage: number;
}

// ── Helpers (exported for testing) ──────────────────────────────────────

/** Build a localStorage key scoped to user + date. */
export function buildStorageKey(userId: string | undefined, date: string): string {
  return WATER_STORAGE_PREFIX + (userId ?? 'anon') + '_' + date;
}

/** Read entries from localStorage. */
export function readEntries(key: string): WaterEntry[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
    // Migration: old format was a single number (glass count)
    if (typeof parsed === 'number' || typeof stored === 'string' && /^\d+$/.test(stored)) {
      const count = typeof parsed === 'number' ? parsed : parseInt(stored);
      if (count > 0) {
        const migrated: WaterEntry[] = Array.from({ length: count }, (_, i) => ({
          id: `migrated_${i}`,
          amountMl: ML_PER_GLASS,
          timestamp: Date.now() - (count - i) * 60000,
        }));
        return migrated;
      }
    }
    return [];
  } catch {
    return [];
  }
}

/** Write entries to localStorage. */
export function writeEntries(key: string, entries: WaterEntry[]): void {
  localStorage.setItem(key, JSON.stringify(entries));
}

/** Calculate total ml from entries. */
export function calculateTotal(entries: WaterEntry[]): number {
  return entries.reduce((sum, e) => sum + e.amountMl, 0);
}

/** Generate a unique ID for an entry. */
export function generateEntryId(): string {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Convert glass-based goal to ml. */
export function goalToMl(glassGoal: number | undefined): number {
  if (!glassGoal || glassGoal <= 0) return DEFAULT_GOAL_ML;
  return glassGoal * ML_PER_GLASS;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useWaterIntake(date?: string) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const selectedDate = date ?? today();

  const storageKey = buildStorageKey(user?.id, selectedDate);
  const goalMl = goalToMl(profile?.daily_water_goal);

  // Query for current day's water entries
  const { data, isLoading } = useQuery({
    queryKey: [WATER_QUERY_KEY, storageKey],
    queryFn: (): WaterIntakeData => {
      const entries = readEntries(storageKey);
      const totalMl = calculateTotal(entries);
      return {
        entries,
        totalMl,
        goalMl,
        percentage: goalMl > 0 ? Math.min(100, Math.round((totalMl / goalMl) * 100)) : 0,
      };
    },
    staleTime: Infinity, // localStorage is synchronous; invalidate manually
  });

  // Invalidation helper
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [WATER_QUERY_KEY, storageKey] });
  };

  // Add water mutation
  const addWaterMutation = useMutation({
    mutationFn: (amountMl: number): Promise<WaterEntry> => {
      const entries = readEntries(storageKey);
      const newEntry: WaterEntry = {
        id: generateEntryId(),
        amountMl,
        timestamp: Date.now(),
      };
      entries.push(newEntry);
      writeEntries(storageKey, entries);
      return Promise.resolve(newEntry);
    },
    onSuccess: invalidate,
  });

  // Remove last water entry mutation
  const removeLastMutation = useMutation({
    mutationFn: (): Promise<WaterEntry | null> => {
      const entries = readEntries(storageKey);
      if (entries.length === 0) return Promise.resolve(null);
      const removed = entries.pop()!;
      writeEntries(storageKey, entries);
      return Promise.resolve(removed);
    },
    onSuccess: invalidate,
  });

  // Computed values
  const totalMl = data?.totalMl ?? 0;
  const entries = data?.entries ?? [];
  const percentage = goalMl > 0 ? Math.min(100, Math.round((totalMl / goalMl) * 100)) : 0;
  const remainingMl = Math.max(0, goalMl - totalMl);
  const goalReached = totalMl >= goalMl;

  // Glass count for backward compatibility with insights engine
  const glassCount = Math.round(totalMl / ML_PER_GLASS);

  return {
    // Data
    totalMl,
    goalMl,
    percentage,
    remainingMl,
    goalReached,
    glassCount,
    entries,
    isLoading,

    // Actions
    addWater: (amountMl: number) => addWaterMutation.mutate(amountMl),
    removeLastWater: () => removeLastMutation.mutate(),
    isAdding: addWaterMutation.isPending,
    isRemoving: removeLastMutation.isPending,
  };
}
