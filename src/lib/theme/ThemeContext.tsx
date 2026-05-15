/**
 * ThemeContext — v14.28 Stufe 3.
 *
 * Verwaltet das Look-&-Feel-Theme der App:
 *   - surfaceMode: 'studio' (Default, Light) | 'console' (Power Console, Dark)
 *   - density:     'spacious' | 'comfortable' (Default) | 'compact'
 *   - autoSwitchWorkout: Soll beim Active Workout automatisch auf Console gewechselt werden?
 *
 * Sync via localStorage (Multi-Device-Sync via DB ist Stufe 5+, nicht hier).
 * Setzt entsprechende data-Attribute auf <html>, die in src/index.css die
 * CSS-Variablen umschalten.
 *
 * Auto-Switch-Verhalten (Phase 8 §3.2):
 *   - Studio bleibt Default fuer alle User
 *   - Power-User aktivieren Auto-Switch im Profil
 *   - ActiveWorkoutPage ruft useTempSurfaceMode('console') auf
 *   - Beim Unmount wird der temporaere Override entfernt
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';

export type SurfaceMode = 'studio' | 'console';
export type DensityMode = 'spacious' | 'comfortable' | 'compact';

interface ThemeContextValue {
  surfaceMode: SurfaceMode;
  density: DensityMode;
  autoSwitchWorkout: boolean;
  setSurfaceMode: (mode: SurfaceMode) => void;
  setDensity: (density: DensityMode) => void;
  setAutoSwitchWorkout: (enabled: boolean) => void;
  /** Temporaerer Override (z. B. ActiveWorkout) — wird automatisch zurueckgesetzt. */
  setTempSurfaceMode: (mode: SurfaceMode | null) => void;
}

const STORAGE_KEYS = {
  surfaceMode: 'fitbuddy_theme_surface_mode',
  density: 'fitbuddy_theme_density',
  autoSwitch: 'fitbuddy_theme_auto_switch_workout',
} as const;

function readStorage<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  try {
    const v = localStorage.getItem(key);
    if (v && (allowed as readonly string[]).includes(v)) return v as T;
  } catch {
    /* SSR / Private-Mode-Browser: fallback */
  }
  return fallback;
}

function readBoolStorage(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch {
    /* noop */
  }
  return fallback;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const SURFACE_MODES: readonly SurfaceMode[] = ['studio', 'console'];
const DENSITY_MODES: readonly DensityMode[] = ['spacious', 'comfortable', 'compact'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [surfaceMode, setSurfaceModeState] = useState<SurfaceMode>(() =>
    readStorage<SurfaceMode>(STORAGE_KEYS.surfaceMode, 'studio', SURFACE_MODES),
  );
  const [density, setDensityState] = useState<DensityMode>(() =>
    readStorage<DensityMode>(STORAGE_KEYS.density, 'comfortable', DENSITY_MODES),
  );
  const [autoSwitchWorkout, setAutoSwitchState] = useState<boolean>(() =>
    readBoolStorage(STORAGE_KEYS.autoSwitch, false),
  );
  const [tempSurfaceMode, setTempState] = useState<SurfaceMode | null>(null);

  // Effektive Surface-Mode ist der temporaere Override (z. B. Active Workout)
  // oder der User-Preferenz-Wert.
  const effectiveSurfaceMode: SurfaceMode = tempSurfaceMode ?? surfaceMode;

  useEffect(() => {
    document.documentElement.setAttribute('data-surface-mode', effectiveSurfaceMode);
    // Direkter Style-Override fuer html-BG (Tailwind v4 @theme inline
    // resolved var(--theme-bg) auf html-Level nicht zuverlaessig — vermutlich
    // wegen Variable-Snapshot-Behavior. Direktes inline-Style ist robust.
    document.documentElement.style.backgroundColor = effectiveSurfaceMode === 'console' ? '#0B0D0F' : '#FAF8F4';
    document.documentElement.style.colorScheme = effectiveSurfaceMode === 'console' ? 'dark' : 'light';
  }, [effectiveSurfaceMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  const setSurfaceMode = useCallback((mode: SurfaceMode) => {
    setSurfaceModeState(mode);
    try { localStorage.setItem(STORAGE_KEYS.surfaceMode, mode); } catch { /* noop */ }
  }, []);

  const setDensity = useCallback((d: DensityMode) => {
    setDensityState(d);
    try { localStorage.setItem(STORAGE_KEYS.density, d); } catch { /* noop */ }
  }, []);

  const setAutoSwitchWorkout = useCallback((enabled: boolean) => {
    setAutoSwitchState(enabled);
    try { localStorage.setItem(STORAGE_KEYS.autoSwitch, String(enabled)); } catch { /* noop */ }
  }, []);

  const setTempSurfaceMode = useCallback((mode: SurfaceMode | null) => {
    setTempState(mode);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    surfaceMode,
    density,
    autoSwitchWorkout,
    setSurfaceMode,
    setDensity,
    setAutoSwitchWorkout,
    setTempSurfaceMode,
  }), [surfaceMode, density, autoSwitchWorkout, setSurfaceMode, setDensity, setAutoSwitchWorkout, setTempSurfaceMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/**
 * useTempSurfaceMode — setzt einen temporaeren Surface-Override (z. B. fuer
 * den Active-Workout-Auto-Switch). Wird beim Unmount automatisch entfernt.
 * Wirkt nur, wenn die User-Praeferenz `autoSwitchWorkout === true` ist und
 * der User nicht eh schon im Power Console ist.
 */
export function useTempSurfaceMode(mode: SurfaceMode, enabled: boolean) {
  const { setTempSurfaceMode, autoSwitchWorkout, surfaceMode } = useTheme();
  const shouldOverride = enabled && autoSwitchWorkout && surfaceMode !== mode;

  useEffect(() => {
    if (!shouldOverride) return;
    setTempSurfaceMode(mode);
    return () => setTempSurfaceMode(null);
  }, [shouldOverride, mode, setTempSurfaceMode]);
}
