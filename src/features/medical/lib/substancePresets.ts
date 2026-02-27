/**
 * Predefined substance suggestions for quick-add in AddSubstanceDialog.
 * Data sourced from supplements.ts and anabolics.ts skill files.
 */

import type { SubstanceCategory, SubstanceAdminType } from '../../../types/health';

export interface SubstancePreset {
  name: string;
  category: SubstanceCategory;
  adminType: SubstanceAdminType;
  defaultDosage?: string;
  defaultUnit: string;
  defaultFrequency?: string;
  ester?: string;
  halfLifeDays?: number;
  group: string;
  groupIcon: string;
}

// ── SUPPLEMENT PRESETS ──────────────────────────────────────────────
export const SUPPLEMENT_PRESETS: SubstancePreset[] = [
  // Protein & Amino Acids
  { name: 'Whey Protein', category: 'supplement', adminType: 'oral', defaultDosage: '30', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'protein', groupIcon: '🥛' },
  { name: 'Casein Protein', category: 'supplement', adminType: 'oral', defaultDosage: '30', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'protein', groupIcon: '🥛' },
  { name: 'EAAs', category: 'supplement', adminType: 'oral', defaultDosage: '10', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'protein', groupIcon: '🥛' },
  { name: 'BCAAs', category: 'supplement', adminType: 'oral', defaultDosage: '10', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'protein', groupIcon: '🥛' },
  { name: 'Glutamin', category: 'supplement', adminType: 'oral', defaultDosage: '5', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'protein', groupIcon: '🥛' },

  // Creatine & Performance
  { name: 'Kreatin Monohydrat', category: 'supplement', adminType: 'oral', defaultDosage: '5', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'performance', groupIcon: '⚡' },
  { name: 'Beta-Alanin', category: 'supplement', adminType: 'oral', defaultDosage: '3.2', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'performance', groupIcon: '⚡' },
  { name: 'L-Citrullin', category: 'supplement', adminType: 'oral', defaultDosage: '6', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'performance', groupIcon: '⚡' },
  { name: 'L-Arginin', category: 'supplement', adminType: 'oral', defaultDosage: '6', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'performance', groupIcon: '⚡' },
  { name: 'Taurin', category: 'supplement', adminType: 'oral', defaultDosage: '2', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'performance', groupIcon: '⚡' },

  // Vitamins & Minerals
  { name: 'Vitamin D3', category: 'supplement', adminType: 'oral', defaultDosage: '4000', defaultUnit: 'IU', defaultFrequency: 'täglich', group: 'vitamins', groupIcon: '💊' },
  { name: 'Zink', category: 'supplement', adminType: 'oral', defaultDosage: '25', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'vitamins', groupIcon: '💊' },
  { name: 'Magnesium', category: 'supplement', adminType: 'oral', defaultDosage: '400', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'vitamins', groupIcon: '💊' },
  { name: 'Omega-3', category: 'supplement', adminType: 'oral', defaultDosage: '3', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'vitamins', groupIcon: '💊' },
  { name: 'Eisen', category: 'supplement', adminType: 'oral', defaultDosage: '14', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'vitamins', groupIcon: '💊' },
  { name: 'Vitamin K2', category: 'supplement', adminType: 'oral', defaultDosage: '200', defaultUnit: 'mcg', defaultFrequency: 'täglich', group: 'vitamins', groupIcon: '💊' },
  { name: 'Vitamin B-Komplex', category: 'supplement', adminType: 'oral', defaultDosage: '1', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'vitamins', groupIcon: '💊' },

  // Health & Recovery
  { name: 'Ashwagandha', category: 'supplement', adminType: 'oral', defaultDosage: '600', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'health', groupIcon: '🌿' },
  { name: 'Curcumin', category: 'supplement', adminType: 'oral', defaultDosage: '500', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'health', groupIcon: '🌿' },
  { name: 'CoQ10', category: 'supplement', adminType: 'oral', defaultDosage: '200', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'health', groupIcon: '🌿' },
  { name: 'Melatonin', category: 'supplement', adminType: 'oral', defaultDosage: '1', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'health', groupIcon: '🌿' },
  { name: 'Collagen', category: 'supplement', adminType: 'oral', defaultDosage: '10', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'health', groupIcon: '🌿' },
  { name: 'L-Carnitin', category: 'supplement', adminType: 'oral', defaultDosage: '2', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'health', groupIcon: '🌿' },
  { name: 'Glucosamin', category: 'supplement', adminType: 'oral', defaultDosage: '1500', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'health', groupIcon: '🌿' },
  { name: 'Elektrolyte', category: 'supplement', adminType: 'oral', defaultDosage: '1', defaultUnit: 'g', defaultFrequency: 'täglich', group: 'health', groupIcon: '🌿' },

  // Stimulants
  { name: 'Koffein (Tabletten)', category: 'supplement', adminType: 'oral', defaultDosage: '200', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'stimulants', groupIcon: '☕' },
];

