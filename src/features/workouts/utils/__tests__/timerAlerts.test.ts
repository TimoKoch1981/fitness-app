/**
 * Tests for timerAlerts — vibration + sound alert system.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerTimerAlert } from '../timerAlerts';

describe('timerAlerts', () => {
  beforeEach(() => {
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(() => true),
      writable: true,
      configurable: true,
    });
  });

  it('mode "none" does nothing', () => {
    triggerTimerAlert('none');
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it('mode "vibration" triggers vibration', () => {
    triggerTimerAlert('vibration');
    expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200, 100, 200]);
  });

  it('mode "both" triggers vibration', () => {
    triggerTimerAlert('both');
    expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200, 100, 200]);
  });

  it('mode "sound" does not trigger vibration', () => {
    triggerTimerAlert('sound');
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it('handles missing vibrate API gracefully', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(() => triggerTimerAlert('vibration')).not.toThrow();
    expect(() => triggerTimerAlert('both')).not.toThrow();
  });
});
