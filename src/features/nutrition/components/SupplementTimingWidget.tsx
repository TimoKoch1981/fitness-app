/**
 * SupplementTimingWidget — Visual UI card showing evidence-based supplement timing.
 * Data sourced from the supplementTiming AI skill but rendered as a standalone React component.
 * Visible in Power/Power+ modes when showSupplementTiming is true.
 *
 * F15: Bodybuilder-Modus
 */

import { useState } from 'react';
import { Pill, ChevronDown, ChevronUp, Clock, AlertTriangle, Beaker, Info } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { TrainingPhase } from '../../../types/health';

interface SupplementInfo {
  id: string;
  name: string;
  nameDe: string;
  emoji: string;
  dosage: string;
  dosageDe: string;
  timing: string;
  timingDe: string;
  notes: string;
  notesDe: string;
  evidence: string; // e.g. "ISSN Level A"
  pmid: string;
}

const SUPPLEMENTS: SupplementInfo[] = [
  {
    id: 'creatine',
    name: 'Creatine',
    nameDe: 'Kreatin',
    emoji: '💪',
    dosage: '3-5g/day',
    dosageDe: '3-5g/Tag',
    timing: 'Any time — consistency > timing',
    timingDe: 'Egal wann — Konsistenz > Timing',
    notes: 'Take with carbs for improved uptake. Only supplement with Level A evidence for strength.',
    notesDe: 'Mit Kohlenhydraten fuer verbesserte Aufnahme. Einziges Supplement mit Level-A-Evidenz fuer Kraft.',
    evidence: 'ISSN Level A',
    pmid: '28615996',
  },
  {
    id: 'whey',
    name: 'Whey Protein',
    nameDe: 'Whey Protein',
    emoji: '🥛',
    dosage: '0.4-0.55g/kg per meal',
    dosageDe: '0.4-0.55g/kg pro Mahlzeit',
    timing: 'Post-workout within 2h',
    timingDe: 'Post-Workout innerhalb 2h',
    notes: '4-6 meals/day for optimal MPS. Use isolate if lactose sensitive.',
    notesDe: '4-6 Mahlzeiten/Tag fuer optimale MPS. Isolat bei Laktose-Empfindlichkeit.',
    evidence: 'ISSN',
    pmid: '29497353',
  },
  {
    id: 'casein',
    name: 'Casein',
    nameDe: 'Casein',
    emoji: '🌙',
    dosage: '30-40g',
    dosageDe: '30-40g',
    timing: 'Before bed (slow digestion, 6-8h amino supply)',
    timingDe: 'Vor dem Schlafen (langsame Verdauung, 6-8h Aminosaeure-Versorgung)',
    notes: 'Alternative: 400g low-fat quark (~48g protein). Improves overnight MPS.',
    notesDe: 'Alternative: 400g Magerquark (~48g Protein). Verbessert naechtliche MPS.',
    evidence: 'RCT',
    pmid: '22330017',
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    nameDe: 'Koffein',
    emoji: '☕',
    dosage: '3-6mg/kg, max 400mg/day',
    dosageDe: '3-6mg/kg, max 400mg/Tag',
    timing: 'Pre-workout, 30-60min before',
    timingDe: 'Pre-Workout, 30-60min vorher',
    notes: 'Cutoff: <200mg after 2pm. Tolerance reset: 2 weeks off every 2-3 months.',
    notesDe: 'Cutoff: <200mg nach 14 Uhr. Toleranz-Reset: 2 Wochen Pause alle 2-3 Monate.',
    evidence: 'ISSN Position Stand',
    pmid: '33388079',
  },
  {
    id: 'vitamin_d',
    name: 'Vitamin D3',
    nameDe: 'Vitamin D3',
    emoji: '☀️',
    dosage: '2000-5000 IU/day + K2 (100-200mcg)',
    dosageDe: '2000-5000 IE/Tag + K2 (100-200mcg)',
    timing: 'Morning with a fat-containing meal',
    timingDe: 'Morgens mit fetthaltiger Mahlzeit',
    notes: 'Target: 40-60 ng/ml blood level. Indoor athletes often deficient.',
    notesDe: 'Ziel: 40-60 ng/ml Blutlevel. Indoor-Athleten haeufiger defizient.',
    evidence: 'Meta-Analysis',
    pmid: '17634462',
  },
  {
    id: 'beta_alanine',
    name: 'Beta-Alanine',
    nameDe: 'Beta-Alanin',
    emoji: '⚡',
    dosage: '3.2-6.4g/day (split 2-3x)',
    dosageDe: '3.2-6.4g/Tag (2-3x splitten)',
    timing: 'Split throughout the day (reduces tingling)',
    timingDe: '2-3x taeglich splitten (reduziert Kribbeln)',
    notes: 'Full effect after 2-4 weeks loading. Benefits sets 60-240 seconds.',
    notesDe: 'Voller Effekt nach 2-4 Wochen Loading. Nutzen bei Sets 60-240 Sekunden.',
    evidence: 'ISSN',
    pmid: '26175657',
  },
  {
    id: 'citrulline',
    name: 'L-Citrulline',
    nameDe: 'L-Citrullin',
    emoji: '🍉',
    dosage: '6-8g (or 8-10g Citrulline Malate 2:1)',
    dosageDe: '6-8g (oder 8-10g Citrullin-Malat 2:1)',
    timing: 'Pre-workout, 30-60min before',
    timingDe: 'Pre-Workout, 30-60min vorher',
    notes: 'NO production, blood flow, pump. Moderate effect for strength endurance.',
    notesDe: 'NO-Produktion, Durchblutung, Pump. Moderate Effektgroesse fuer Kraftausdauer.',
    evidence: 'RCT',
    pmid: '31977835',
  },
  {
    id: 'omega3',
    name: 'Omega-3 EPA/DHA',
    nameDe: 'Omega-3 EPA/DHA',
    emoji: '🐟',
    dosage: '2-3g EPA+DHA/day',
    dosageDe: '2-3g EPA+DHA/Tag',
    timing: 'With a meal (improved absorption)',
    timingDe: 'Mit Mahlzeit (verbesserte Absorption)',
    notes: 'Triglyceride form > ethyl ester. Anti-inflammatory, supports recovery.',
    notesDe: 'Triglycerid-Form > Ethylester. Anti-inflammatorisch, unterstuetzt Erholung.',
    evidence: 'Systematic Review',
    pmid: '30504512',
  },
];

