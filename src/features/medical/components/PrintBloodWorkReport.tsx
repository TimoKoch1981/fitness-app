/**
 * PrintBloodWorkReport — Arzt-konformer Blutwerte-Report fuer Druck.
 *
 * UX1 / Phase 5: Pflicht-Felder pro Klinik-Compliance:
 *  - Wert + Einheit (z.B. "5,2 mmol/L")
 *  - Referenzbereich (z.B. "3,6 - 5,2")
 *  - Methode (z.B. "ECLIA" oder "LC-MS/MS")
 *  - Messdatum
 *  - Labor (frei eingebbar)
 *
 * Component rendert IMMER (hidden via CSS, sichtbar nur in @media print).
 * Wird vom MedicalPage parent gerendert wenn ein "Drucken"-Button geklickt wird.
 */

import type React from 'react';
import { useBloodWorkLogs } from '../hooks/useBloodWork';
import { useProfile } from '../../auth/hooks/useProfile';
import { getReferenceRange } from '../utils/bloodWorkReferenceRanges';
import type { Gender } from '../../../types/health';

interface PrintBloodWorkReportProps {
  /** If set, only show this single blood work entry. Otherwise show last 5. */
  bloodWorkId?: string;
}

export function PrintBloodWorkReport({ bloodWorkId }: PrintBloodWorkReportProps) {
  const { data: profile } = useProfile();
  const { data: bloodWorks } = useBloodWorkLogs(10);

  const entries = bloodWorkId
    ? bloodWorks?.filter(b => b.id === bloodWorkId) ?? []
    : (bloodWorks ?? []).slice(0, 5);

  if (entries.length === 0) return null;

  const gender = profile?.gender as Gender | undefined;
  const age = profile?.birth_date
    ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;

  return (
    <div className="print-only" data-print-section>
      {/* Header */}
      <div data-print-keep style={{ marginBottom: '1cm' }}>
        <h1 style={{ fontSize: '14pt', margin: '0 0 0.3cm 0' }}>
          Blutwerte-Report
        </h1>
        <table style={{ marginBottom: '0.5cm', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ border: 'none', padding: '2px 12px 2px 0', fontWeight: 'bold' }}>Patient:</td>
              <td style={{ border: 'none', padding: '2px 0' }}>
                {profile?.display_name ?? '___________________'}
              </td>
            </tr>
            {profile?.birth_date && (
              <tr>
                <td style={{ border: 'none', padding: '2px 12px 2px 0', fontWeight: 'bold' }}>Geburtsdatum:</td>
                <td style={{ border: 'none', padding: '2px 0' }}>
                  {new Date(profile.birth_date).toLocaleDateString('de-DE')} ({age} Jahre)
                </td>
              </tr>
            )}
            {gender && (
              <tr>
                <td style={{ border: 'none', padding: '2px 12px 2px 0', fontWeight: 'bold' }}>Geschlecht:</td>
                <td style={{ border: 'none', padding: '2px 0' }}>
                  {gender === 'male' ? 'männlich' : gender === 'female' ? 'weiblich' : 'divers'}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ border: 'none', padding: '2px 12px 2px 0', fontWeight: 'bold' }}>Report-Datum:</td>
              <td style={{ border: 'none', padding: '2px 0' }}>
                {new Date().toLocaleDateString('de-DE')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per-Datum Tabellen */}
      {entries.map((bw) => (
        <div key={bw.id} data-print-keep style={{ marginBottom: '1cm' }}>
          <h2 style={{ fontSize: '12pt', margin: '0.3cm 0 0.2cm 0' }}>
            Messung vom {new Date(bw.date).toLocaleDateString('de-DE')}
          </h2>
          {/* lab_name not in BloodWork type today — kept as TODO when the
              field is added. */}
          {bw.notes && (
            <p style={{ fontSize: '10pt', margin: '0 0 0.2cm 0', fontStyle: 'italic' }}>
              {bw.notes}
            </p>
          )}

          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Marker</th>
                <th>Wert</th>
                <th>Einheit</th>
                <th>Referenz</th>
                <th>Methode</th>
                <th>Bewertung</th>
              </tr>
            </thead>
            <tbody>
              {renderMarkers(bw as unknown as BloodWorkEntry, gender, age)}
            </tbody>
          </table>
        </div>
      ))}

      {/* Pflicht-Disclaimer */}
      <div className="print-disclaimer">
        <p style={{ margin: '0 0 0.3cm 0' }}>
          <strong>Hinweis:</strong> Dieser Report wurde aus selbst-eingegebenen
          Laborwerten generiert. Referenzbereiche sind orientierend (alters- und
          geschlechtsangepasst, ohne Assay-Spezifizitaet). <strong>Keine
          medizinische Diagnose</strong> — Interpretation und Therapieentscheidungen
          obliegen ausschliesslich dem behandelnden Arzt.
        </p>
        <p style={{ margin: '0', fontSize: '8pt' }}>
          Generiert von FitBuddy (fudda.de) am {new Date().toLocaleString('de-DE')} ·
          Datenquelle: Eigenangabe Patient · Referenzbereiche: ESC/ESH, ECLIA,
          LC-MS/MS abhaengig vom Marker
        </p>
      </div>
    </div>
  );
}

