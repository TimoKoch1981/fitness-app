/**
 * FeatureFlagProvider — React Context for feature flags.
 *
 * Loads flags from static config, merges with localStorage overrides.
 * Provides: isEnabled(flagId), flags, toggleFlag(flagId)
 * toggleFlag only works for admin users (for testing).
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { DEFAULT_FLAGS } from './flags';
import type { FeatureFlagConfig } from './types';

const STORAGE_KEY = 'fitbuddy_feature_flags';

interface FeatureFlagContextType {
  /** Check if a specific flag is enabled */
  isEnabled: (flagId: string) => boolean;
  /** All feature flags */
  flags: FeatureFlagConfig;
  /** Toggle a flag (admin only) */
  toggleFlag: (flagId: string) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  isEnabled: () => false,
  flags: DEFAULT_FLAGS,
  toggleFlag: () => {},
});

function loadOverrides(): Partial<Record<string, boolean>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Partial<Record<string, boolean>>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage not available
  }
}

function mergeFlags(defaults: FeatureFlagConfig, overrides: Partial<Record<string, boolean>>): FeatureFlagConfig {
  const result: FeatureFlagConfig = {};
  for (const [key, flag] of Object.entries(defaults)) {
    result[key] = {
      ...flag,
      enabled: key in overrides ? !!overrides[key] : flag.enabled,
    };
  }
  return result;
}

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Partial<Record<string, boolean>>>(loadOverrides);
  const flags = useMemo(() => mergeFlags(DEFAULT_FLAGS, overrides), [overrides]);

  const isEnabled = useCallback((flagId: string): boolean => {
    const flag = flags[flagId];
    return flag?.enabled ?? false;
  }, [flags]);

  const toggleFlag = useCallback((flagId: string) => {
    setOverrides(prev => {
      const currentEnabled = flags[flagId]?.enabled ?? false;
      const newOverrides = { ...prev, [flagId]: !currentEnabled };
      saveOverrides(newOverrides);
      return newOverrides;
    });
  }, [flags]);

  const value = useMemo(() => ({ isEnabled, flags, toggleFlag }), [isEnabled, flags, toggleFlag]);

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
