/**
 * SubstanceReminderCard — Erinnerung fuer woechentliche Substanzen (UX4).
 *
 * Beispiel: Wegovy (Semaglutid 2,4mg) wird woechentlich injiziert. User
 * vergisst leicht den Tag. Diese Karte:
 *   1. Liest alle aktiven Substanzen mit `frequency` enthaltend "week"/"woch"
 *   2. Findet pro Substanz den letzten log -> day-of-week als Anker
 *   3. Berechnet "today should be the dose-day" oder "X Tage ueberfaellig"
 *   4. Zeigt Quick-Log-Button (oeffnet das LogSubstanceDialog)
 *
 * Keine DB-Schema-Aenderung — alles aus existierenden Daten abgeleitet. Wenn
 * eine Substanz noch nie geloggt wurde, gibt's keinen Anker → nicht angezeigt.
 *
 * Use-Cases ueber Wegovy hinaus: TRT-Injektionen (woechentlich), B12-Shots,
 * jede andere weekly-injection. Daily/monthly werden NICHT angezeigt (different
 * UX-Pattern).
 */

import { useMemo } from 'react';
import { Syringe, AlertCircle, Check } from 'lucide-react';
import { useSubstances, useSubstanceLogs } from '../hooks/useSubstances';
import type { Substance, SubstanceLog } from '../../../types/health';

interface SubstanceReminderCardProps {
  /** Optional: when clicked, open the substance log dialog with this substance pre-selected */
  onQuickLog?: (substanceId: string) => void;
  language?: 'de' | 'en';
}

interface ReminderEntry {
  substance: Substance;
  lastLogDate: string;
  daysSinceLastDose: number;
  expectedAnchorWeekday: number;  // 0=Sun, 1=Mon, ... (same as Date.getDay())
  status: 'due_today' | 'overdue' | 'upcoming' | 'recent';
  daysUntilOrOverdue: number;
}

function isWeeklyFrequency(freq: string | undefined): boolean {
  if (!freq) return false;
  const lower = freq.toLowerCase();
  return lower.includes('week') || lower.includes('wöch') || lower.includes('woch') || lower.includes('wkly');
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function SubstanceReminderCard({ onQuickLog, language }: SubstanceReminderCardProps) {
  const isDE = (language ?? 'de') === 'de';
  const { data: substances } = useSubstances(true);
  const { data: logs } = useSubstanceLogs(60);

  const reminders = useMemo<ReminderEntry[]>(() => {
    if (!substances || !logs) return [];
    const result: ReminderEntry[] = [];

    for (const sub of substances) {
      if (!isWeeklyFrequency(sub.frequency)) continue;
      // Letzter Log fuer diese Substanz finden
      const lastLog = logs.find((l: SubstanceLog) => l.substance_id === sub.id && l.taken);
      if (!lastLog) continue;  // Noch nie geloggt → kein Anker

      const lastDate = startOfDay(new Date(lastLog.date));
      const today = startOfDay(new Date());
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86_400_000);

      // Erwarteter naechster Dosis-Tag = letzter + 7 Tage
      const expectedAnchorWeekday = lastDate.getDay();
      const daysSinceExpected = diffDays - 7;

      let status: ReminderEntry['status'];
      if (diffDays < 5) status = 'recent';
      else if (diffDays === 7) status = 'due_today';
      else if (diffDays > 7) status = 'overdue';
      else status = 'upcoming';  // 5,6 Tage seit Dosis

      result.push({
        substance: sub,
        lastLogDate: lastLog.date,
        daysSinceLastDose: diffDays,
        expectedAnchorWeekday,
        status,
        daysUntilOrOverdue: daysSinceExpected,
      });
    }
    // Sort: overdue first, then due_today, then upcoming, then recent
    const order = { overdue: 0, due_today: 1, upcoming: 2, recent: 3 } as const;
    return result.sort((a, b) => order[a.status] - order[b.status]);
  }, [substances, logs]);

  if (reminders.length === 0) return null;

  // Nur upcoming/due/overdue rendern (recent ausblenden — kein Mehrwert auf Cockpit)
  const visible = reminders.filter(r => r.status !== 'recent');
  if (visible.length === 0) return null;

  const weekdayNames = isDE
    ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-theme-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Syringe className="h-4 w-4 text-blue-600" strokeWidth={1.75} />
        <h3 className="text-xs font-bold uppercase tracking-wide text-blue-800">
          {isDE ? 'Substanz-Erinnerungen' : 'Substance Reminders'}
        </h3>
      </div>

      <div className="space-y-2">
        {visible.map(r => {
          const colorClass =
            r.status === 'overdue' ? 'border-red-300 bg-red-50' :
            r.status === 'due_today' ? 'border-amber-300 bg-amber-50' :
            'border-blue-200 bg-white';

          const StatusIcon =
            r.status === 'overdue' ? AlertCircle :
            r.status === 'due_today' ? AlertCircle :
            Check;

          const statusColor =
            r.status === 'overdue' ? 'text-red-600' :
            r.status === 'due_today' ? 'text-amber-600' :
            'text-blue-500';

          const statusLabel =
            r.status === 'overdue'
              ? (isDE ? `${r.daysUntilOrOverdue} Tag${r.daysUntilOrOverdue > 1 ? 'e' : ''} ueberfaellig` : `${r.daysUntilOrOverdue} day${r.daysUntilOrOverdue > 1 ? 's' : ''} overdue`)
              : r.status === 'due_today'
                ? (isDE ? 'Heute faellig' : 'Due today')
                : (isDE ? `In ${7 - r.daysSinceLastDose} Tagen` : `In ${7 - r.daysSinceLastDose} days`);

          return (
            <div key={r.substance.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${colorClass}`}>
              <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {r.substance.name}
                  {r.substance.dosage && <span className="text-gray-500 font-normal ml-1.5">{r.substance.dosage}{r.substance.unit ?? ''}</span>}
                </p>
                <p className="text-[11px] text-gray-500">
                  {statusLabel} · {isDE ? 'Letzte Dosis' : 'Last dose'} {weekdayNames[r.expectedAnchorWeekday]}
                </p>
              </div>
              {onQuickLog && (
                <button
                  type="button"
                  onClick={() => onQuickLog(r.substance.id)}
                  className="touch-44 px-2.5 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {isDE ? 'Loggen' : 'Log'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
