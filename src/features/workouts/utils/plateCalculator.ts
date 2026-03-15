/**
 * Plate Calculator — Shows which plates to load on each side of the barbell.
 *
 * Standard Olympic plates: 25, 20, 15, 10, 5, 2.5, 1.25 kg
 * Default bar weight: 20 kg (Olympic barbell)
 *
 * Example: 100kg = Bar(20) + 2x20kg + 2x10kg → per side: 20kg + 10kg
 */

export interface PlateLoadingResult {
  /** Weight per side (total minus bar, divided by 2) */
  perSide: number;
  /** Plates needed on each side, sorted descending */
  plates: number[];
  /** Bar weight used */
  barWeight: number;
  /** Whether the weight is achievable with standard plates */
  isExact: boolean;
  /** Closest achievable weight if not exact */
  closestWeight?: number;
}

const STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Calculate plates needed per side for a given total weight.
 */
export function calculatePlateLoading(
  totalWeight: number,
  barWeight = 20,
): PlateLoadingResult | null {
  if (totalWeight <= barWeight) return null;

  const perSide = (totalWeight - barWeight) / 2;
  if (perSide <= 0) return null;

  const plates: number[] = [];
  let remaining = perSide;

  for (const plate of STANDARD_PLATES) {
    while (remaining >= plate - 0.001) { // floating point tolerance
      plates.push(plate);
      remaining -= plate;
    }
  }

  const isExact = Math.abs(remaining) < 0.01;
  const actualPerSide = plates.reduce((sum, p) => sum + p, 0);

  return {
    perSide: Math.round(perSide * 100) / 100,
    plates,
    barWeight,
    isExact,
    closestWeight: isExact ? undefined : barWeight + actualPerSide * 2,
  };
}

/**
 * Format plates as a compact string.
 * e.g., "20 + 10 + 5" or "2x20 + 10"
 */
export function formatPlates(plates: number[]): string {
  if (plates.length === 0) return '';

  // Group consecutive same plates
  const groups: { plate: number; count: number }[] = [];
  for (const p of plates) {
    const last = groups[groups.length - 1];
    if (last && last.plate === p) {
      last.count++;
    } else {
      groups.push({ plate: p, count: 1 });
    }
  }

  return groups
    .map(g => g.count > 1 ? `${g.count}x${g.plate}` : `${g.plate}`)
    .join(' + ');
}
