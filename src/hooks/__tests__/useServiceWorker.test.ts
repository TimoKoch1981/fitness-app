import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServiceWorker } from '../useServiceWorker';

/**
 * Tests for useServiceWorker hook.
 * The hook uses custom DOM events (sw:need-refresh, sw:offline-ready, sw:update)
 * to communicate with the SW registration code in main.tsx.
 * This makes it fully testable without any virtual module mocking.
 */
describe('useServiceWorker', () => {
  it('should initialize with needRefresh=false and offlineReady=false', () => {
    const { result } = renderHook(() => useServiceWorker());

    expect(result.current.needRefresh).toBe(false);
    expect(result.current.offlineReady).toBe(false);
  });

  it('should set needRefresh=true when sw:need-refresh event fires', () => {
    const { result } = renderHook(() => useServiceWorker());

    act(() => {
      window.dispatchEvent(new Event('sw:need-refresh'));
    });

    expect(result.current.needRefresh).toBe(true);
  });

  it('should set offlineReady=true when sw:offline-ready event fires', () => {
    const { result } = renderHook(() => useServiceWorker());

    act(() => {
      window.dispatchEvent(new Event('sw:offline-ready'));
    });

    expect(result.current.offlineReady).toBe(true);
  });

  it('should dismiss prompts when close() is called', () => {
    const { result } = renderHook(() => useServiceWorker());

    act(() => {
      window.dispatchEvent(new Event('sw:need-refresh'));
      window.dispatchEvent(new Event('sw:offline-ready'));
    });

    expect(result.current.needRefresh).toBe(true);
    expect(result.current.offlineReady).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.needRefresh).toBe(false);
    expect(result.current.offlineReady).toBe(false);
  });

  it('should dispatch sw:update event when updateServiceWorker is called', () => {
    const eventSpy = vi.fn();
    window.addEventListener('sw:update', eventSpy);

    const { result } = renderHook(() => useServiceWorker());

    act(() => {
      result.current.updateServiceWorker();
    });

    expect(eventSpy).toHaveBeenCalledOnce();

    window.removeEventListener('sw:update', eventSpy);
  });

  it('should clean up event listeners on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useServiceWorker());

    expect(addSpy).toHaveBeenCalledWith('sw:need-refresh', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('sw:offline-ready', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('sw:need-refresh', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('sw:offline-ready', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
