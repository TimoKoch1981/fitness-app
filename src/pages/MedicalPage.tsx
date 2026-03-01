import { useState } from 'react';
import { Plus, Heart, Pill, Trash2, ClipboardList, Bell, Moon, Stethoscope } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { BuddyQuickAccess } from '../shared/components/BuddyQuickAccess';
import { useTranslation } from '../i18n';
import { usePageBuddySuggestions } from '../features/buddy/hooks/usePageBuddySuggestions';
import { useBloodPressureLogs, useDeleteBloodPressure } from '../features/medical/hooks/useBloodPressure';
import { useSubstances, useSubstanceLogs, useDeleteSubstance } from '../features/medical/hooks/useSubstances';
import { useReminders, useTodayReminderLogs, getTodayReminderStatus, useToggleReminder, useDeleteReminder } from '../features/reminders/hooks/useReminders';
import { AddBloodPressureDialog } from '../features/medical/components/AddBloodPressureDialog';
import { AddSubstanceDialog } from '../features/medical/components/AddSubstanceDialog';
import { LogSubstanceDialog } from '../features/medical/components/LogSubstanceDialog';
import { AddReminderDialog } from '../features/reminders/components/AddReminderDialog';
import { EditReminderDialog } from '../features/reminders/components/EditReminderDialog';
import { ReminderCard } from '../features/reminders/components/ReminderCard';
import { classifyBloodPressure } from '../lib/calculations';
import type { Reminder } from '../types/health';
import { formatDate, formatTime } from '../lib/utils';
import { useTrainingMode } from '../shared/hooks/useTrainingMode';
import { DoctorReportButton } from '../features/medical/components/DoctorReportButton';
import { useSleepLogs, useDeleteSleepLog, formatSleepDuration } from '../features/sleep/hooks/useSleep';
import { AddSleepDialog } from '../features/sleep/components/AddSleepDialog';
import { useMenstrualCycleLogs, useDeleteCycleLog, getCyclePhaseEmoji } from '../features/medical/hooks/useMenstrualCycle';
import { AddCycleLogDialog } from '../features/medical/components/AddCycleLogDialog';
import { useProfile } from '../features/auth/hooks/useProfile';
import { REDSWarningBanner } from '../shared/components/REDSWarningBanner';
import { useSymptomLogs, useDeleteSymptomLog, getSymptomEmoji, getSeverityEmoji } from '../features/medical/hooks/useSymptomLogs';
import { AddSymptomDialog } from '../features/medical/components/AddSymptomDialog';