/** Phase-specific supplement hints */
const PHASE_HINTS: Record<string, { de: string; en: string }> = {
  cut: {
    de: 'Cut-Phase: Kreatin beibehalten (schuetzt Kraft). Protein hoch halten (2.3-3.1g/kg). Koffein nuetzlich fuer Leistung im Defizit.',
    en: 'Cut phase: Keep creatine (protects strength). Keep protein high (2.3-3.1g/kg). Caffeine useful for performance in deficit.',
  },
  bulk: {
    de: 'Bulk-Phase: Kreatin + Post-WO Protein (20-40g) + Carbs. Beta-Alanin fuer hohe Wiederholungszahlen.',
    en: 'Bulk phase: Creatine + post-workout protein (20-40g) + carbs. Beta-alanine for high rep ranges.',
  },
  peak_week: {
    de: 'Peak Week: Nur bewusst ergaenzen. Natrium/Wasser-Interaktionen beachten. Koffein-Toleranz bewusst nutzen.',
    en: 'Peak week: Supplement mindfully. Watch sodium/water interactions. Use caffeine tolerance strategically.',
  },
};

interface SupplementTimingWidgetProps {
  phase?: TrainingPhase;
}

export function SupplementTimingWidget({ phase }: SupplementTimingWidgetProps) {
  const { language } = useTranslation();
  const de = language === 'de';
  const [expanded, setExpanded] = useState(false);
  const [expandedSupp, setExpandedSupp] = useState<string | null>(null);

  const phaseHint = phase ? PHASE_HINTS[phase] : null;

  // Show first 4 collapsed, all when expanded
  const visibleSupplements = expanded ? SUPPLEMENTS : SUPPLEMENTS.slice(0, 4);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Pill className="h-3.5 w-3.5 text-indigo-500" />
          <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">
            {de ? 'Supplement-Timing' : 'Supplement Timing'}
          </p>
        </div>
        <p className="text-[10px] text-gray-400">
          {de ? 'Evidenzbasierte Einnahme-Empfehlungen' : 'Evidence-based intake recommendations'}
        </p>
      </div>

      {/* Phase-specific hint */}
      {phaseHint && (
        <div className="mx-3 mb-2 px-2.5 py-1.5 bg-indigo-50 rounded-lg">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-indigo-700 leading-relaxed">
              {de ? phaseHint.de : phaseHint.en}
            </p>
          </div>
        </div>
      )}

      {/* Supplement cards */}
      <div className="px-3 pb-2 space-y-1.5">
        {visibleSupplements.map((supp) => {
          const isOpen = expandedSupp === supp.id;
          return (
            <div
              key={supp.id}
              className="border border-gray-100 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedSupp(isOpen ? null : supp.id)}
                className="w-full flex items-center justify-between px-2.5 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm flex-shrink-0">{supp.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {de ? supp.nameDe : supp.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                      <p className="text-[10px] text-gray-500 truncate">
                        {de ? supp.timingDe : supp.timing}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full font-medium">
                    {supp.evidence}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-2.5 pb-2.5 space-y-1.5 bg-gray-50/50">
                  <div className="flex items-center gap-1.5">
                    <Beaker className="h-3 w-3 text-gray-400" />
                    <p className="text-[10px] text-gray-700">
                      <span className="font-medium">{de ? 'Dosis:' : 'Dose:'}</span>{' '}
                      {de ? supp.dosageDe : supp.dosage}
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Info className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {de ? supp.notesDe : supp.notes}
                    </p>
                  </div>
                  <p className="text-[9px] text-gray-400 pl-4">
                    PMID: {supp.pmid}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more/less toggle */}
      {SUPPLEMENTS.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-[10px] text-indigo-500 hover:text-indigo-600 font-medium border-t border-gray-100 transition-colors"
        >
          {expanded
            ? (de ? 'Weniger anzeigen' : 'Show less')
            : (de ? `Alle ${SUPPLEMENTS.length} anzeigen` : `Show all ${SUPPLEMENTS.length}`)
          }
        </button>
      )}
    </div>
  );
}
