/**
 * GDPR Art. 20 — Data Portability Export Hook
 *
 * Fetches ALL user data from all tables and generates a downloadable JSON file.
 * Uses direct Supabase queries (not existing hooks) to get COMPLETE data without pagination limits.
 *
 * Tables exported:
 * - profiles, meals, workouts, body_measurements, blood_pressure_logs
 * - substances, substance_logs, blood_work, training_goals, reminders
 * - reminder_logs, training_plans + training_plan_days, daily_checkins
 * - user_products, user_equipment, feedback, feature_requests, feature_votes
 */

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';

interface ExportProgress {
  current: number;
  total: number;
  currentTable: string;
}

interface ExportResult {
  success: boolean;
  error?: string;
  filename?: string;
}

export function useDataExport() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const exportData = async (): Promise<ExportResult> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setIsExporting(true);
    setProgress({ current: 0, total: 16, currentTable: 'profiles' });

    try {
      const tables = [
        { name: 'profiles', key: 'profile', single: true },
        { name: 'meals', key: 'meals' },
        { name: 'workouts', key: 'workouts' },
        { name: 'body_measurements', key: 'body_measurements' },
        { name: 'blood_pressure_logs', key: 'blood_pressure_logs' },
        { name: 'substances', key: 'substances' },
        { name: 'substance_logs', key: 'substance_logs' },
        { name: 'blood_work', key: 'blood_work' },
        { name: 'training_goals', key: 'training_goals' },
        { name: 'reminders', key: 'reminders' },
        { name: 'reminder_logs', key: 'reminder_logs' },
        { name: 'training_plans', key: 'training_plans' },
        { name: 'daily_checkins', key: 'daily_checkins' },
        { name: 'user_products', key: 'user_products' },
        { name: 'feedback', key: 'feedback' },
        { name: 'feature_requests', key: 'feature_requests' },
      ] as const;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exportedData: Record<string, any> = {};

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        setProgress({ current: i + 1, total: tables.length, currentTable: table.name });

        if ('single' in table && table.single) {
          // Single row (profiles)
          const { data, error } = await supabase
            .from(table.name)
            .select('*')
            .eq('id', user.id)
            .single();
          if (error && error.code !== 'PGRST116') {
            console.warn(`Export: ${table.name} error:`, error.message);
          }
          exportedData[table.key] = data ?? null;
        } else {
          // Multiple rows — RLS ensures only user's data
          const { data, error } = await supabase
            .from(table.name)
            .select('*')
            .order('created_at', { ascending: false });
          if (error) {
            console.warn(`Export: ${table.name} error:`, error.message);
            exportedData[table.key] = [];
          } else {
            exportedData[table.key] = data ?? [];
          }
        }
      }

      // Training plan days (joined through training_plans)
      if (exportedData.training_plans?.length > 0) {
        const planIds = exportedData.training_plans.map((p: { id: string }) => p.id);
        const { data: days } = await supabase
          .from('training_plan_days')
          .select('*')
          .in('plan_id', planIds)
          .order('day_number', { ascending: true });
        exportedData.training_plan_days = days ?? [];
      } else {
        exportedData.training_plan_days = [];
      }

      // Feature votes
      const { data: votes } = await supabase
        .from('feature_votes')
        .select('*')
        .order('created_at', { ascending: false });
      exportedData.feature_votes = votes ?? [];

      // Build export object
      const exportJson = {
        export_metadata: {
          exported_at: new Date().toISOString(),
          user_id: user.id,
          user_email: user.email ?? 'unknown',
          export_version: '1.0',
          dsgvo_article: 'Art. 20 DSGVO — Recht auf Datenübertragbarkeit',
          app: 'FitBuddy',
          tables_exported: Object.keys(exportedData).length,
        },
        ...exportedData,
      };

      // Generate and download file
      const jsonString = JSON.stringify(exportJson, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `fitbuddy-export-${timestamp}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setProgress(null);
      return { success: true, filename };
    } catch (err) {
      setIsExporting(false);
      setProgress(null);
      const message = err instanceof Error ? err.message : 'Export failed';
      return { success: false, error: message };
    }
  };

  return { exportData, isExporting, progress };
}
