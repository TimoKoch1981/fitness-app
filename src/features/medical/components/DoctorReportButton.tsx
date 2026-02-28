/**
 * DoctorReportButton — Button that generates a PDF medical report for doctor visits.
 * Visible in Power+ mode when showDoctorReport is true.
 * Collects profile, blood work, blood pressure, substances, and body data.
 */

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useProfile } from '../../auth/hooks/useProfile';
import { useLatestBloodWork } from '../hooks/useBloodWork';
import { useBloodPressureLogs } from '../hooks/useBloodPressure';
import { generateDoctorReport } from '../utils/generateDoctorReport';
import type { Substance, BodyMeasurement } from '../../../types/health';
import { supabase } from '../../../lib/supabase';

export function DoctorReportButton() {
  const { t, language } = useTranslation();
  const { data: profile } = useProfile();
  const { data: latestBloodWork } = useLatestBloodWork();
  const { data: recentBP } = useBloodPressureLogs(10);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!profile) return;
    setIsGenerating(true);

    try {
      // Fetch active substances
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: substances } = await supabase
        .from('substances')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      // Fetch latest body measurement
      const { data: bodyData } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1);

      generateDoctorReport({
        profile,
        latestBloodWork: latestBloodWork ?? null,
        recentBP: recentBP ?? [],
        activeSubstances: (substances as Substance[]) ?? [],
        latestBody: bodyData?.[0] as BodyMeasurement | undefined ?? null,
        language: language as 'de' | 'en',
      });
    } catch (err) {
      console.error('Doctor report generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating || !profile}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {t.powerPlus.doctorReport ?? (language === 'de' ? 'Arztbericht PDF' : 'Doctor Report PDF')}
    </button>
  );
}
