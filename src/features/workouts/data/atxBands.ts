/**
 * ATX Power Band resistance levels (Megafitnessshop / ATX brand).
 *
 * Used for B51: exercises like Hip Thrust / Glute Bridge can be trained with
 * a resistance band looped over the hips instead of (or in addition to) free
 * weight. The band color encodes the resistance level.
 *
 * Source: cross-verified color → width(mm) → level mapping across
 * motionsports.de (official ATX shop) and eshopforfitness.com. The kg ranges
 * are approximate (from the motionsports spec table at 25%/100% elongation) —
 * resistance scales non-linearly with stretch, so we show a RANGE and label it
 * "ca." (≈). Hex codes are UI-readable swatch approximations, not official
 * Pantone values.
 *
 * IMPORTANT: the real ATX Power Band line is exactly these 9 colors —
 * Pink, White, Yellow, Orange, Green, Blue, Red, Purple, Black. There is NO
 * grey or gold band. For Hip Thrust most lifters use Green / Blue / Red.
 */

export interface AtxBand {
  /** Stable key stored in the DB (PlanExercise.band_color). */
  key: string;
  /** ATX level 1-9. */
  level: number;
  /** Display label (color name). */
  labelDe: string;
  labelEn: string;
  /** UI swatch hex. */
  hex: string;
  /** Approx resistance range, display string. */
  resistanceKg: string;
  /** True for the levels most commonly used for Hip Thrust. */
  hipThrustTypical?: boolean;
}

export const ATX_BANDS: AtxBand[] = [
  { key: 'pink',   level: 1, labelDe: 'Pink',         labelEn: 'Pink',         hex: '#F49AC2', resistanceKg: 'ca. 2–8 kg' },
  { key: 'white',  level: 2, labelDe: 'Weiß',         labelEn: 'White',        hex: '#E5E5E5', resistanceKg: 'ca. 3–10 kg' },
  { key: 'yellow', level: 3, labelDe: 'Gelb',         labelEn: 'Yellow',       hex: '#F6C915', resistanceKg: 'ca. 7–19 kg' },
  { key: 'orange', level: 4, labelDe: 'Orange',       labelEn: 'Orange',       hex: '#F07D1A', resistanceKg: 'ca. 11–30 kg' },
  { key: 'green',  level: 5, labelDe: 'Grün',         labelEn: 'Green',        hex: '#3FA535', resistanceKg: 'ca. 17–45 kg', hipThrustTypical: true },
  { key: 'blue',   level: 6, labelDe: 'Blau',         labelEn: 'Blue',         hex: '#1F6FB2', resistanceKg: 'ca. 22–60 kg', hipThrustTypical: true },
  { key: 'red',    level: 7, labelDe: 'Rot',          labelEn: 'Red',          hex: '#C0392B', resistanceKg: 'ca. 28–85 kg', hipThrustTypical: true },
  { key: 'purple', level: 8, labelDe: 'Lila',         labelEn: 'Purple',       hex: '#7D3C98', resistanceKg: 'ca. 32–95 kg' },
  { key: 'black',  level: 9, labelDe: 'Schwarz',      labelEn: 'Black',        hex: '#1A1A1A', resistanceKg: 'ca. 36–110 kg' },
];

const BAND_BY_KEY = new Map(ATX_BANDS.map(b => [b.key, b]));

/** Look up a band by its stored key. Returns undefined for unknown keys. */
export function getAtxBand(key?: string | null): AtxBand | undefined {
  if (!key) return undefined;
  return BAND_BY_KEY.get(key);
}

/** The default suggested band when a user first enables band mode (Hip Thrust-friendly). */
export const DEFAULT_BAND_KEY = 'blue';
