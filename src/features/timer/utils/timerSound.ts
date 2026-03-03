/**
 * timerSound — Web Audio API beep generator for rest timer.
 * No audio files needed. Generates a simple sine wave beep.
 */

// Shared AudioContext (lazy-initialized, reused across calls)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Generate a beep sound using the Web Audio API.
 * Default: 440Hz sine wave, 200ms duration.
 * Volume respects system settings (Web Audio uses system volume).
 */
export function generateBeep(
  frequency = 440,
  durationMs = 200,
  volume = 0.3,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  gainNode.gain.value = volume;
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + durationMs / 1000 + 0.01);
}

/**
 * Play the "time's up" alert: 3 beeps at 880Hz.
 */
export function playTimerComplete(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const beepDuration = 0.15;
  const gap = 0.1;

  for (let i = 0; i < 3; i++) {
    const startTime = now + i * (beepDuration + gap);
    const endTime = startTime + beepDuration;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.3;
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.01);
  }
}

/**
 * Trigger device vibration (if supported).
 */
export function vibrateDevice(): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // Vibration not supported — silently ignore
  }
}
