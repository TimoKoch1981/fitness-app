/**
 * Timer Alerts — Vibration + sound feedback for workout timers.
 * Uses Web Audio API for beep sounds (no external audio files needed).
 */

export type AlertMode = 'vibration' | 'sound' | 'both' | 'none';

/**
 * Trigger a timer alert based on the configured mode.
 */
export function triggerTimerAlert(mode: AlertMode): void {
  if (mode === 'none') return;

  if (mode === 'vibration' || mode === 'both') {
    triggerVibration();
  }
  if (mode === 'sound' || mode === 'both') {
    playBeep();
  }
}

/**
 * Vibrate the device (if supported).
 * Pattern: buzz – pause – buzz – pause – buzz
 */
function triggerVibration(): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  } catch {
    // Vibration not supported — silently ignore
  }
}

// Shared AudioContext (lazy-initialized)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a beep sound using Web Audio API.
 * Default: 3 short beeps at 800Hz.
 */
function playBeep(
  frequency = 800,
  duration = 150,
  count = 3,
  gap = 100,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  for (let i = 0; i < count; i++) {
    const startTime = now + i * (duration + gap) / 1000;
    const endTime = startTime + duration / 1000;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.3; // Not too loud

    // Fade out to avoid click
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.01);
  }
}

/**
 * Play a single warning beep (lower pitch, single tone).
 * Used when timer is about to expire (e.g., 3 seconds remaining).
 */
export function playWarningBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 440; // A4 — softer warning tone

  gainNode.gain.value = 0.15;
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.21);
}
