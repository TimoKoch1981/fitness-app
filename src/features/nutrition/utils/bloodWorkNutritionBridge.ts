/**
 * BloodWork-Nutrition Bridge — Connects blood work results to nutrition recommendations.
 *
 * Analyzes hormonal and metabolic markers to detect:
 * - Diet fatigue indicators (low T3, high cortisol)
 * - Testosterone/Cortisol ratio for cut stress
 * - Insulin/HbA1c for carb cycling optimization
 * - Iron/B12 deficiency affecting energy
 *
 * Evidence:
 * - Mero et al. 2010: Hormonal changes during contest preparation
 * - Trexler et al. 2014: Metabolic adaptation indicators
 * - Helms et al. 2014: Biomarker monitoring during prep
 */

export interface BloodWorkNutritionAlert {
  /** Alert type */
  type: 'hormone' | 'metabolic' | 'deficiency';
  /** Severity level */
  severity: 'info' | 'warning' | 'critical';
  /** The biomarker that triggered the alert */
  marker: string;
  /** Current value */
  value: number;
  /** Unit */
  unit: string;
  /** Reference range */
  refRange: string;
  /** Nutrition recommendation */
  recommendation: { de: string; en: string };
  /** Scientific reference */
  reference: string;
}

interface BloodWorkValues {
  // Hormones
  testosterone_total?: number;   // ng/dL
  cortisol?: number;             // µg/dL
  tsh?: number;                  // mIU/L
  free_t3?: number;              // pg/mL
  free_t4?: number;              // ng/dL
  insulin_fasting?: number;      // µU/mL

  // Metabolic
  hba1c?: number;                // %
  glucose_fasting?: number;      // mg/dL

  // Nutrients
  iron?: number;                 // µg/dL
  ferritin?: number;             // ng/mL
  vitamin_b12?: number;          // pg/mL
  vitamin_d?: number;            // ng/mL
  magnesium?: number;            // mg/dL
}

/**
 * Analyze blood work results for nutrition-relevant signals.
 */
