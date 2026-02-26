import { useState, useEffect, useRef } from 'react';
import { Plus, Heart, Pill, Trash2, ClipboardList, Bell } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { BuddyQuickAccess } from '../shared/components/BuddyQuickAccess';
import { useTranslation } from '../i18n';
import { usePageBuddySuggestions } from '../features/buddy/hooks/usePageBuddySuggestions';
import { useBloodPressureLogs, useDeleteBloodPressure } from '../features/medical/hooks/useBloodPressure';
import { useSubstances, useSubstanceLogs, useDeleteSubstance } from '../features/medical/hooks/useSubstances';
import { useReminders, useAddReminder, useTodayReminderLogs, getTodayReminderStatus, useToggleReminder, useDeleteReminder } from '../features/reminders/hooks/useReminders';
import { AddBloodPressureDialog } from '../features/medical/components/AddBloodPressureDialog';
import { AddSubstanceDialog } from '../features/medical/components/AddSubstanceDialog';
import { LogSubstanceDialog } from '../features/medical/components/LogSubstanceDialog';
import { AddReminderDialog } from '../features/reminders/components/AddReminderDialog';
import { EditReminderDialog } from '../features/reminders/components/EditReminderDialog';
import { ReminderCard } from '../features/reminders/components/ReminderCard';
import { parseFrequencyToReminder } from '../features/reminders/lib/parseFrequency';
import { classifyBloodPressure } from '../lib/calculations';
import type { Reminder } from '../types/health';
import { formatDate, formatTime } from '../lib/utils';

