/**
 * shareCard — Generates share-ready PNG images from workout/progress data.
 * Uses Canvas API directly (no html2canvas needed for simple cards).
 *
 * Outputs 1080x1080 (Instagram-ready) PNG as Blob.
 */

const CARD_SIZE = 1080;
const BG_GRADIENT_START = '#0d9488'; // teal-600
const BG_GRADIENT_END = '#065f46';   // emerald-800
const TEXT_WHITE = '#ffffff';
const TEXT_MUTED = 'rgba(255,255,255,0.7)';
const ACCENT = '#fbbf24'; // amber-400

interface WorkoutShareData {
  planName: string;
  dayName?: string;
  durationMin: number;
  totalSets: number;
  exerciseCount: number;
  prCount: number;
  prs: { name: string; weight: number }[];
  calories: number;
  date: string;
}

interface ProgressShareData {
  currentWeight: number;
  startWeight: number;
  weightUnit: string;
  streakDays: number;
  workoutsThisWeek: number;
  date: string;
}

/**
 * Creates a workout result share card (1080x1080 PNG)
 */
export async function createWorkoutShareCard(data: WorkoutShareData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_SIZE);
  gradient.addColorStop(0, BG_GRADIENT_START);
  gradient.addColorStop(1, BG_GRADIENT_END);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Subtle pattern (diagonal lines)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 2;
  for (let i = -CARD_SIZE; i < CARD_SIZE * 2; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + CARD_SIZE, CARD_SIZE);
    ctx.stroke();
  }

  // Header: FitBuddy branding
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('FitBuddy', 80, 100);

  // Date
  ctx.textAlign = 'right';
  ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(data.date, CARD_SIZE - 80, 100);
  ctx.textAlign = 'left';

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 140);
  ctx.lineTo(CARD_SIZE - 80, 140);
  ctx.stroke();

  // Plan name (big)
  ctx.fillStyle = TEXT_WHITE;
  ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const title = data.dayName || data.planName;
  ctx.fillText(title.length > 20 ? title.substring(0, 20) + '...' : title, 80, 230);

  // Stats row
  const statsY = 320;
  const statsGap = 260;
  const statItems = [
    { icon: '⏱', value: `${data.durationMin}`, unit: 'Min' },
    { icon: '📊', value: `${data.totalSets}`, unit: 'Sets' },
    { icon: '🔥', value: `${data.calories}`, unit: 'kcal' },
    { icon: '💪', value: `${data.exerciseCount}`, unit: 'Exercises' },
  ];

  statItems.forEach((stat, i) => {
    const x = 80 + i * statsGap;
    ctx.font = '40px sans-serif';
    ctx.fillText(stat.icon, x, statsY);
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = TEXT_WHITE;
    ctx.fillText(stat.value, x + 55, statsY);
    ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = TEXT_MUTED;
    ctx.fillText(stat.unit, x + 55, statsY + 36);
    ctx.fillStyle = TEXT_WHITE;
  });

  // PRs section
  if (data.prs.length > 0) {
    const prY = 440;
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`🏆 ${data.prCount} neue${data.prCount > 1 ? ' PRs' : 'r PR'}!`, 80, prY);

    ctx.fillStyle = TEXT_WHITE;
    ctx.font = '36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    data.prs.slice(0, 4).forEach((pr, i) => {
      const y = prY + 60 + i * 52;
      ctx.fillText(`${pr.name}`, 120, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = ACCENT;
      ctx.fillText(`${pr.weight} kg ⬆️`, CARD_SIZE - 80, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = TEXT_WHITE;
    });
  }

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(0, CARD_SIZE - 100, CARD_SIZE, 100);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('fudda.de', 80, CARD_SIZE - 40);
  ctx.textAlign = 'right';
  ctx.fillText('#FitBuddy #Fitness', CARD_SIZE - 80, CARD_SIZE - 40);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas export failed')), 'image/png');
  });
}

/**
 * Creates a progress/streak share card (1080x1080 PNG)
 */
export async function createProgressShareCard(data: ProgressShareData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Background gradient (darker, purple-ish)
  const gradient = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  gradient.addColorStop(0, '#7c3aed'); // violet-600
  gradient.addColorStop(1, '#4338ca'); // indigo-700
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Subtle circles pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 2;
  for (let r = 100; r < 800; r += 80) {
    ctx.beginPath();
    ctx.arc(CARD_SIZE / 2, CARD_SIZE / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Header
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('FitBuddy', 80, 100);
  ctx.textAlign = 'right';
  ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(data.date, CARD_SIZE - 80, 100);
  ctx.textAlign = 'left';

  // Main stat: weight change
  const weightDiff = data.currentWeight - data.startWeight;
  const sign = weightDiff < 0 ? '' : '+';
  const diffText = `${sign}${weightDiff.toFixed(1)} ${data.weightUnit}`;

  ctx.fillStyle = TEXT_WHITE;
  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mein Fortschritt', CARD_SIZE / 2, 240);

  // Big number
  ctx.fillStyle = weightDiff < 0 ? '#34d399' : ACCENT; // green for loss
  ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(diffText, CARD_SIZE / 2, 420);

  // Current weight
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '40px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`Aktuell: ${data.currentWeight} ${data.weightUnit}`, CARD_SIZE / 2, 500);

  // Stats boxes
  const boxY = 600;
  const boxes = [
    { icon: '🔥', value: `${data.streakDays}`, label: 'Tage Streak' },
    { icon: '🏋️', value: `${data.workoutsThisWeek}`, label: 'Workouts/Woche' },
  ];

  boxes.forEach((box, i) => {
    const boxX = CARD_SIZE / 2 - 280 + i * 300;
    // Box background
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, boxX, boxY, 260, 160, 20);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillStyle = TEXT_WHITE;
    ctx.fillText(box.icon, boxX + 130, boxY + 55);
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(box.value, boxX + 130, boxY + 110);
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = TEXT_MUTED;
    ctx.fillText(box.label, boxX + 130, boxY + 145);
  });

  ctx.textAlign = 'left';

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(0, CARD_SIZE - 100, CARD_SIZE, 100);
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('fudda.de', 80, CARD_SIZE - 40);
  ctx.textAlign = 'right';
  ctx.fillText('#FitBuddy #Fitness', CARD_SIZE - 80, CARD_SIZE - 40);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas export failed')), 'image/png');
  });
}

/** Helper: draw rounded rectangle */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