interface BloodWorkEntry {
  [key: string]: unknown;
  testosterone_total?: number;
  estradiol?: number;
  shbg?: number;
  hematocrit?: number;
  hemoglobin?: number;
  hdl?: number;
  ldl?: number;
  triglycerides?: number;
  total_cholesterol?: number;
  fasting_glucose?: number;
  hba1c?: number;
  ast?: number;
  alt?: number;
  creatinine?: number;
  egfr?: number;
  vitamin_d?: number;
  tsh?: number;
}

const MARKER_LABELS: Record<string, { de: string; unit: string; method?: string }> = {
  testosterone_total: { de: 'Testosteron (gesamt)', unit: 'ng/dL', method: 'ECLIA' },
  estradiol: { de: 'Estradiol', unit: 'pg/mL', method: 'ECLIA' },
  shbg: { de: 'SHBG', unit: 'nmol/L', method: 'ECLIA' },
  hematocrit: { de: 'Hämatokrit', unit: '%', method: 'Automatik' },
  hemoglobin: { de: 'Hämoglobin', unit: 'g/dL', method: 'Automatik' },
  hdl: { de: 'HDL-Cholesterin', unit: 'mg/dL', method: 'Enzymatisch' },
  ldl: { de: 'LDL-Cholesterin', unit: 'mg/dL', method: 'Enzymatisch' },
  triglycerides: { de: 'Triglyceride', unit: 'mg/dL', method: 'Enzymatisch' },
  total_cholesterol: { de: 'Gesamt-Cholesterin', unit: 'mg/dL', method: 'Enzymatisch' },
  fasting_glucose: { de: 'Nüchtern-Glukose', unit: 'mg/dL', method: 'Enzymatisch' },
  hba1c: { de: 'HbA1c', unit: '%', method: 'HPLC' },
  ast: { de: 'AST (GOT)', unit: 'U/L', method: 'IFCC' },
  alt: { de: 'ALT (GPT)', unit: 'U/L', method: 'IFCC' },
  creatinine: { de: 'Kreatinin', unit: 'mg/dL', method: 'Jaffe' },
  egfr: { de: 'eGFR', unit: 'mL/min/1.73m²', method: 'CKD-EPI' },
  vitamin_d: { de: 'Vitamin D (25-OH)', unit: 'ng/mL', method: 'LC-MS/MS' },
  tsh: { de: 'TSH', unit: 'mIU/L', method: 'ECLIA' },
};

function renderMarkers(bw: BloodWorkEntry, gender?: Gender, age?: number): React.ReactElement[] {
  const rows: React.ReactElement[] = [];
  for (const [key, def] of Object.entries(MARKER_LABELS)) {
    const value = bw[key];
    if (value == null || typeof value !== 'number') continue;
    const ref = getReferenceRange(key, gender ?? 'male', age);
    const refStr = ref ? `${ref.low} – ${ref.high}` : '—';
    const inRange = ref ? value >= ref.low && value <= ref.high : null;
    rows.push(
      <tr key={key}>
        <td>{def.de}</td>
        <td style={{ fontWeight: 'bold' }}>{value.toString().replace('.', ',')}</td>
        <td>{def.unit}</td>
        <td>{refStr}</td>
        <td style={{ fontSize: '9pt' }}>{def.method ?? '—'}</td>
        <td>
          {inRange === null ? '—' : inRange ? 'im Bereich' : value < (ref?.low ?? 0) ? '↓ niedrig' : '↑ hoch'}
        </td>
      </tr>,
    );
  }
  return rows;
}
