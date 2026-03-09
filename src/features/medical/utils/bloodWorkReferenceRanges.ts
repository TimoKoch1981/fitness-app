/**
 * Gender- and age-dependent blood work reference ranges.
 *
 * Sources: ESC/ESH 2023, AUA, Cleveland Clinic, NCBI, Medscape.
 * These are general adult reference ranges — individual lab ranges may vary.
 * The app shows these for orientation, NOT for diagnosis.
 */

// ── Types ────────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other';

export interface RangeValues {
  low: number;
  high: number;
}

export interface MarkerReference {
  unit: string;
  labelDE: string;
  labelEN: string;
  group: MarkerGroup;
  /** Default male adult range */
  male: RangeValues;
  /** Default female adult range (null = not applicable, e.g. PSA) */
  female: RangeValues | null;
  /** If present, overrides base range for specific age brackets */
  maleByAge?: AgeRange[];
  femaleByAge?: AgeRange[];
  /** Step for numeric input (e.g. 0.01 for creatinine) */
  step?: string;
}

export interface AgeRange {
  minAge?: number; // inclusive
  maxAge?: number; // inclusive
  range: RangeValues;
  label?: string; // e.g. "postmenopausal"
}

export type MarkerGroup =
  | 'hormones'
  | 'blood_count'
  | 'lipids'
  | 'liver'
  | 'kidney'
  | 'metabolism'
  | 'electrolytes'
  | 'other';

// ── Group Labels ─────────────────────────────────────────────────────────

export const GROUP_LABELS: Record<MarkerGroup, { de: string; en: string }> = {
  hormones:     { de: 'Hormone',       en: 'Hormones' },
  blood_count:  { de: 'Blutbild',      en: 'Blood Count' },
  lipids:       { de: 'Lipide',        en: 'Lipids' },
  liver:        { de: 'Leber',         en: 'Liver' },
  kidney:       { de: 'Niere',         en: 'Kidney' },
  metabolism:   { de: 'Stoffwechsel',  en: 'Metabolism' },
  electrolytes: { de: 'Elektrolyte',   en: 'Electrolytes' },
  other:        { de: 'Sonstige',      en: 'Other' },
};

/** Ordered groups for display */
export const GROUP_ORDER: MarkerGroup[] = [
  'hormones', 'blood_count', 'lipids', 'liver', 'kidney',
  'metabolism', 'electrolytes', 'other',
];

// ── Reference Range Table ────────────────────────────────────────────────