export function analyzeBloodWorkForNutrition(
  values: BloodWorkValues,
  phase: string,
  gender: 'male' | 'female' | 'other' = 'male',
): BloodWorkNutritionAlert[] {
  const alerts: BloodWorkNutritionAlert[] = [];

  // 1. Testosterone/Cortisol Ratio (Cut stress indicator)
  if (values.testosterone_total != null && values.cortisol != null && values.cortisol > 0) {
    const ratio = values.testosterone_total / (values.cortisol * 10); // Normalize
    if (ratio < 15 && phase === 'cut') {
      alerts.push({
        type: 'hormone',
        severity: ratio < 10 ? 'critical' : 'warning',
        marker: 'T/C Ratio',
        value: Math.round(ratio * 10) / 10,
        unit: '',
        refRange: '>15',
        recommendation: {
          de: 'Testosteron/Cortisol-Ratio niedrig — Diet Break oder Refeed-Erhoehung empfohlen. Stress reduzieren, Schlaf optimieren.',
          en: 'Testosterone/Cortisol ratio low — diet break or increased refeeds recommended. Reduce stress, optimize sleep.',
        },
        reference: 'Mero et al. 2010',
      });
    }
  }

  // 2. Low T3 (metabolic adaptation)
  if (values.free_t3 != null && values.free_t3 < 2.0) {
    alerts.push({
      type: 'metabolic',
      severity: values.free_t3 < 1.5 ? 'critical' : 'warning',
      marker: 'Free T3',
      value: values.free_t3,
      unit: 'pg/mL',
      refRange: '2.0-4.4',
      recommendation: {
        de: 'Niedriges T3 deutet auf metabolische Adaptation hin. Erwaege einen Refeed oder Diet Break. Mehr Carbs koennen T3 erhoehen.',
        en: 'Low T3 indicates metabolic adaptation. Consider a refeed or diet break. More carbs can increase T3.',
      },
      reference: 'Trexler et al. 2014',
    });
  }

  // 3. TSH elevated (thyroid stress)
  if (values.tsh != null && values.tsh > 4.0) {
    alerts.push({
      type: 'metabolic',
      severity: 'warning',
      marker: 'TSH',
      value: values.tsh,
      unit: 'mIU/L',
      refRange: '0.4-4.0',
      recommendation: {
        de: 'TSH erhoeht — Schilddruese unter Stress. Kalorien-Erhoehung und Jod-Zufuhr pruefen. Arzt konsultieren.',
        en: 'TSH elevated — thyroid stress. Check calorie intake and iodine supply. Consult physician.',
      },
      reference: 'Trexler et al. 2014',
    });
  }

  // 4. HbA1c elevated (carb cycling relevant)
  if (values.hba1c != null && values.hba1c > 5.7) {
    alerts.push({
      type: 'metabolic',
      severity: values.hba1c > 6.5 ? 'critical' : 'warning',
      marker: 'HbA1c',
      value: values.hba1c,
      unit: '%',
      refRange: '<5.7',
      recommendation: {
        de: 'HbA1c erhoeht — Low-Carb-Tage im Macro Cycling erhoehen. Einfache Zucker reduzieren, Ballaststoffe erhoehen.',
        en: 'HbA1c elevated — increase low-carb days in macro cycling. Reduce simple sugars, increase fiber.',
      },
      reference: 'ADA 2024',
    });
  }

  // 5. Low Ferritin (iron deficiency)
  if (values.ferritin != null) {
    const lowThreshold = gender === 'female' ? 15 : 30;
    if (values.ferritin < lowThreshold) {
      alerts.push({
        type: 'deficiency',
        severity: values.ferritin < 10 ? 'critical' : 'warning',
        marker: 'Ferritin',
        value: values.ferritin,
        unit: 'ng/mL',
        refRange: gender === 'female' ? '>15' : '>30',
        recommendation: {
          de: 'Eisenspeicher niedrig — rotes Fleisch, Huelsenfruechte, Vitamin C zur Aufnahme. Bei starkem Mangel: Eisen-Supplement.',
          en: 'Iron stores low — red meat, legumes, vitamin C for absorption. With severe deficiency: iron supplement.',
        },
        reference: 'WHO 2020',
      });
    }
  }

  // 6. Low Vitamin D
  if (values.vitamin_d != null && values.vitamin_d < 30) {
    alerts.push({
      type: 'deficiency',
      severity: values.vitamin_d < 20 ? 'warning' : 'info',
      marker: 'Vitamin D',
      value: values.vitamin_d,
      unit: 'ng/mL',
      refRange: '30-100',
      recommendation: {
        de: 'Vitamin D niedrig — 3000-5000 IU/Tag empfohlen, morgens mit Fett einnehmen. Wichtig fuer Hormonfunktion und Muskelkraft.',
        en: 'Vitamin D low — 3000-5000 IU/day recommended, take in morning with fat. Important for hormone function and muscle strength.',
      },
      reference: 'Holick et al. 2011',
    });
  }

  // 7. Low B12
  if (values.vitamin_b12 != null && values.vitamin_b12 < 300) {
    alerts.push({
      type: 'deficiency',
      severity: values.vitamin_b12 < 200 ? 'warning' : 'info',
      marker: 'Vitamin B12',
      value: values.vitamin_b12,
      unit: 'pg/mL',
      refRange: '300-900',
      recommendation: {
        de: 'B12 niedrig — besonders wichtig bei veganer/vegetarischer Ernaehrung. Supplement 1000µg/Tag oder B12-reiche Lebensmittel.',
        en: 'B12 low — especially important for vegan/vegetarian diets. Supplement 1000µg/day or B12-rich foods.',
      },
      reference: 'EFSA 2015',
    });
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

/**
 * Format alerts for the Nutrition Agent context.
 */
export function formatBloodWorkAlertsForAgent(alerts: BloodWorkNutritionAlert[], language: 'de' | 'en'): string {
  if (alerts.length === 0) return '';
  const de = language === 'de';
  const header = de ? 'BLUTWERTE-ERNAEHRUNGS-HINWEISE' : 'BLOOD WORK NUTRITION ALERTS';
  const lines = alerts.map(a => {
    const rec = de ? a.recommendation.de : a.recommendation.en;
    return `- [${a.severity.toUpperCase()}] ${a.marker}: ${a.value} ${a.unit} (${de ? 'Ref' : 'Ref'}: ${a.refRange}) — ${rec} (${a.reference})`;
  });
  return `\n[${header}]\n${lines.join('\n')}\n`;
}
