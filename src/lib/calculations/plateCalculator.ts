/**
 * Plate Calculator — Greedy plate breakdown for barbell loading (UX10).
 *
 * Gibt zurueck, welche Hantelscheiben pro Seite aufgesteckt werden muessen,
 * um ein Zielgewicht zu erreichen. Standard-Gym-Plates in kg.
 */

/** Gaengige Plate-Sizes in kg (von gross nach klein, in der Reihenfolge sortiert) */
export const STANDARD_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5] as const;

/** Bar-Gewicht-Defaults */
export const STANDARD_BAR_KG = 20;   // Olympic bar
export const WOMEN_BAR_KG = 15;      // Women's Olympic
export const TRAINING_BAR_KG = 10;   // Tech-Bar

export interface PlateBreakdownEntry {
  /** Plate size in kg */
  weight: number;
  /** Anzahl pro Seite (NICHT total) */
  countPerSide: number;
}

export interface PlateBreakdownResult {
  /** Zielgewicht (input) */
  targetKg: number;
  /** Bar-Gewicht (input) */
  barKg: number;
  /** Pro Seite zu beladende Plates */
  plates: PlateBreakdownEntry[];
  /** Tatsaechlich erreichbares Gewicht (target minus residual) */
  achievableKg: number;
  /** Nicht erreichbare Rest-Differenz (z.B. wenn 0.25 kg nicht moeglich) */
  residualKg: number;
}

/**
 * Berechnet das optimale Plate-Loading per Seite.
 *
 * @param targetKg Zielgewicht inkl. Bar
 * @param barKg Hantel-Eigengewicht
 * @param availablePlates Verfuegbare Plate-Sizes in kg (groesste zuerst!)
 * @returns Plate-Breakdown + erreichbares Gewicht
 *
 * @example
 *   calculatePlates(100, 20) -> { plates: [{weight:25, countPerSide:1}, {weight:10, countPerSide:1}, {weight:5, countPerSide:1}], ... }
 */
export function calculatePlates(
  targetKg: number,
  barKg: number = STANDARD_BAR_KG,
  availablePlates: readonly number[] = STANDARD_PLATES_KG,
): PlateBreakdownResult {
  if (targetKg < barKg) {
    return {
      targetKg, barKg,
      plates: [],
      achievableKg: barKg,
      residualKg: barKg - targetKg,
    };
  }

  // Pro Seite zu beladen = (target - bar) / 2
  const perSideKg = (targetKg - barKg) / 2;
  let remaining = perSideKg;
  const plates: PlateBreakdownEntry[] = [];

  // Greedy: groesste zuerst, soviel wie passt
  for (const plate of availablePlates) {
    if (plate > remaining + 1e-6) continue;
    const count = Math.floor((remaining + 1e-6) / plate);
    if (count > 0) {
      plates.push({ weight: plate, countPerSide: count });
      remaining -= plate * count;
    }
    if (remaining < 1e-6) break;
  }

  const loadedPerSide = perSideKg - remaining;
  const achievableKg = barKg + loadedPerSide * 2;
  // Residual = was wir NICHT laden konnten (weil keine kleinere Plate verfuegbar)
  const residualKg = Math.round((targetKg - achievableKg) * 100) / 100;

  return {
    targetKg,
    barKg,
    plates,
    achievableKg: Math.round(achievableKg * 100) / 100,
    residualKg,
  };
}

/** Human-readable Pro-Seite-Aufstellung (kompakt) */
export function formatPlateBreakdown(result: PlateBreakdownResult): string {
  if (!result.plates.length) {
    return `Nur Stange (${result.barKg}kg)`;
  }
  return result.plates
    .map(p => `${p.countPerSide}× ${p.weight}kg`)
    .join(' + ');
}