// ── PED / DOPING PRESETS ────────────────────────────────────────────
// Only visible after explicit activation + disclaimer acceptance
export const PED_PRESETS: SubstancePreset[] = [
  // AAS Injectable
  { name: 'Testosteron Enantat', category: 'ped', adminType: 'injection', defaultDosage: '250', defaultUnit: 'mg', defaultFrequency: '1x/Woche', ester: 'Enantat', halfLifeDays: 4.5, group: 'aas_injectable', groupIcon: '💉' },
  { name: 'Testosteron Cypionat', category: 'ped', adminType: 'injection', defaultDosage: '200', defaultUnit: 'mg', defaultFrequency: '1x/Woche', ester: 'Cypionat', halfLifeDays: 8, group: 'aas_injectable', groupIcon: '💉' },
  { name: 'Testosteron Propionat', category: 'ped', adminType: 'injection', defaultDosage: '100', defaultUnit: 'mg', defaultFrequency: 'alle 3 Tage', ester: 'Propionat', halfLifeDays: 0.8, group: 'aas_injectable', groupIcon: '💉' },
  { name: 'Testosteron Undecanoat', category: 'ped', adminType: 'injection', defaultDosage: '1000', defaultUnit: 'mg', defaultFrequency: 'alle 14 Tage', ester: 'Undecanoat', halfLifeDays: 20.9, group: 'aas_injectable', groupIcon: '💉' },
  { name: 'Nandrolon Decanoat', category: 'ped', adminType: 'injection', defaultDosage: '200', defaultUnit: 'mg', defaultFrequency: '1x/Woche', ester: 'Decanoat', halfLifeDays: 6, group: 'aas_injectable', groupIcon: '💉' },
  { name: 'Trenbolon Acetat', category: 'ped', adminType: 'injection', defaultDosage: '100', defaultUnit: 'mg', defaultFrequency: 'alle 3 Tage', ester: 'Acetat', halfLifeDays: 1, group: 'aas_injectable', groupIcon: '💉' },
  { name: 'Trenbolon Enantat', category: 'ped', adminType: 'injection', defaultDosage: '200', defaultUnit: 'mg', defaultFrequency: '1x/Woche', ester: 'Enantat', halfLifeDays: 5, group: 'aas_injectable', groupIcon: '💉' },
  { name: 'Boldenon Undecylenat', category: 'ped', adminType: 'injection', defaultDosage: '300', defaultUnit: 'mg', defaultFrequency: '1x/Woche', ester: 'Undecylenat', halfLifeDays: 14, group: 'aas_injectable', groupIcon: '💉' },
  { name: 'Drostanolon (Masteron)', category: 'ped', adminType: 'injection', defaultDosage: '200', defaultUnit: 'mg', defaultFrequency: '1x/Woche', group: 'aas_injectable', groupIcon: '💉' },
  { name: 'Methenolon (Primobolan)', category: 'ped', adminType: 'injection', defaultDosage: '200', defaultUnit: 'mg', defaultFrequency: '1x/Woche', group: 'aas_injectable', groupIcon: '💉' },

  // AAS Oral
  { name: 'Oxandrolon (Anavar)', category: 'ped', adminType: 'oral', defaultDosage: '20', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'aas_oral', groupIcon: '💊' },
  { name: 'Stanozolol (Winstrol)', category: 'ped', adminType: 'oral', defaultDosage: '30', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'aas_oral', groupIcon: '💊' },
  { name: 'Oxymetholon (Anadrol)', category: 'ped', adminType: 'oral', defaultDosage: '50', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'aas_oral', groupIcon: '💊' },
  { name: 'Methandienon (Dianabol)', category: 'ped', adminType: 'oral', defaultDosage: '30', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'aas_oral', groupIcon: '💊' },
  { name: 'Turinabol', category: 'ped', adminType: 'oral', defaultDosage: '40', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'aas_oral', groupIcon: '💊' },
  { name: 'Mesterolon (Proviron)', category: 'ped', adminType: 'oral', defaultDosage: '50', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'aas_oral', groupIcon: '💊' },

  // Peptides & Hormones
  { name: 'HGH (Somatropin)', category: 'ped', adminType: 'subcutaneous', defaultDosage: '4', defaultUnit: 'IU', defaultFrequency: 'täglich', group: 'peptides', groupIcon: '🧬' },
  { name: 'IGF-1', category: 'ped', adminType: 'subcutaneous', defaultDosage: '50', defaultUnit: 'mcg', defaultFrequency: 'täglich', group: 'peptides', groupIcon: '🧬' },
  { name: 'HCG', category: 'ped', adminType: 'subcutaneous', defaultDosage: '500', defaultUnit: 'IU', defaultFrequency: '2x/Woche', group: 'peptides', groupIcon: '🧬' },
  { name: 'BPC-157', category: 'ped', adminType: 'subcutaneous', defaultDosage: '250', defaultUnit: 'mcg', defaultFrequency: '2x/Woche', group: 'peptides', groupIcon: '🧬' },
  { name: 'TB-500', category: 'ped', adminType: 'subcutaneous', defaultDosage: '2', defaultUnit: 'mg', defaultFrequency: '1x/Woche', group: 'peptides', groupIcon: '🧬' },
  { name: 'CJC-1295 + Ipamorelin', category: 'ped', adminType: 'subcutaneous', defaultDosage: '300', defaultUnit: 'mcg', defaultFrequency: 'täglich', group: 'peptides', groupIcon: '🧬' },
  { name: 'MK-677 (Ibutamoren)', category: 'ped', adminType: 'oral', defaultDosage: '25', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'peptides', groupIcon: '🧬' },

  // SARMs
  { name: 'Ostarin (MK-2866)', category: 'ped', adminType: 'oral', defaultDosage: '20', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'sarms', groupIcon: '🔬' },
  { name: 'Ligandrol (LGD-4033)', category: 'ped', adminType: 'oral', defaultDosage: '10', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'sarms', groupIcon: '🔬' },
  { name: 'RAD-140 (Testolone)', category: 'ped', adminType: 'oral', defaultDosage: '10', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'sarms', groupIcon: '🔬' },
  { name: 'YK-11', category: 'ped', adminType: 'oral', defaultDosage: '10', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'sarms', groupIcon: '🔬' },

  // Anti-Estrogens / PCT
  { name: 'Tamoxifen (Nolvadex)', category: 'medication', adminType: 'oral', defaultDosage: '20', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'pct', groupIcon: '🛡️' },
  { name: 'Clomifen (Clomid)', category: 'medication', adminType: 'oral', defaultDosage: '50', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'pct', groupIcon: '🛡️' },
  { name: 'Anastrozol (Arimidex)', category: 'medication', adminType: 'oral', defaultDosage: '0.5', defaultUnit: 'mg', defaultFrequency: '2x/Woche', group: 'pct', groupIcon: '🛡️' },
  { name: 'Letrozol (Femara)', category: 'medication', adminType: 'oral', defaultDosage: '0.5', defaultUnit: 'mg', defaultFrequency: '2x/Woche', group: 'pct', groupIcon: '🛡️' },
  { name: 'Exemestan (Aromasin)', category: 'medication', adminType: 'oral', defaultDosage: '12.5', defaultUnit: 'mg', defaultFrequency: '2x/Woche', group: 'pct', groupIcon: '🛡️' },
  { name: 'Cabergolin (Dostinex)', category: 'medication', adminType: 'oral', defaultDosage: '0.25', defaultUnit: 'mg', defaultFrequency: '2x/Woche', group: 'pct', groupIcon: '🛡️' },

  // GLP-1 (Medical)
  { name: 'Semaglutid (Wegovy)', category: 'medication', adminType: 'subcutaneous', defaultDosage: '2.4', defaultUnit: 'mg', defaultFrequency: '1x/Woche', group: 'glp1', groupIcon: '💉' },
  { name: 'Semaglutid (Ozempic)', category: 'medication', adminType: 'subcutaneous', defaultDosage: '1', defaultUnit: 'mg', defaultFrequency: '1x/Woche', group: 'glp1', groupIcon: '💉' },
  { name: 'Tirzepatid (Mounjaro)', category: 'medication', adminType: 'subcutaneous', defaultDosage: '5', defaultUnit: 'mg', defaultFrequency: '1x/Woche', group: 'glp1', groupIcon: '💉' },

  // Fat Burners
  { name: 'Clenbuterol', category: 'ped', adminType: 'oral', defaultDosage: '40', defaultUnit: 'mcg', defaultFrequency: 'täglich', group: 'fatburner', groupIcon: '🔥' },
  { name: 'T3 (Liothyronin)', category: 'ped', adminType: 'oral', defaultDosage: '25', defaultUnit: 'mcg', defaultFrequency: 'täglich', group: 'fatburner', groupIcon: '🔥' },
];

