/**
 * ProactiveWarningCard — Shows proactive health warnings on the Cockpit.
 *
 * Displays alerts from the deviations engine (overtraining, blood work,
 * check-in based concerns) as dismissable cards on the dashboard.
 * Each warning links to the relevant agent via InlineBuddyChat.
 *
 * Uses the same analyzeDeviations() engine that powers the agent system prompts,
 * ensuring consistent messaging between dashboard and AI buddy.
 */

import { useState } from 'react';
import { AlertTriangle, X, MessageCircle, Activity, Heart, Dumbbell } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useProfile } from '../../features/auth/hooks/useProfile';
import { useLatestBodyMeasurement } from '../../features/body/hooks/useBodyMeasurements';
import { useDailyMealTotals } from '../../features/meals/hooks/useMeals';
import { useSubstances } from '../../features/medical/hooks/useSubstances';
import { useActivePlan } from '../../features/workouts/hooks/useTrainingPlans';
import { useLatestBloodWork } from '../../features/medical/hooks/useBloodWork';
import { useRecentWorkouts } from '../../features/workouts/hooks/useWorkouts';
import { useTodayCheckin } from '../../features/checkin/hooks/useDailyCheckin';
import { useBloodPressureLogs } from '../../features/medical/hooks/useBloodPressure';
import { useSleepLogs } from '../../features/sleep/hooks/useSleep';
import { analyzeDeviations, type Deviation } from '../../lib/ai/deviations';
import { useInlineBuddyChat } from './InlineBuddyChatContext';
import { today } from '../../lib/utils';
import type { HealthContext } from '../../types/health';

/** Map agent types to icons */
function getDeviationIcon(d: Deviation) {
  if (d.agent === 'training') return <Dumbbell className="h-3.5 w-3.5" />;
  if (d.agent === 'medical') return <Heart className="h-3.5 w-3.5" />;
  if (d.agent === 'nutrition') return <Activity className="h-3.5 w-3.5" />;
  return <AlertTriangle className="h-3.5 w-3.5" />;
}

/** Map deviation type + agent to a buddy chat message */
function getDeviationChatMessage(d: Deviation, lang: 'de' | 'en'): string {
  const msgLower = d.message.toLowerCase();
  const de = lang === 'de';

  if (msgLower.includes('krank')) {
    return de ? 'Ich bin krank. Was soll ich beachten?' : "I'm sick. What should I keep in mind?";
  }
  if (msgLower.includes('uebertraining')) {
    return de ? 'Ich trainiere viel. Bin ich im Übertraining?' : "I've been training a lot. Am I overtraining?";
  }
  if (msgLower.includes('hdl')) {
    return de ? 'Mein HDL ist niedrig. Was kann ich tun?' : 'My HDL is low. What can I do?';
  }
  if (msgLower.includes('haematokrit')) {
    return de ? 'Mein Hämatokrit ist erhöht. Was bedeutet das?' : 'My hematocrit is elevated. What does it mean?';
  }
  if (msgLower.includes('alt') && msgLower.includes('leber')) {
    return de ? 'Mein ALT-Leberwert ist erhöht. Was soll ich tun?' : 'My ALT liver value is elevated. What should I do?';
  }
  if (msgLower.includes('blutdruck')) {
    return de ? 'Mein Blutdruck war hoch. Was bedeutet das?' : 'My blood pressure was high. What does that mean?';
  }
  if (msgLower.includes('protein')) {
    return de ? 'Wie kann ich heute noch mein Protein erreichen?' : 'How can I still hit my protein target today?';
  }
  if (msgLower.includes('schmerz')) {
    return de ? 'Ich habe Schmerzen gemeldet. Was soll ich beim Training beachten?' : 'I reported pain. What should I consider during training?';
  }
  // Fallback
  return de ? d.message : d.messageEN;
}

export function ProactiveWarningCard() {
  const { language } = useTranslation();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { openBuddyChat } = useInlineBuddyChat();

  // Gather health context
  const { data: profile } = useProfile();
  const { data: latestBody } = useLatestBodyMeasurement();
  const { totals } = useDailyMealTotals(today());
  const { data: activeSubstances } = useSubstances(true);
  const { data: activePlan } = useActivePlan();
  const { data: latestBloodWork } = useLatestBloodWork();
  const { data: recentWorkouts } = useRecentWorkouts(14);
  const { data: dailyCheckin } = useTodayCheckin();
  const { data: bpLogs } = useBloodPressureLogs(5);
  const { data: sleepLogs } = useSleepLogs(7);

  const healthContext: Partial<HealthContext> = {
    profile: profile ?? undefined,
    dailyStats: {
      calories: totals.calories,
      caloriesGoal: profile?.daily_calories_goal ?? 2000,
      protein: totals.protein,
      proteinGoal: profile?.daily_protein_goal ?? 150,
      carbs: totals.carbs,
      fat: totals.fat,
      water: 0,
      waterGoal: profile?.daily_water_goal ?? 8,
    },
    recentWorkouts: recentWorkouts ?? [],
    recentBloodPressure: bpLogs ?? [],
    activeSubstances: activeSubstances ?? [],
    activePlan: activePlan ?? undefined,
    latestBodyMeasurement: latestBody ?? undefined,
    latestBloodWork: latestBloodWork ?? undefined,
    recentSleepLogs: sleepLogs ?? [],
    dailyCheckin: dailyCheckin ?? undefined,
  };

  // Analyze deviations
  const deviations = analyzeDeviations(healthContext, dailyCheckin);

  // Filter: only show warning/info types on the cockpit (not "suggestion" type, those are for chips)
  // Also limit to high-priority items (priority <= 3) and max 3 displayed
  const visibleDeviations = deviations
    .filter(d => (d.type === 'warning' || d.type === 'info') && d.priority <= 3)
    .filter(d => !dismissedIds.has(`${d.agent}_${d.message.slice(0, 30)}`))
    .slice(0, 3);

  if (visibleDeviations.length === 0) return null;

  const de = language === 'de';
  const lang = language as 'de' | 'en';

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
        {de ? 'Proaktive Hinweise' : 'Proactive Alerts'}
      </p>
      {visibleDeviations.map((d, i) => {
        const id = `${d.agent}_${d.message.slice(0, 30)}`;
        const isWarning = d.type === 'warning';
        const msg = de ? d.message : d.messageEN;

        return (
          <div
            key={id + i}
            className={`rounded-xl border p-3 ${
              isWarning
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                isWarning ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {getDeviationIcon(d)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] leading-relaxed ${
                  isWarning ? 'text-amber-700' : 'text-blue-700'
                }`}>
                  {d.icon} {msg}
                </p>
                <button
                  onClick={() => {
                    const chatMsg = getDeviationChatMessage(d, lang);
                    openBuddyChat(chatMsg, d.agent as 'training' | 'nutrition' | 'medical' | 'general');
                  }}
                  className={`mt-1.5 flex items-center gap-1 text-[10px] font-medium ${
                    isWarning
                      ? 'text-amber-600 hover:text-amber-800'
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  <MessageCircle className="h-3 w-3" />
                  {de ? 'Buddy fragen' : 'Ask buddy'}
                </button>
              </div>
              <button
                onClick={() => setDismissedIds(prev => new Set(prev).add(id))}
                className={`p-1 flex-shrink-0 ${
                  isWarning ? 'text-amber-300 hover:text-amber-500' : 'text-blue-300 hover:text-blue-500'
                }`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
