/**
 * generateDoctorReport — Generates a PDF summary for doctor visits.
 *
 * Includes:
 * - Patient profile (name, age, gender, height, weight)
 * - Active substances/medications with dosages
 * - Latest blood work values with reference ranges
 * - Recent blood pressure readings
 * - Recent body measurements trend
 *
 * Uses jsPDF + jspdf-autotable for clean medical report formatting.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  UserProfile,
  BloodWork,
  BloodPressure,
  Substance,
  BodyMeasurement,
} from '../../../types/health';

interface DoctorReportData {
  profile: UserProfile;
  latestBloodWork?: BloodWork | null;
  recentBP: BloodPressure[];
  activeSubstances: Substance[];
  latestBody?: BodyMeasurement | null;
  language: string;
}

const LABELS = {
  de: {
    title: 'Medizinischer Statusbericht',
    subtitle: 'Erstellt mit FitBuddy — Nur zur persoenlichen Verwendung',
    patientInfo: 'Patienteninformationen',
    name: 'Name',
    age: 'Alter',
    gender: 'Geschlecht',
    height: 'Groesse',
    weight: 'Gewicht',
    bodyFat: 'Koerperfett',
    bmi: 'BMI',
    male: 'Maennlich',
    female: 'Weiblich',
    other: 'Divers',
    years: 'Jahre',
    substances: 'Aktive Substanzen / Medikamente',
    substanceName: 'Name',
    dosage: 'Dosierung',
    frequency: 'Frequenz',
    category: 'Kategorie',
    since: 'Seit',
    noSubstances: 'Keine aktiven Substanzen',
    bloodWork: 'Blutbild',
    bloodWorkDate: 'Datum Blutbild',
    marker: 'Marker',
    value: 'Wert',
    unit: 'Einheit',
    reference: 'Referenzbereich',
    noBloodWork: 'Kein Blutbild vorhanden',
    bloodPressure: 'Blutdruck (letzte 10)',
    date: 'Datum',
    time: 'Uhrzeit',
    systolic: 'Systolisch',
    diastolic: 'Diastolisch',
    pulse: 'Puls',
    noBP: 'Keine Blutdruckwerte',
    disclaimer: 'Dieser Bericht wurde automatisch generiert und ersetzt keine aerztliche Dokumentation.',
    generated: 'Erstellt am',
  },
  en: {
    title: 'Medical Status Report',
    subtitle: 'Generated with FitBuddy — For personal use only',
    patientInfo: 'Patient Information',
    name: 'Name',
    age: 'Age',
    gender: 'Gender',
    height: 'Height',
    weight: 'Weight',
    bodyFat: 'Body Fat',
    bmi: 'BMI',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    years: 'years',
    substances: 'Active Substances / Medications',
    substanceName: 'Name',
    dosage: 'Dosage',
    frequency: 'Frequency',
    category: 'Category',
    since: 'Since',
    noSubstances: 'No active substances',
    bloodWork: 'Blood Work',
    bloodWorkDate: 'Blood Work Date',
    marker: 'Marker',
    value: 'Value',
    unit: 'Unit',
    reference: 'Reference Range',
    noBloodWork: 'No blood work available',
    bloodPressure: 'Blood Pressure (last 10)',
    date: 'Date',
    time: 'Time',
    systolic: 'Systolic',
    diastolic: 'Diastolic',
    pulse: 'Pulse',
    noBP: 'No blood pressure readings',
    disclaimer: 'This report was auto-generated and does not replace medical documentation.',
    generated: 'Generated on',
  },
};

/** Blood work markers with reference ranges */
const BLOOD_MARKERS: Array<{
  key: keyof BloodWork;
  label_de: string;
  label_en: string;
  unit: string;
  refLow: number;
  refHigh: number;
}> = [
  { key: 'testosterone_total', label_de: 'Testosteron (gesamt)', label_en: 'Testosterone (total)', unit: 'ng/dL', refLow: 300, refHigh: 1000 },
  { key: 'testosterone_free', label_de: 'Testosteron (frei)', label_en: 'Testosterone (free)', unit: 'pg/mL', refLow: 5, refHigh: 25 },
  { key: 'estradiol', label_de: 'Estradiol', label_en: 'Estradiol', unit: 'pg/mL', refLow: 10, refHigh: 40 },
  { key: 'lh', label_de: 'LH', label_en: 'LH', unit: 'mIU/mL', refLow: 1.5, refHigh: 9.3 },
  { key: 'fsh', label_de: 'FSH', label_en: 'FSH', unit: 'mIU/mL', refLow: 1.4, refHigh: 18.1 },
  { key: 'shbg', label_de: 'SHBG', label_en: 'SHBG', unit: 'nmol/L', refLow: 10, refHigh: 57 },
  { key: 'prolactin', label_de: 'Prolaktin', label_en: 'Prolactin', unit: 'ng/mL', refLow: 2, refHigh: 18 },
  { key: 'hematocrit', label_de: 'Haematokrit', label_en: 'Hematocrit', unit: '%', refLow: 38, refHigh: 52 },
  { key: 'hemoglobin', label_de: 'Haemoglobin', label_en: 'Hemoglobin', unit: 'g/dL', refLow: 13.5, refHigh: 17.5 },
  { key: 'hdl', label_de: 'HDL', label_en: 'HDL', unit: 'mg/dL', refLow: 40, refHigh: 200 },
  { key: 'ldl', label_de: 'LDL', label_en: 'LDL', unit: 'mg/dL', refLow: 0, refHigh: 130 },
  { key: 'triglycerides', label_de: 'Triglyceride', label_en: 'Triglycerides', unit: 'mg/dL', refLow: 0, refHigh: 150 },
  { key: 'total_cholesterol', label_de: 'Gesamtcholesterin', label_en: 'Total Cholesterol', unit: 'mg/dL', refLow: 0, refHigh: 200 },
  { key: 'ast', label_de: 'AST (GOT)', label_en: 'AST (GOT)', unit: 'U/L', refLow: 0, refHigh: 50 },
  { key: 'alt', label_de: 'ALT (GPT)', label_en: 'ALT (GPT)', unit: 'U/L', refLow: 0, refHigh: 50 },
  { key: 'ggt', label_de: 'GGT', label_en: 'GGT', unit: 'U/L', refLow: 0, refHigh: 60 },
  { key: 'creatinine', label_de: 'Kreatinin', label_en: 'Creatinine', unit: 'mg/dL', refLow: 0.7, refHigh: 1.3 },
  { key: 'egfr', label_de: 'eGFR', label_en: 'eGFR', unit: 'mL/min', refLow: 90, refHigh: 200 },
  { key: 'tsh', label_de: 'TSH', label_en: 'TSH', unit: 'mIU/L', refLow: 0.4, refHigh: 4.0 },
  { key: 'psa', label_de: 'PSA', label_en: 'PSA', unit: 'ng/mL', refLow: 0, refHigh: 4 },
  { key: 'hba1c', label_de: 'HbA1c', label_en: 'HbA1c', unit: '%', refLow: 4, refHigh: 5.7 },
  { key: 'vitamin_d', label_de: 'Vitamin D', label_en: 'Vitamin D', unit: 'ng/mL', refLow: 30, refHigh: 100 },
  { key: 'ferritin', label_de: 'Ferritin', label_en: 'Ferritin', unit: 'ng/mL', refLow: 30, refHigh: 400 },
];

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function generateDoctorReport(data: DoctorReportData): void {
  const { profile, latestBloodWork, recentBP, activeSubstances, latestBody, language } = data;
  const l = LABELS[language as keyof typeof LABELS] ?? LABELS.en;
  const isDE = language === 'de';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // === HEADER ===
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(l.title, pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(l.subtitle, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);
  y += 4;
  doc.setDrawColor(200);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // === PATIENT INFO ===
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(l.patientInfo, 14, y);
  y += 6;

  const genderLabel = profile.gender === 'male' ? l.male : profile.gender === 'female' ? l.female : l.other;
  const age = profile.birth_date ? calculateAge(profile.birth_date) : '—';

  const infoRows: string[][] = [
    [l.name, profile.display_name ?? '—'],
    [l.age, `${age} ${l.years}`],
    [l.gender, genderLabel],
    [l.height, profile.height_cm ? `${profile.height_cm} cm` : '—'],
  ];

  if (latestBody) {
    if (latestBody.weight_kg) infoRows.push([l.weight, `${latestBody.weight_kg} kg`]);
    if (latestBody.body_fat_pct) infoRows.push([l.bodyFat, `${latestBody.body_fat_pct}%`]);
    if (latestBody.bmi) infoRows.push([l.bmi, latestBody.bmi.toFixed(1)]);
  }

  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 80 },
    },
    margin: { left: 14 },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // === ACTIVE SUBSTANCES ===
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(l.substances, 14, y);
  y += 6;

  if (activeSubstances.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(l.noSubstances, 14, y);
    y += 8;
  } else {
    const substRows = activeSubstances.map(s => [
      s.name,
      s.dosage ?? '—',
      s.frequency ?? '—',
      s.category ?? '—',
      s.start_date ?? '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [[l.substanceName, l.dosage, l.frequency, l.category, l.since]],
      body: substRows,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // === BLOOD WORK ===
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(l.bloodWork, 14, y);
  y += 6;

  if (!latestBloodWork) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(l.noBloodWork, 14, y);
    y += 8;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${l.bloodWorkDate}: ${latestBloodWork.date}`, 14, y);
    y += 5;

    const bwRows: string[][] = [];
    for (const marker of BLOOD_MARKERS) {
      const val = latestBloodWork[marker.key as keyof BloodWork];
      if (val !== undefined && val !== null && typeof val === 'number') {
        const label = isDE ? marker.label_de : marker.label_en;
        const refRange = `${marker.refLow}–${marker.refHigh}`;
        const isOutOfRange = val < marker.refLow || val > marker.refHigh;
        bwRows.push([
          label,
          val.toFixed(val < 10 ? 2 : 1),
          marker.unit,
          refRange,
          isOutOfRange ? '⚠' : '✓',
        ]);
      }
    }

    if (bwRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [[l.marker, l.value, l.unit, l.reference, '']],
        body: bwRows,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        didParseCell(data) {
          // Highlight out-of-range values in red
          if (data.section === 'body' && data.column.index === 4 && data.cell.raw === '⚠') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // === BLOOD PRESSURE ===
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(l.bloodPressure, 14, y);
  y += 6;

  if (recentBP.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(l.noBP, 14, y);
    y += 8;
  } else {
    const bpRows = recentBP.slice(0, 10).map(bp => [
      bp.date,
      bp.time,
      `${bp.systolic}`,
      `${bp.diastolic}`,
      bp.pulse ? `${bp.pulse}` : '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [[l.date, l.time, l.systolic, l.diastolic, l.pulse]],
      body: bpRows,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68], fontStyle: 'bold', textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // === FOOTER ===
  const now = new Date();
  const dateStr = now.toLocaleDateString(isDE ? 'de-DE' : 'en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  doc.setDrawColor(200);
  doc.line(14, y, pageWidth - 14, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120);
  doc.text(l.disclaimer, 14, y);
  y += 4;
  doc.text(`${l.generated}: ${dateStr}`, 14, y);

  // Save
  const filename = `FitBuddy_${isDE ? 'Arztbericht' : 'DoctorReport'}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
