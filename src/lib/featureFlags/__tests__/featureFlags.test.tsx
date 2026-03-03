/**
 * Feature Flags — Tests for FeatureFlagProvider, useFeatureFlag, and FeatureGate.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { FeatureFlagProvider, useFeatureFlags } from '../FeatureFlagProvider';
import { useFeatureFlag } from '../useFeatureFlag';
import { FeatureGate } from '../FeatureGate';
import { DEFAULT_FLAGS } from '../flags';

function wrapper({ children }: { children: ReactNode }) {
  return <FeatureFlagProvider>{children}</FeatureFlagProvider>;
}

describe('Feature Flags', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('isEnabled returns true for enabled flags', () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    expect(result.current.isEnabled('barcode_scanner')).toBe(true);
    expect(result.current.isEnabled('water_widget')).toBe(true);
  });

  it('isEnabled returns false for disabled flags', () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    expect(result.current.isEnabled('social_features')).toBe(false);
    expect(result.current.isEnabled('marketplace')).toBe(false);
  });

  it('isEnabled returns false for unknown flags', () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    expect(result.current.isEnabled('nonexistent_flag')).toBe(false);
  });

  it('toggleFlag toggles a flag from enabled to disabled', () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    expect(result.current.isEnabled('barcode_scanner')).toBe(true);
    act(() => { result.current.toggleFlag('barcode_scanner'); });
    expect(result.current.isEnabled('barcode_scanner')).toBe(false);
  });

  it('toggleFlag toggles a flag from disabled to enabled', () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    expect(result.current.isEnabled('social_features')).toBe(false);
    act(() => { result.current.toggleFlag('social_features'); });
    expect(result.current.isEnabled('social_features')).toBe(true);
  });

  it('persists toggles to localStorage', () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    act(() => { result.current.toggleFlag('barcode_scanner'); });
    const stored = localStorage.getItem('fitbuddy_feature_flags');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.barcode_scanner).toBe(false);
  });

  it('default flags contain expected entries', () => {
    expect(Object.keys(DEFAULT_FLAGS)).toContain('barcode_scanner');
    expect(Object.keys(DEFAULT_FLAGS)).toContain('social_features');
    expect(Object.keys(DEFAULT_FLAGS)).toContain('marketplace');
    expect(Object.keys(DEFAULT_FLAGS).length).toBe(10);
  });

  it('useFeatureFlag hook returns correct value', () => {
    const { result } = renderHook(() => useFeatureFlag('gamification'), { wrapper });
    expect(result.current).toBe(true);
  });

  it('FeatureGate renders children when flag is enabled', () => {
    render(
      <FeatureFlagProvider>
        <FeatureGate flag="barcode_scanner">
          <div data-testid="content">Visible</div>
        </FeatureGate>
      </FeatureFlagProvider>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('FeatureGate renders fallback when flag is disabled', () => {
    render(
      <FeatureFlagProvider>
        <FeatureGate flag="social_features" fallback={<div data-testid="fallback">Coming Soon</div>}>
          <div data-testid="content">Visible</div>
        </FeatureGate>
      </FeatureFlagProvider>
    );
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });
});