export function MedicalPage() {
  const { t, language } = useTranslation();
  const medicalSuggestions = usePageBuddySuggestions('medical', language as 'de' | 'en');
  const { showDoctorReport } = useTrainingMode();
  const [showBPDialog, setShowBPDialog] = useState(false);
  const [showAddSubstanceDialog, setShowAddSubstanceDialog] = useState(false);
  const [showLogSubstanceDialog, setShowLogSubstanceDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showSleepDialog, setShowSleepDialog] = useState(false);
  const [showCycleDialog, setShowCycleDialog] = useState(false);
  const [showSymptomDialog, setShowSymptomDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const { data: profile } = useProfile();
  const showCycleTracker = profile?.gender === 'female' || profile?.gender === 'other';
  const { data: bpLogs, isLoading: bpLoading } = useBloodPressureLogs(10);
  const { data: sleepLogs, isLoading: sleepLoading } = useSleepLogs(10);
  const deleteSleep = useDeleteSleepLog();
  const { data: cycleLogs, isLoading: cycleLoading } = useMenstrualCycleLogs(10);
  const deleteCycle = useDeleteCycleLog();
  const { data: symptomLogs, isLoading: symptomLoading } = useSymptomLogs(10);
  const deleteSymptom = useDeleteSymptomLog();
  const { data: substances } = useSubstances(true);
  const { data: substanceLogs } = useSubstanceLogs(10);
  const deleteBP = useDeleteBloodPressure();
  const deleteSubstance = useDeleteSubstance();

  // Reminders
  const { data: reminders } = useReminders(false); // all reminders (active + inactive)
  const { data: todayLogs } = useTodayReminderLogs();
  const toggleReminder = useToggleReminder();
  const deleteReminder = useDeleteReminder();

  // Note: Reminder auto-creation is handled by AddSubstanceDialog on submit.
  // Previously there was a useEffect here that also auto-created reminders,
  // but this caused race conditions leading to duplicate reminders.

  const reminderStatus = reminders && todayLogs
    ? getTodayReminderStatus(reminders, todayLogs)
    : { pending: [], completed: [], totalDue: 0 };

  const locale = language === 'de' ? 'de-DE' : 'en-US';

  return (
    <PageShell title={t.medical.title}>
      <div className="space-y-4">
        {/* Buddy Quick Access */}
        <BuddyQuickAccess suggestions={medicalSuggestions} />

        {/* Doctor Report Button — Power+ Mode */}
        {showDoctorReport && (
          <DoctorReportButton />
        )}

        {/* RED-S / Underweight Warning */}
        <REDSWarningBanner />

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
            <>
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
              {/* BP classification disclaimer — ESC/ESH reference, not a diagnosis */}
              <p className="px-4 py-2 text-[9px] text-gray-300 border-t border-gray-50 select-none">
                ⓘ {t.medical.bpDisclaimer}
              </p>
            </>
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

        {/* Symptom Tracker Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-gray-900">
                {((t as Record<string, unknown>).symptoms as Record<string, string>)?.title ?? 'Symptom-Tracker'}
              </h3>
            </div>
            <button
              onClick={() => setShowSymptomDialog(true)}
              className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {symptomLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
            </div>
          ) : symptomLogs && symptomLogs.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {symptomLogs.slice(0, 5).map((log) => {
                const symptoms = (log.symptoms ?? []) as string[];
                const sym = (t as Record<string, unknown>).symptoms as Record<string, string> | undefined;
                return (
                  <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 group">
                    <span className="text-lg flex-shrink-0">
                      {log.severity ? getSeverityEmoji(log.severity) : '🩺'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1">
                        {symptoms.slice(0, 4).map((s) => (
                          <span key={s} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium">
                            {getSymptomEmoji(s as import('../types/health').SymptomKey)} {sym?.[s] ?? s.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {symptoms.length > 4 && (
                          <span className="text-[10px] text-gray-400">+{symptoms.length - 4}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatDate(log.date, locale)}
                        {log.notes && ` · ${log.notes.slice(0, 30)}${log.notes.length > 30 ? '...' : ''}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteSymptom.mutate(log.id)}
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
              <p className="text-sm text-gray-400">
                {((t as Record<string, unknown>).symptoms as Record<string, string>)?.noData ?? 'Keine Symptome erfasst'}
              </p>
            </div>
          )}
        </div>

        {/* Sleep & Recovery Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-500" />
              <h3 className="font-semibold text-gray-900">{t.sleep.title}</h3>
            </div>
            <button
              onClick={() => setShowSleepDialog(true)}
              className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {sleepLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
            </div>
          ) : sleepLogs && sleepLogs.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {sleepLogs.slice(0, 5).map((log) => {
                const qualityEmoji = ['', '\u{1F62B}', '\u{1F615}', '\u{1F610}', '\u{1F642}', '\u{1F634}'][log.quality ?? 3];
                const qualityKeys = ['', 'veryPoor', 'poor', 'fair', 'good', 'veryGood'] as const;
                const qualityLabel = log.quality ? t.sleep[qualityKeys[log.quality] as keyof typeof t.sleep] : '';
                return (
                  <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 group">
                    <span className="text-lg flex-shrink-0">{qualityEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {log.duration_minutes ? formatSleepDuration(log.duration_minutes) : '--'}
                        {qualityLabel && <span className="text-gray-400 font-normal"> · {qualityLabel}</span>}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatDate(log.date, locale)}
                        {log.bedtime && log.wake_time && ` · ${log.bedtime.slice(0, 5)} → ${log.wake_time.slice(0, 5)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteSleep.mutate(log.id)}
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
              <p className="text-sm text-gray-400">{t.sleep.noData}</p>
              <button
                onClick={() => setShowSleepDialog(true)}
                className="mt-2 text-xs text-indigo-600 hover:underline"
              >
                {t.sleep.addSleep}
              </button>
            </div>
          )}
        </div>

        {/* Menstrual Cycle Section — only for female/other */}
        {showCycleTracker && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className="text-base">{'\u{1FA78}'}</span>
                <h3 className="font-semibold text-gray-900">{t.cycle.title}</h3>
              </div>
              <button
                onClick={() => setShowCycleDialog(true)}
                className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {cycleLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto" />
              </div>
            ) : cycleLogs && cycleLogs.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {cycleLogs.slice(0, 5).map((log) => {
                  const phaseEmoji = getCyclePhaseEmoji(log.phase);
                  const phaseLabel = t.cycle[log.phase as keyof typeof t.cycle] ?? log.phase;
                  const flowLabel = log.flow_intensity && log.phase === 'menstruation'
                    ? t.cycle[`flow${log.flow_intensity.charAt(0).toUpperCase()}${log.flow_intensity.slice(1)}` as keyof typeof t.cycle]
                    : null;
                  const symptomCount = (log.symptoms ?? []).length;
                  return (
                    <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 group">
                      <span className="text-lg flex-shrink-0">{phaseEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {phaseLabel}
                          {flowLabel && <span className="text-gray-400 font-normal"> · {flowLabel}</span>}
                          {symptomCount > 0 && <span className="text-gray-400 font-normal"> · {symptomCount} {t.cycle.symptoms}</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatDate(log.date, locale)}
                          {log.mood && ` · ${['\u{1F622}', '\u{1F615}', '\u{1F610}', '\u{1F642}', '\u{1F60A}'][log.mood - 1]} ${t.cycle.mood}`}
                          {log.energy_level && ` · ${['\u{1FAB6}', '\u{1F634}', '\u{1F610}', '\u{26A1}', '\u{1F525}'][log.energy_level - 1]} ${t.cycle.energyLevel}`}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteCycle.mutate(log.id)}
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
                <p className="text-sm text-gray-400">{t.cycle.noData}</p>
                <button
                  onClick={() => setShowCycleDialog(true)}
                  className="mt-2 text-xs text-rose-600 hover:underline"
                >
                  {t.cycle.logCycle}
                </button>
              </div>
            )}
          </div>
        )}

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
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          sub.category === 'ped' ? 'bg-amber-100 text-amber-700' :
                          sub.category === 'trt' ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {sub.category === 'ped' ? `⚠ ${catLabel}` : catLabel}
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
              {/* PED disclaimer — shown when any PED/TRT substance exists */}
              {substances.some(s => s.category === 'ped' || s.category === 'trt') && (
                <p className="px-4 py-2 text-[9px] text-amber-400 border-t border-gray-50 select-none">
                  ⚠ {t.medical.pedDisclaimer}
                </p>
              )}
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

      <AddSleepDialog
        open={showSleepDialog}
        onClose={() => setShowSleepDialog(false)}
      />
      {showCycleTracker && (
        <AddCycleLogDialog
          open={showCycleDialog}
          onClose={() => setShowCycleDialog(false)}
        />
      )}
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
      <AddSymptomDialog
        open={showSymptomDialog}
        onClose={() => setShowSymptomDialog(false)}
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