export const REFERENCE_RANGES: Record<string, MarkerReference> = {
  // ── Hormones ───────────────────────────────────────────────────────────
  testosterone_total: {
    unit: 'ng/dL',
    labelDE: 'Testosteron (gesamt)',
    labelEN: 'Testosterone (total)',
    group: 'hormones',
    male:   { low: 300, high: 1000 },
    female: { low: 15, high: 70 },
    maleByAge: [
      { minAge: 18, maxAge: 39, range: { low: 300, high: 1000 } },
      { minAge: 40, maxAge: 59, range: { low: 250, high: 900 } },
      { minAge: 60,             range: { low: 200, high: 800 } },
    ],
  },
  testosterone_free: {
    unit: 'pg/mL',
    labelDE: 'Testosteron (frei)',
    labelEN: 'Testosterone (free)',
    group: 'hormones',
    male:   { low: 5.0, high: 25.0 },
    female: { low: 0.3, high: 1.9 },
    maleByAge: [
      { minAge: 18, maxAge: 39, range: { low: 8.7, high: 25.1 } },
      { minAge: 40, maxAge: 59, range: { low: 6.8, high: 21.5 } },
      { minAge: 60,             range: { low: 4.9, high: 16.8 } },
    ],
    step: '0.1',
  },
  estradiol: {
    unit: 'pg/mL',
    labelDE: 'Estradiol (E2)',
    labelEN: 'Estradiol (E2)',
    group: 'hormones',
    male:   { low: 10, high: 40 },
    female: { low: 30, high: 400 },
    femaleByAge: [
      { minAge: 18, maxAge: 50, range: { low: 30, high: 400 }, label: 'premenopausal' },
      { minAge: 51,             range: { low: 0, high: 30 },   label: 'postmenopausal' },
    ],
  },
  lh: {
    unit: 'mIU/mL',
    labelDE: 'LH',
    labelEN: 'LH',
    group: 'hormones',
    male:   { low: 1.5, high: 9.3 },
    female: { low: 1.9, high: 12.5 },
    maleByAge: [
      { minAge: 18, maxAge: 69, range: { low: 1.5, high: 9.3 } },
      { minAge: 70,             range: { low: 3.1, high: 34.6 } },
    ],
    step: '0.1',
  },
  fsh: {
    unit: 'mIU/mL',
    labelDE: 'FSH',
    labelEN: 'FSH',
    group: 'hormones',
    male:   { low: 1.4, high: 18.1 },
    female: { low: 2.5, high: 10.2 },
    femaleByAge: [
      { minAge: 18, maxAge: 50, range: { low: 2.5, high: 10.2 }, label: 'premenopausal' },
      { minAge: 51,             range: { low: 23.0, high: 116.3 }, label: 'postmenopausal' },
    ],
    step: '0.1',
  },
  shbg: {
    unit: 'nmol/L',
    labelDE: 'SHBG',
    labelEN: 'SHBG',
    group: 'hormones',
    male:   { low: 14.6, high: 94.6 },
    female: { low: 18, high: 144 },
    maleByAge: [
      { minAge: 18, maxAge: 49, range: { low: 14.6, high: 94.6 } },
      { minAge: 50,             range: { low: 21.6, high: 113.1 } },
    ],
    step: '0.1',
  },
  prolactin: {
    unit: 'ng/mL',
    labelDE: 'Prolaktin',
    labelEN: 'Prolactin',
    group: 'hormones',
    male:   { low: 2, high: 18 },
    female: { low: 2, high: 29 },
    step: '0.1',
  },
  cortisol: {
    unit: 'µg/dL',
    labelDE: 'Cortisol',
    labelEN: 'Cortisol',
    group: 'hormones',
    male:   { low: 5.3, high: 22.5 },
    female: { low: 5.3, high: 22.5 },
    step: '0.1',
  },
  free_androgen_index: {
    unit: '%',
    labelDE: 'Freier Androgen-Index (FAI)',
    labelEN: 'Free Androgen Index (FAI)',
    group: 'hormones',
    male:   { low: 14.5, high: 80.3 },
    female: { low: 0.5, high: 6.0 },
    maleByAge: [
      { minAge: 18, maxAge: 49, range: { low: 14.5, high: 80.3 } },
      { minAge: 50,             range: { low: 9.4, high: 52.5 } },
    ],
    step: '0.1',
  },

  // ── Blood Count ────────────────────────────────────────────────────────
  hemoglobin: {
    unit: 'g/dL',
    labelDE: 'Haemoglobin',
    labelEN: 'Hemoglobin',
    group: 'blood_count',
    male:   { low: 13.5, high: 17.5 },
    female: { low: 12.0, high: 16.0 },
    step: '0.1',
  },
  hematocrit: {
    unit: '%',
    labelDE: 'Haematokrit',
    labelEN: 'Hematocrit',
    group: 'blood_count',
    male:   { low: 40, high: 53 },
    female: { low: 36, high: 46 },
  },
  erythrocytes: {
    unit: '/pL',
    labelDE: 'Erythrozyten',
    labelEN: 'Erythrocytes (RBC)',
    group: 'blood_count',
    male:   { low: 4.4, high: 5.9 },
    female: { low: 3.8, high: 5.2 },
    step: '0.1',
  },
  leukocytes: {
    unit: '/nL',
    labelDE: 'Leukozyten',
    labelEN: 'Leukocytes (WBC)',
    group: 'blood_count',
    male:   { low: 4, high: 10 },
    female: { low: 4, high: 10 },
    step: '0.1',
  },
  platelets: {
    unit: '/nL',
    labelDE: 'Thrombozyten',
    labelEN: 'Platelets',
    group: 'blood_count',
    male:   { low: 140, high: 400 },
    female: { low: 140, high: 400 },
  },

  // ── Lipids ─────────────────────────────────────────────────────────────
  hdl: {
    unit: 'mg/dL',
    labelDE: 'HDL',
    labelEN: 'HDL',
    group: 'lipids',
    male:   { low: 40, high: 200 },
    female: { low: 50, high: 200 },
  },
  ldl: {
    unit: 'mg/dL',
    labelDE: 'LDL',
    labelEN: 'LDL',
    group: 'lipids',
    male:   { low: 0, high: 130 },
    female: { low: 0, high: 130 },
  },
  triglycerides: {
    unit: 'mg/dL',
    labelDE: 'Triglyceride',
    labelEN: 'Triglycerides',
    group: 'lipids',
    male:   { low: 0, high: 150 },
    female: { low: 0, high: 150 },
  },
  total_cholesterol: {
    unit: 'mg/dL',
    labelDE: 'Gesamtcholesterin',
    labelEN: 'Total Cholesterol',
    group: 'lipids',
    male:   { low: 0, high: 200 },
    female: { low: 0, high: 200 },
  },

  // ── Liver ──────────────────────────────────────────────────────────────
  ast: {
    unit: 'U/L',
    labelDE: 'AST (GOT)',
    labelEN: 'AST (GOT)',
    group: 'liver',
    male:   { low: 0, high: 50 },
    female: { low: 0, high: 35 },
  },
  alt: {
    unit: 'U/L',
    labelDE: 'ALT (GPT)',
    labelEN: 'ALT (GPT)',
    group: 'liver',
    male:   { low: 0, high: 50 },
    female: { low: 0, high: 35 },
  },
  ggt: {
    unit: 'U/L',
    labelDE: 'GGT',
    labelEN: 'GGT',
    group: 'liver',
    male:   { low: 0, high: 60 },
    female: { low: 0, high: 40 },
  },
  bilirubin: {
    unit: 'mg/dL',
    labelDE: 'Bilirubin (gesamt)',
    labelEN: 'Bilirubin (total)',
    group: 'liver',
    male:   { low: 0, high: 1.1 },
    female: { low: 0, high: 1.1 },
    step: '0.1',
  },
  alkaline_phosphatase: {
    unit: 'U/L',
    labelDE: 'Alkalische Phosphatase (AP)',
    labelEN: 'Alkaline Phosphatase (ALP)',
    group: 'liver',
    male:   { low: 40, high: 129 },
    female: { low: 35, high: 105 },
  },

  // ── Kidney ─────────────────────────────────────────────────────────────
  creatinine: {
    unit: 'mg/dL',
    labelDE: 'Kreatinin',
    labelEN: 'Creatinine',
    group: 'kidney',
    male:   { low: 0.7, high: 1.3 },
    female: { low: 0.5, high: 1.1 },
    step: '0.01',
  },
  egfr: {
    unit: 'mL/min',
    labelDE: 'eGFR',
    labelEN: 'eGFR',
    group: 'kidney',
    male:   { low: 60, high: 200 },
    female: { low: 60, high: 200 },
  },
  urea: {
    unit: 'mg/dL',
    labelDE: 'Harnstoff (BUN)',
    labelEN: 'Urea (BUN)',
    group: 'kidney',
    male:   { low: 17, high: 43 },
    female: { low: 15, high: 40 },
  },

  // ── Metabolism ─────────────────────────────────────────────────────────
  fasting_glucose: {
    unit: 'mg/dL',
    labelDE: 'Blutzucker (nuechtern)',
    labelEN: 'Fasting Glucose',
    group: 'metabolism',
    male:   { low: 70, high: 100 },
    female: { low: 70, high: 100 },
  },
  hba1c: {
    unit: '%',
    labelDE: 'HbA1c',
    labelEN: 'HbA1c',
    group: 'metabolism',
    male:   { low: 4.0, high: 5.7 },
    female: { low: 4.0, high: 5.7 },
    step: '0.1',
  },
  uric_acid: {
    unit: 'mg/dL',
    labelDE: 'Harnsaeure',
    labelEN: 'Uric Acid',
    group: 'metabolism',
    male:   { low: 3.5, high: 7.2 },
    female: { low: 2.5, high: 6.0 },
    step: '0.1',
  },
  iron: {
    unit: 'µg/dL',
    labelDE: 'Eisen',
    labelEN: 'Iron',
    group: 'metabolism',
    male:   { low: 65, high: 175 },
    female: { low: 50, high: 170 },
  },
  ferritin: {
    unit: 'ng/mL',
    labelDE: 'Ferritin',
    labelEN: 'Ferritin',
    group: 'metabolism',
    male:   { low: 30, high: 300 },
    female: { low: 10, high: 150 },
    femaleByAge: [
      { minAge: 18, maxAge: 50, range: { low: 10, high: 150 }, label: 'premenopausal' },
      { minAge: 51,             range: { low: 30, high: 300 }, label: 'postmenopausal' },
    ],
  },
  total_protein: {
    unit: 'g/dL',
    labelDE: 'Gesamteiweiss',
    labelEN: 'Total Protein',
    group: 'metabolism',
    male:   { low: 6.4, high: 8.3 },
    female: { low: 6.4, high: 8.3 },
    step: '0.1',
  },

  // ── Electrolytes ───────────────────────────────────────────────────────
  potassium: {
    unit: 'mmol/L',
    labelDE: 'Kalium',
    labelEN: 'Potassium',
    group: 'electrolytes',
    male:   { low: 3.5, high: 5.5 },
    female: { low: 3.5, high: 5.5 },
    step: '0.1',
  },
  sodium: {
    unit: 'mmol/L',
    labelDE: 'Natrium',
    labelEN: 'Sodium',
    group: 'electrolytes',
    male:   { low: 135, high: 148 },
    female: { low: 135, high: 148 },
  },
  calcium: {
    unit: 'mmol/L',
    labelDE: 'Calcium',
    labelEN: 'Calcium',
    group: 'electrolytes',
    male:   { low: 2.1, high: 2.6 },
    female: { low: 2.1, high: 2.6 },
    step: '0.1',
  },

  // ── Other ──────────────────────────────────────────────────────────────
  tsh: {
    unit: 'mIU/L',
    labelDE: 'TSH',
    labelEN: 'TSH',
    group: 'other',
    male:   { low: 0.4, high: 4.0 },
    female: { low: 0.4, high: 4.0 },
    step: '0.01',
  },
  psa: {
    unit: 'ng/mL',
    labelDE: 'PSA',
    labelEN: 'PSA',
    group: 'other',
    male:   { low: 0, high: 4 },
    female: null,
    maleByAge: [
      { minAge: 18, maxAge: 49, range: { low: 0, high: 2.5 } },
      { minAge: 50, maxAge: 59, range: { low: 0, high: 3.5 } },
      { minAge: 60, maxAge: 69, range: { low: 0, high: 4.5 } },
      { minAge: 70,             range: { low: 0, high: 6.5 } },
    ],
    step: '0.01',
  },
  free_psa: {
    unit: 'ng/mL',
    labelDE: 'Freies PSA',
    labelEN: 'Free PSA',
    group: 'other',
    male:   { low: 0, high: 1.0 },
    female: null,
    step: '0.01',
  },
  vitamin_d: {
    unit: 'ng/mL',
    labelDE: 'Vitamin D',
    labelEN: 'Vitamin D',
    group: 'other',
    male:   { low: 30, high: 100 },
    female: { low: 30, high: 100 },
  },
};

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Get the reference range for a specific marker based on gender and age.
 * Returns null if the marker is not applicable for the given gender (e.g. PSA for female).
 */
