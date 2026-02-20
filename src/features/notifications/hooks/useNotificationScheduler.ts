import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useReminders, useTodayReminderLogs } from '../../reminders/hooks/useReminders';
import { useTranslation } from '../../../i18n';
import { getNotificationPreferences } from '../lib/notificationPreferences';
import { scheduleAllNotifications } from '../lib/notificationScheduler';
import { onNotificationClick, isSupported } from '../lib/notificationBridge';

/** How often to re-schedule notifications (ms) */
const RESCHEDULE_INTERVAL = 5 * 60 * 1000; // Every 5 minutes

/**
 * Main notification scheduler hook.
 *
 * - On mount: schedules all notifications for the next 24 hours
 * - Periodically re-checks (every 5 minutes) to catch new/changed reminders
 * - Registers native notification click handler (navigates to correct route)
 * - Only active when user is logged in and notifications are supported
 */
export function useNotificationScheduler() {
  const { user } = useAuth();
  const { data: reminders } = useReminders(true); // Active reminders only
  const { data: todayLogs } = useTodayReminderLogs();
  const { language } = useTranslation();
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScheduleRef = useRef<string>('');

  // ── Schedule Notifications ────────────────────────────────────────────

  useEffect(() => {
    if (!user || !isSupported()) return;
    if (!reminders) return;

    const doSchedule = async () => {
      const prefs = getNotificationPreferences(user.id);
      if (!prefs.enabled) return;

      // Build set of completed reminder IDs for today
      const completedIds = new Set<string>();
      if (todayLogs) {
        for (const log of todayLogs) {
          if (log.reminder_id) completedIds.add(log.reminder_id);
        }
      }

      // Create a fingerprint to avoid redundant re-schedules
      const fingerprint = JSON.stringify({
        ids: reminders.map((r) => r.id).sort(),
        completed: [...completedIds].sort(),
        prefs: prefs.enabled,
        time: prefs.dailySummaryTime,
      });

      if (fingerprint === lastScheduleRef.current) return;
      lastScheduleRef.current = fingerprint;

      const count = await scheduleAllNotifications(
        reminders,
        completedIds,
        prefs,
        user.id,
        language as 'de' | 'en',
      );

      if (count > 0) {
        console.log(`[FitBuddy] Scheduled ${count} notifications`);
      }
    };

    // Schedule immediately
    doSchedule();

    // Re-schedule periodically
    intervalRef.current = setInterval(doSchedule, RESCHEDULE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, reminders, todayLogs, language]);

  // ── Native Click Handler ──────────────────────────────────────────────

  useEffect(() => {
    const cleanup = onNotificationClick((route) => {
      navigate(route);
    });

    return () => {
      cleanup?.();
    };
  }, [navigate]);
}