// ── TRT PRESETS (separate, always visible when TRT category selected) ──
export const TRT_PRESETS: SubstancePreset[] = [
  { name: 'Testosteron Enantat (TRT)', category: 'trt', adminType: 'injection', defaultDosage: '125', defaultUnit: 'mg', defaultFrequency: '1x/Woche', ester: 'Enantat', halfLifeDays: 4.5, group: 'trt', groupIcon: '💉' },
  { name: 'Testosteron Cypionat (TRT)', category: 'trt', adminType: 'injection', defaultDosage: '100', defaultUnit: 'mg', defaultFrequency: '1x/Woche', ester: 'Cypionat', halfLifeDays: 8, group: 'trt', groupIcon: '💉' },
  { name: 'Testosteron Undecanoat (Nebido)', category: 'trt', adminType: 'injection', defaultDosage: '1000', defaultUnit: 'mg', defaultFrequency: 'alle 14 Tage', ester: 'Undecanoat', halfLifeDays: 20.9, group: 'trt', groupIcon: '💉' },
  { name: 'Testosteron Gel (Androgel)', category: 'trt', adminType: 'transdermal', defaultDosage: '50', defaultUnit: 'mg', defaultFrequency: 'täglich', group: 'trt', groupIcon: '🧴' },
  { name: 'HCG (TRT-begleitend)', category: 'trt', adminType: 'subcutaneous', defaultDosage: '250', defaultUnit: 'IU', defaultFrequency: '2x/Woche', group: 'trt', groupIcon: '💉' },
  { name: 'Anastrozol (TRT-begleitend)', category: 'trt', adminType: 'oral', defaultDosage: '0.25', defaultUnit: 'mg', defaultFrequency: '2x/Woche', group: 'trt', groupIcon: '💊' },
];