export function MedicalPage() {
  const { t, language } = useTranslation();
  const medicalSuggestions = usePageBuddySuggestions('medical', language as 'de' | 'en');
  const [showBPDialog, setShowBPDialog] = useState(false);
  const [showAddSubstanceDialog, setShowAddSubstanceDialog] = useState(false);
  const [showLogSubstanceDialog, setShowLogSubstanceDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const { data: bpLogs, isLoading: bpLoading } = useBloodPressureLogs(10);
  const { data: substances } = useSubstances(true);
  const { data: substanceLogs } = useSubstanceLogs(10);
  const deleteBP = useDeleteBloodPressure();
  const deleteSubstance = useDeleteSubstance();

  // Reminders
  const { data: reminders } = useReminders(false); // all reminders (active + inactive)
  const { data: todayLogs } = useTodayReminderLogs();
  const addReminder = useAddReminder();
  const toggleReminder = useToggleReminder();
  const deleteReminder = useDeleteReminder();

  // ── Auto-create reminders for substances with frequency but no linked reminder ──
  // Uses a ref to track which substances we already created reminders for (prevents duplicates).
  // Runs only once per substance, even if reminders query re-fetches.
  const autoCreatedRef = useRef<Set<string>>(new Set());
  const isCreatingRef = useRef(false);

  useEffect(() => {
    if (!substances || !reminders || isCreatingRef.current) return;

    const unlinked = substances.filter(
      s => s.is_active && s.frequency && !reminders.some(r => r.substance_id === s.id) && !autoCreatedRef.current.has(s.id)
    );

    if (unlinked.length === 0) return;

    // Mark all as "being created" BEFORE any async call to prevent double-runs
    for (const sub of unlinked) {
      autoCreatedRef.current.add(sub.id);
    }

    isCreatingRef.current = true;

    // Create all missing reminders sequentially to avoid race conditions
    (async () => {
      for (const sub of unlinked) {
        const config = parseFrequencyToReminder(sub.frequency!);
        if (!config) continue;

        const title = language === 'de' ? `${sub.name} einnehmen` : `Take ${sub.name}`;
        try {
          await addReminder.mutateAsync({
            type: 'substance',
            title,
            substance_id: sub.id,
            time_period: 'morning',
            ...config,
          });
        } catch {
          // If creation fails, allow retry next time
          autoCreatedRef.current.delete(sub.id);
        }
      }
      isCreatingRef.current = false;
    })();
  }, [substances, reminders]); // eslint-disable-line react-hooks/exhaustive-deps

  const reminderStatus = reminders && todayLogs
    ? getTodayReminderStatus(reminders, todayLogs)
    : { pending: [], completed: [], totalDue: 0 };

  const locale = language === 'de' ? 'de-DE' : 'en-US';

  return (
    <PageShell title={t.medical.title}>
      <div className="space-y-4">
        {/* Buddy Quick Access */}
        <BuddyQuickAccess suggestions={medicalSuggestions} />

        {/* Blood Pressure Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <h3 className="font-semibold text-gray-900">{t.medical.bloodPressure}</h3>
            </div>
            <button
              onClick={() => setShowBPDialog(true)}
              className="p-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {bpLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
            </div>
          ) : bpLogs && bpLogs.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {bpLogs.slice(0, 5).map((bp) => {
                const { color } = classifyBloodPressure(bp.systolic, bp.diastolic);
                const classKey = `bp_${bp.classification}` as keyof typeof t.medical;
                const classLabel = t.medical[classKey] ?? bp.classification;
                return (
                  <div key={bp.id} className="px-4 py-2.5 flex items-center gap-3 group">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      color === 'green' ? 'bg-green-500' :
                      color === 'yellow' ? 'bg-yellow-500' :
                      color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {bp.systolic}/{bp.diastolic}
                        {bp.pulse && <span className="text-gray-400 font-normal"> · {bp.pulse} bpm</span>}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatDate(bp.date, locale)} {formatTime(bp.time, locale)} — {classLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBP.mutate(bp.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-400">{t.common.noData}</p>
              <button
                onClick={() => setShowBPDialog(true)}
                className="mt-2 text-xs text-teal-600 hover:underline"
              >
                {t.medical.addBP}
              </button>
            </div>
          )}
        </div>

        {/* Substances Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-500" />
              <h3 className="font-semibold text-gray-900">{t.medical.substances}</h3>
            </div>
            <div className="flex gap-1.5">
              {substances && substances.length > 0 && (
                <button
                  onClick={() => setShowLogSubstanceDialog(true)}
                  className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  title={t.medical.logSubstance}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setShowAddSubstanceDialog(true)}
                className="p-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                title={t.medical.addSubstance}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {substances && substances.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {substances.map((sub) => {
                const catKey = `cat_${sub.category}` as keyof typeof t.medical;
                const catLabel = t.medical[catKey] ?? sub.category ?? '';
                const linkedReminder = reminders?.find(r => r.substance_id === sub.id);
                return (
                  <div key={sub.id} className="px-4 py-2.5 group">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {catLabel}
                        </span>
                        {linkedReminder && (
                          <Bell className={`h-3 w-3 ${linkedReminder.is_active ? 'text-teal-500' : 'text-gray-300'}`} />
                        )}
                        <button
                          onClick={() => {
                            // Also delete linked reminder
                            if (linkedReminder) deleteReminder.mutate(linkedReminder.id);
                            deleteSubstance.mutate(sub.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                          title={t.medical.deleteSubstance}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {sub.dosage} {sub.unit} · {sub.frequency}
                      {sub.ester && ` · ${sub.ester}`}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-400">{t.common.noData}</p>
              <button
                onClick={() => setShowAddSubstanceDialog(true)}
                className="mt-2 text-xs text-teal-600 hover:underline"
              >
                {t.medical.addSubstance}
              </button>
            </div>
          )}
        </div>

        {/* Recent Substance Logs */}
        {substanceLogs && substanceLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900 text-sm">
                {t.medical.recentLogs}
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {substanceLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${log.taken ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{log.substance_name ?? 'Substanz'}</p>
                    <p className="text-[10px] text-gray-400">
                      {formatDate(log.date, locale)}
                      {log.dosage_taken && ` · ${log.dosage_taken}`}
                      {log.site && ` · ${t.medical[`site_${log.site}` as keyof typeof t.medical] ?? log.site}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminders Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-500" />
              <h3 className="font-semibold text-gray-900">{t.reminders.title}</h3>
              {reminderStatus.pending.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-medium">
                  {reminderStatus.pending.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowReminderDialog(true)}
              className="p-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {reminders && reminders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {reminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggle={(id, isActive) => toggleReminder.mutate({ id, is_active: isActive })}
                  onDelete={(id) => deleteReminder.mutate(id)}
                  onEdit={(r) => setEditingReminder(r)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-400">
                {t.medical.noReminders}
              </p>
              <button
                onClick={() => setShowReminderDialog(true)}
                className="mt-2 text-xs text-teal-600 hover:underline"
              >
                {t.reminders.addReminder}
              </button>
            </div>
          )}
        </div>
      </div>

      <AddBloodPressureDialog
        open={showBPDialog}
        onClose={() => setShowBPDialog(false)}
      />
      <AddSubstanceDialog
        open={showAddSubstanceDialog}
        onClose={() => setShowAddSubstanceDialog(false)}
      />
      <LogSubstanceDialog
        open={showLogSubstanceDialog}
        onClose={() => setShowLogSubstanceDialog(false)}
      />
      <AddReminderDialog
        open={showReminderDialog}
        onClose={() => setShowReminderDialog(false)}
      />
      <EditReminderDialog
        reminder={editingReminder}
        onClose={() => setEditingReminder(null)}
      />
    </PageShell>
  );
}
