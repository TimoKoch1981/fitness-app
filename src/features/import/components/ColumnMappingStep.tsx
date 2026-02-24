/**
 * ColumnMappingStep — Lets the user review and adjust CSV column → target field mappings.
 *
 * Shows each CSV column as a row with a dropdown to select the target field.
 * Auto-detected mappings are pre-selected. User can override or skip columns.
 */

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { CsvColumnMapping, ImportDataType } from '../lib/importTypes';

/** All possible target fields grouped by data type */
const TARGET_FIELDS: Record<ImportDataType, { value: string; label: string }[]> = {
  body: [
    { value: 'date', label: 'Datum / Date' },
    { value: 'weight_kg', label: 'Gewicht (kg)' },
    { value: 'body_fat_pct', label: 'Koerperfett (%)' },
    { value: 'muscle_mass_kg', label: 'Muskelmasse (kg)' },
    { value: 'water_pct', label: 'Wasseranteil (%)' },
    { value: 'bone_mass_kg', label: 'Knochenmasse (kg)' },
    { value: 'bmi', label: 'BMI' },
    { value: 'waist_cm', label: 'Bauchumfang (cm)' },
    { value: 'chest_cm', label: 'Brustumfang (cm)' },
    { value: 'arm_cm', label: 'Armumfang (cm)' },
    { value: 'leg_cm', label: 'Beinumfang (cm)' },
  ],
  meal: [
    { value: 'date', label: 'Datum / Date' },
    { value: 'name', label: 'Name / Mahlzeit' },
    { value: 'calories', label: 'Kalorien (kcal)' },
    { value: 'protein', label: 'Protein (g)' },
    { value: 'carbs', label: 'Kohlenhydrate (g)' },
    { value: 'fat', label: 'Fett (g)' },
  ],
  blood_pressure: [
    { value: 'date', label: 'Datum / Date' },
    { value: 'time', label: 'Uhrzeit / Time' },
    { value: 'systolic', label: 'Systolisch (mmHg)' },
    { value: 'diastolic', label: 'Diastolisch (mmHg)' },
    { value: 'pulse', label: 'Puls (bpm)' },
  ],
};

interface ColumnMappingStepProps {
  mappings: CsvColumnMapping[];
  dataType: ImportDataType;
  sampleRow?: string[];
  headers: string[];
  isDE: boolean;
  onConfirm: (mappings: CsvColumnMapping[], dataType: ImportDataType) => void;
  onBack: () => void;
}

export function ColumnMappingStep({
  mappings: initialMappings,
  dataType: initialDataType,
  sampleRow,
  headers: _headers,
  isDE,
  onConfirm,
  onBack,
}: ColumnMappingStepProps) {
  const [mappings, setMappings] = useState<CsvColumnMapping[]>(initialMappings);
  const [dataType, setDataType] = useState<ImportDataType>(initialDataType);

  const targetFields = TARGET_FIELDS[dataType];
  const mappedCount = mappings.filter(m => m.targetField).length;

  const handleMappingChange = (csvColumn: string, targetField: string) => {
    setMappings(prev =>
      prev.map(m =>
        m.csvColumn === csvColumn
          ? { ...m, targetField, autoDetected: false }
          : m,
      ),
    );
  };

  const handleDataTypeChange = (newType: ImportDataType) => {
    setDataType(newType);
    // Reset all non-date mappings when switching data type
    setMappings(prev =>
      prev.map(m => ({
        ...m,
        targetField: m.targetField === 'date' ? 'date' : '',
        autoDetected: m.targetField === 'date' ? m.autoDetected : false,
      })),
    );
  };

  return (
    <div className="space-y-4">
      {/* Data Type Selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          {isDE ? 'Datentyp:' : 'Data type:'}
        </p>
        <div className="flex gap-2">
          {([
            { type: 'body' as const, label: isDE ? 'Koerper' : 'Body' },
            { type: 'meal' as const, label: isDE ? 'Ernaehrung' : 'Meals' },
            { type: 'blood_pressure' as const, label: isDE ? 'Blutdruck' : 'Blood Pressure' },
          ]).map(opt => (
            <button
              key={opt.type}
              onClick={() => handleDataTypeChange(opt.type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                dataType === opt.type
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column Mapping Table */}
      <div className="border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-2 border-b">
          <span>{isDE ? 'CSV-Spalte' : 'CSV Column'}</span>
          <span className="px-2" />
          <span>{isDE ? 'Zielfeld' : 'Target Field'}</span>
        </div>

        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {mappings.map((mapping, index) => (
            <div key={mapping.csvColumn} className="grid grid-cols-[1fr_auto_1fr] gap-0 items-center px-3 py-2">
              {/* Source column */}
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">{mapping.csvColumn}</p>
                {sampleRow && sampleRow[index] && (
                  <p className="text-xs text-gray-400 truncate">{sampleRow[index]}</p>
                )}
              </div>

              {/* Arrow */}
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 mx-2 flex-shrink-0" />

              {/* Target field dropdown */}
              <select
                value={mapping.targetField}
                onChange={(e) => handleMappingChange(mapping.csvColumn, e.target.value)}
                className={`text-sm border rounded-lg px-2 py-1.5 w-full ${
                  mapping.targetField
                    ? mapping.autoDetected
                      ? 'border-teal-300 bg-teal-50 text-teal-800'
                      : 'border-blue-300 bg-blue-50 text-blue-800'
                    : 'border-gray-200 text-gray-400'
                }`}
              >
                <option value="">{isDE ? '(Ignorieren)' : '(Skip)'}</option>
                {targetFields.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border border-teal-300 bg-teal-50" />
          {isDE ? 'Automatisch erkannt' : 'Auto-detected'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border border-blue-300 bg-blue-50" />
          {isDE ? 'Manuell zugewiesen' : 'Manually assigned'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 text-sm text-gray-600 border rounded-xl hover:bg-gray-50"
        >
          {isDE ? 'Zurueck' : 'Back'}
        </button>
        <button
          onClick={() => onConfirm(mappings, dataType)}
          disabled={mappedCount === 0}
          className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="h-4 w-4" />
          {mappedCount} {isDE ? 'Spalten uebernehmen' : 'columns mapped'}
        </button>
      </div>
    </div>
  );
}
