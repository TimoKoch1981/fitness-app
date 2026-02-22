/**
 * Reminders Hooks — CRUD, toggle, complete, and today-status for reminders.
 *
 * Follows the useSubstances pattern: TanStack Query + Supabase mutations.
 * Reminder completion is tracked via the `reminder_logs` table.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { Reminder, ReminderLog, ReminderType, RepeatMode, TimePeriod } from '../../../types/health';

const REMINDERS_KEY = 'reminders';
const REMINDER_LOGS_KEY = 'reminder_logs';

// ── Queries ─────────────────────────────────────────────────────────────

/** Fetch all reminders, optionally filtered to active-only. */
export function useReminders(activeOnly = true) {
  return useQuery({
    queryKey: [REMINDERS_KEY, activeOnly],
    queryFn: async (): Promise<Reminder[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase.from('reminders').select('*').eq('user_id', user.id).order('time', { ascending: true });
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetch today's reminder completion logs. */
export function useTodayReminderLogs() {
  const todayStr = today();

  return useQuery({
    queryKey: [REMINDER_LOGS_KEY, todayStr],
    queryFn: async (): Promise<ReminderLog[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // completed_at is TIMESTAMPTZ — filter by date portion
      const startOfDay = `${todayStr}T00:00:00`;
      const endOfDay = `${todayStr}T23:59:59`;

      const { data, error } = await supabase
        .from('reminder_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', startOfDay)
        .lte('completed_at', endOfDay);

      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Derived: Today's Reminder Status ────────────────────────────────────

/** Check if a reminder is relevant today based on its schedule. */
function isReminderDueToday(reminder: Reminder): boolean {
  if (!reminder.is_active) return false;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat

  if (reminder.repeat_mode === 'weekly') {
    return reminder.days_of_week.includes(dayOfWeek);
  }

  if (reminder.repeat_mode === 'interval' && reminder.interval_days) {
    const created = new Date(reminder.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays % reminder.interval_days === 0;
  }

  // Fallback: show every day
  return true;
}

/**
 * Compute today's pending and completed reminders.
 * Call this with results from useReminders + useTodayReminderLogs.
 */
export function getTodayReminderStatus(
  reminders: Reminder[],
  todayLogs: ReminderLog[],
) {
  const completedIds = new Set(todayLogs.map(log => log.reminder_id));
  const dueToday = reminders.filter(isReminderDueToday);

  return {
    pending: dueToday.filter(r => !completedIds.has(r.id)),
    completed: dueToday.filter(r => completedIds.has(r.id)),
    totalDue: dueToday.length,
  };
}

// ── Mutations ───────────────────────────────────────────────────────────

interface AddReminderInput {
  type: ReminderType;
  title: string;
  description?: string;
  time?: string;
  days_of_week?: number[];
  substance_id?: string;
  repeat_mode?: RepeatMode;
  interval_days?: number;
  time_period?: TimePeriod;
}

export function useAddReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddReminderInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: user.id,
          type: input.type,
          title: input.title,
          description: input.description,
          time: input.time,
          days_of_week: input.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
          substance_id: input.substance_id,
          repeat_mode: input.repeat_mode ?? 'weekly',
          interval_days: input.interval_days,
          time_period: input.time_period,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REMINDERS_KEY] });
    },
  });
}

interface UpdateReminderInput {
  id: string;
  title?: string;
  description?: string;
  type?: ReminderType;
  time?: string | null;
  time_period?: TimePeriod | null;
  days_of_week?: number[];
  repeat_mode?: RepeatMode;
  interval_days?: number | null;
  substance_id?: string | null;
  is_active?: boolean;
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }: UpdateReminderInput) => {
      // Build update payload, converting null to explicit null for clearable fields
      const payload: Record<string, unknown> = {};
      if (fields.title !== undefined) payload.title = fields.title;
      if (fields.description !== undefined) payload.description = fields.description;
      if (fields.type !== undefined) payload.type = fields.type;
      if (fields.time !== undefined) payload.time = fields.time;
      if (fields.time_period !== undefined) payload.time_period = fields.time_period;
      if (fields.days_of_week !== undefined) payload.days_of_week = fields.days_of_week;
      if (fields.repeat_mode !== undefined) payload.repeat_mode = fields.repeat_mode;
      if (fields.interval_days !== undefined) payload.interval_days = fields.interval_days;
      if (fields.substance_id !== undefined) payload.substance_id = fields.substance_id;
      if (fields.is_active !== undefined) payload.is_active = fields.is_active;

      const { data, error } = await supabase
        .from('reminders')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REMINDERS_KEY] });
    },
  });
}

export function useToggleReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('reminders')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REMINDERS_KEY] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REMINDERS_KEY] });
    },
  });
}

/** Mark a reminder as completed for today. */
export function useCompleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminderId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reminder_logs')
        .insert({
          user_id: user.id,
          reminder_id: reminderId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ReminderLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REMINDER_LOGS_KEY] });
    },
  });
}
