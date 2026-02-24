import { describe, it, expect } from 'vitest';
import { detectScaleFormat, SCALE_PARSERS } from '../scaleFormats';

describe('detectScaleFormat', () => {
  it('detects Fitdays format', () => {
    const headers = ['Time of Measurement', 'Weight(kg)', 'BMI', 'Body Fat Rate(%)', 'Body Water(%)'];
    const result = detectScaleFormat(headers);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Fitdays');
  });

  it('detects Renpho format', () => {
    const headers = ['Time of Measurement', 'Weight', 'BMI', 'Body Fat', 'Skeletal Muscle(kg)'];
    const result = detectScaleFormat(headers);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Renpho');
  });

  it('detects Withings format', () => {
    const headers = ['Date', 'Weight (kg)', 'Fat mass (kg)', 'Fat-free mass (kg)', 'Fat ratio (%)'];
    const result = detectScaleFormat(headers);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Withings');
  });

  it('returns null for unknown format', () => {
    const headers = ['Col1', 'Col2', 'Col3'];
    const result = detectScaleFormat(headers);
    expect(result).toBeNull();
  });
});

describe('Fitdays parser mappings', () => {
  it('maps Fitdays columns correctly', () => {
    const parser = SCALE_PARSERS.find(p => p.name === 'Fitdays')!;
    const headers = ['Time of Measurement', 'Weight(kg)', 'BMI', 'Body Fat Rate(%)', 'Body Water(%)'];
    const mappings = parser.getMappings(headers);

    expect(mappings.find(m => m.csvColumn === 'Time of Measurement')?.targetField).toBe('date');
    expect(mappings.find(m => m.csvColumn === 'Weight(kg)')?.targetField).toBe('weight_kg');
    expect(mappings.find(m => m.csvColumn === 'Body Fat Rate(%)')?.targetField).toBe('body_fat_pct');
    expect(mappings.find(m => m.csvColumn === 'Body Water(%)')?.targetField).toBe('water_pct');
    expect(mappings.find(m => m.csvColumn === 'BMI')?.targetField).toBe('bmi');
  });
});

describe('Renpho parser mappings', () => {
  it('maps Renpho columns correctly', () => {
    const parser = SCALE_PARSERS.find(p => p.name === 'Renpho')!;
    const headers = ['Time of Measurement', 'Weight', 'Body Fat', 'Skeletal Muscle(kg)', 'Body Water(%)'];
    const mappings = parser.getMappings(headers);

    expect(mappings.find(m => m.csvColumn === 'Time of Measurement')?.targetField).toBe('date');
    expect(mappings.find(m => m.csvColumn === 'Weight')?.targetField).toBe('weight_kg');
    expect(mappings.find(m => m.csvColumn === 'Body Fat')?.targetField).toBe('body_fat_pct');
    expect(mappings.find(m => m.csvColumn === 'Skeletal Muscle(kg)')?.targetField).toBe('muscle_mass_kg');
  });
});

describe('Withings parser mappings', () => {
  it('maps Withings columns correctly', () => {
    const parser = SCALE_PARSERS.find(p => p.name === 'Withings')!;
    const headers = ['Date', 'Weight (kg)', 'Fat ratio (%)', 'Fat-free mass (kg)', 'Hydration (kg)'];
    const mappings = parser.getMappings(headers);

    expect(mappings.find(m => m.csvColumn === 'Date')?.targetField).toBe('date');
    expect(mappings.find(m => m.csvColumn === 'Weight (kg)')?.targetField).toBe('weight_kg');
    expect(mappings.find(m => m.csvColumn === 'Fat ratio (%)')?.targetField).toBe('body_fat_pct');
    expect(mappings.find(m => m.csvColumn === 'Fat-free mass (kg)')?.targetField).toBe('muscle_mass_kg');
  });
});
