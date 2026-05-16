/**
 * JargonTerm — Inline-Term mit click/hover-Tooltip-Glossar (UX6).
 *
 * Power+-Vokabular wie FFMI, PED, Mesozyklus, e1RM etc. wird fuer Normal-Nutzer
 * mit einer kurzen Erklaerung versehen. Click oeffnet Tooltip (mobile-tauglich),
 * hover zeigt es ebenfalls. Term selbst bleibt im Fluss-Text lesbar.
 *
 * Verwendung:
 *   <JargonTerm term="FFMI">FFMI</JargonTerm>
 *   <JargonTerm term="PED">PED</JargonTerm>
 */

import { useState } from 'react';
import { Info } from 'lucide-react';

/** Glossar: zentralisierte Erklaerungen. Erweitern wenn neue Begriffe auftauchen. */
export const GLOSSARY: Record<string, { de: string; en: string }> = {
  FFMI: {
    de: 'Fat-Free Mass Index — Magermasse pro Koerpergroesse. >25 ohne Hilfsmittel sehr selten. Vergleichbar mit BMI, aber ohne Fett-Anteil.',
    en: 'Fat-Free Mass Index — lean mass per height. >25 without aids is very rare. Like BMI but excluding fat.',
  },
  PED: {
    de: 'Performance Enhancing Drugs — Sammelbegriff fuer leistungssteigernde Substanzen (Anabolika, Hormone, etc.). In FitBuddy: optionales Power+-Feature fuer informierte Selbstdokumentation.',
    en: 'Performance Enhancing Drugs — collective term for performance substances (anabolics, hormones, etc.). In FitBuddy: optional Power+ feature for informed self-documentation.',
  },
  Mesozyklus: {
    de: 'Mesozyklus — 4-8 Wochen Trainingsblock mit progressiver Steigerung, gefolgt von einer Deload-Woche. Klassische Periodisierung im Krafttraining.',
    en: 'Mesocycle — 4-8 week training block with progressive overload, followed by a deload week. Classic strength training periodization.',
  },
  Mesocycle: {
    de: 'Mesozyklus — 4-8 Wochen Trainingsblock mit progressiver Steigerung, gefolgt von einer Deload-Woche.',
    en: 'Mesocycle — 4-8 week training block with progressive overload, followed by a deload week.',
  },
  e1RM: {
    de: 'Estimated 1-Rep-Max (Epley): geschaetztes Maximalgewicht fuer einen einzigen sauberen Wiederhol. Formel: Gewicht × (1 + Wdh/30).',
    en: 'Estimated 1-Rep-Max (Epley): projected single-rep maximum. Formula: weight × (1 + reps/30).',
  },
  RPE: {
    de: 'Rate of Perceived Exertion — wahrgenommene Anstrengung 1-10. 10 = absolutes Failure, 8 = noch 2 Wiederholungen moeglich (2 RIR).',
    en: 'Rate of Perceived Exertion — perceived effort 1-10. 10 = absolute failure, 8 = 2 reps in reserve (2 RIR).',
  },
  RIR: {
    de: 'Reps in Reserve — wie viele Wiederholungen haettest du noch geschafft? 2 RIR ≈ RPE 8.',
    en: 'Reps in Reserve — how many more reps could you have done? 2 RIR ≈ RPE 8.',
  },
  'Peak-Week': {
    de: 'Peak Week — die letzte Woche vor einem Wettkampf/Foto-Shoot. KH-Cycling, Wasser-Loading, Natrium-Manipulation zur optimalen Definition.',
    en: 'Peak Week — the final week before a competition/photoshoot. Carb-cycling, water loading, sodium manipulation for optimal definition.',
  },
  PCT: {
    de: 'Post-Cycle-Therapy — Hormon-Wiederherstellung nach einem Substanzen-Zyklus (SERMs wie Tamoxifen/Clomiphen, ggf. hCG).',
    en: 'Post-Cycle-Therapy — hormonal recovery after a substance cycle (SERMs like tamoxifen/clomiphene, optionally hCG).',
  },
  TDEE: {
    de: 'Total Daily Energy Expenditure — geschaetzter Kalorienverbrauch pro Tag (BMR + Aktivitaet). Basis fuer Cut-/Bulk-Berechnung.',
    en: 'Total Daily Energy Expenditure — estimated daily calorie burn (BMR + activity). Basis for cut/bulk calculation.',
  },
  BMR: {
    de: 'Basal Metabolic Rate — Grundumsatz in Ruhe. Was dein Koerper im Liegen ohne Bewegung verbrennt.',
    en: 'Basal Metabolic Rate — resting energy expenditure. What your body burns lying still without movement.',
  },
  'Cut': {
    de: 'Diaet-Phase mit Kaloriendefizit (typ. -300 bis -700/Tag) zum Fett-Abbau bei Muskelerhalt.',
    en: 'Cutting phase with calorie deficit (typ. -300 to -700/day) for fat loss while preserving muscle.',
  },
  'Bulk': {
    de: 'Aufbau-Phase mit Kalorienueberschuss (typ. +200 bis +500/Tag) fuer Muskelwachstum.',
    en: 'Bulking phase with calorie surplus (typ. +200 to +500/day) for muscle growth.',
  },
  ECLIA: {
    de: 'Electro-Chemiluminescence Immunoassay — Labor-Methode fuer Hormonmessungen. Standard bei vielen Laboren, fuer Estradiol bei Maennern aber weniger spezifisch als LC-MS/MS.',
    en: 'Electro-Chemiluminescence Immunoassay — lab method for hormone measurement. Common standard, less specific than LC-MS/MS for low estradiol values in men.',
  },
  'LC-MS/MS': {
    de: 'Liquid Chromatography Tandem Mass Spectrometry — Goldstandard fuer Hormonmessungen, hochsensitiv und spezifisch.',
    en: 'Liquid Chromatography Tandem Mass Spectrometry — gold standard for hormone measurement, highly sensitive and specific.',
  },
};

interface JargonTermProps {
  term: keyof typeof GLOSSARY | string;
  children?: React.ReactNode;
  language?: 'de' | 'en';
  /** "subtle" = nur dotted-underline; "icon" = info-icon daneben (default) */
  display?: 'subtle' | 'icon';
}

export function JargonTerm({ term, children, language, display = 'icon' }: JargonTermProps) {
  const [open, setOpen] = useState(false);
  const isDE = (language ?? (typeof document !== 'undefined' && document.documentElement.lang === 'de' ? 'de' : 'en')) === 'de';

  const entry = GLOSSARY[term as keyof typeof GLOSSARY];
  if (!entry) {
    // Kein Glossar-Eintrag → einfach den Begriff rendern
    return <>{children ?? term}</>;
  }

  const explanation = isDE ? entry.de : entry.en;
  const label = children ?? term;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-0.5 ${display === 'subtle'
          ? 'underline decoration-dotted decoration-gray-400 underline-offset-2 text-inherit'
          : 'text-inherit cursor-help'}`}
        aria-label={`${term} — Erklaerung anzeigen`}
        aria-expanded={open}
      >
        {label}
        {display === 'icon' && <Info className="h-3 w-3 text-gray-400 ml-0.5" aria-hidden="true" />}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 max-w-[80vw] p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg leading-snug normal-case font-normal pointer-events-none"
        >
          <span className="font-semibold block mb-0.5">{term}</span>
          {explanation}
          {/* Arrow */}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