// ── GROUP LABELS ────────────────────────────────────────────────────
export const PRESET_GROUP_LABELS: Record<string, { de: string; en: string }> = {
  protein: { de: 'Protein & Aminosäuren', en: 'Protein & Amino Acids' },
  performance: { de: 'Kreatin & Performance', en: 'Creatine & Performance' },
  vitamins: { de: 'Vitamine & Minerale', en: 'Vitamins & Minerals' },
  health: { de: 'Gesundheit & Recovery', en: 'Health & Recovery' },
  stimulants: { de: 'Stimulanzien', en: 'Stimulants' },
  trt: { de: 'TRT / Hormonersatztherapie', en: 'TRT / Hormone Replacement' },
  aas_injectable: { de: 'AAS (Injectable)', en: 'AAS (Injectable)' },
  aas_oral: { de: 'AAS (Oral)', en: 'AAS (Oral)' },
  peptides: { de: 'Peptide & Hormone', en: 'Peptides & Hormones' },
  sarms: { de: 'SARMs', en: 'SARMs' },
  pct: { de: 'Anti-Östrogene / PCT', en: 'Anti-Estrogens / PCT' },
  glp1: { de: 'GLP-1-Agonisten', en: 'GLP-1 Agonists' },
  fatburner: { de: 'Fat Burner', en: 'Fat Burners' },
};

/**
 * Get presets filtered by category and optional search query
 */
export function getFilteredPresets(
  category: SubstanceCategory,
  searchQuery: string,
  pedEnabled: boolean,
): SubstancePreset[] {
  let presets: SubstancePreset[] = [];

  if (category === 'supplement') {
    presets = SUPPLEMENT_PRESETS;
  } else if (category === 'trt') {
    presets = TRT_PRESETS;
  } else if (category === 'ped' && pedEnabled) {
    presets = PED_PRESETS;
  } else if (category === 'medication') {
    // Show GLP-1 and PCT from PED_PRESETS that are categorized as medication
    presets = PED_PRESETS.filter(p => p.category === 'medication');
  }

  if (!searchQuery.trim()) return presets;

  const query = searchQuery.toLowerCase();
  return presets.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.group.toLowerCase().includes(query)
  );
}