export function getReferenceRange(
  markerKey: string,
  gender: Gender = 'male',
  age?: number,
): RangeValues | null {
  const ref = REFERENCE_RANGES[markerKey];
  if (!ref) return null;

  const isMale = gender === 'male' || gender === 'other';

  // Check if marker is applicable for this gender
  if (!isMale && ref.female === null) return null;

  // Get age-based ranges if available
  const ageRanges = isMale ? ref.maleByAge : ref.femaleByAge;
  if (ageRanges && age != null) {
    for (const ar of ageRanges) {
      const minOk = ar.minAge == null || age >= ar.minAge;
      const maxOk = ar.maxAge == null || age <= ar.maxAge;
      if (minOk && maxOk) return ar.range;
    }
  }

  // Fallback to base range
  return isMale ? ref.male : (ref.female ?? ref.male);
}

/**
 * Get status color for a value relative to its reference range.
 */
export function getMarkerStatus(
  value: number,
  markerKey: string,
  gender: Gender = 'male',
  age?: number,
): 'normal' | 'warning' | 'danger' | null {
  const range = getReferenceRange(markerKey, gender, age);
  if (!range) return null;

  if (value < range.low * 0.8 || value > range.high * 1.2) return 'danger';
  if (value < range.low || value > range.high) return 'warning';
  return 'normal';
}

/**
 * Get all marker keys grouped by their MarkerGroup.
 */
export function getMarkersByGroup(): Map<MarkerGroup, string[]> {
  const map = new Map<MarkerGroup, string[]>();
  for (const group of GROUP_ORDER) {
    map.set(group, []);
  }
  for (const [key, ref] of Object.entries(REFERENCE_RANGES)) {
    const list = map.get(ref.group);
    if (list) list.push(key);
  }
  return map;
}

/** All marker keys (ordered by group, then by insertion order) */
export const ALL_MARKER_KEYS = Object.keys(REFERENCE_RANGES);
