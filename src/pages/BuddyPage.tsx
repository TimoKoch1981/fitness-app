import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Send, Trash2, Wifi, WifiOff, Mic } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useBuddyChat } from '../features/buddy/hooks/useBuddyChat';
import { useActionExecutor } from '../features/buddy/hooks/useActionExecutor';
import { ChatMessageBubble } from '../features/buddy/components/ChatMessage';
import { useAuth } from '../app/providers/AuthProvider';
import { useProfile } from '../features/auth/hooks/useProfile';
import { useDailyMealTotals } from '../features/meals/hooks/useMeals';
import { useLatestBodyMeasurement } from '../features/body/hooks/useBodyMeasurements';
import { useSubstances } from '../features/medical/hooks/useSubstances';
import { useActivePlan } from '../features/workouts/hooks/useTrainingPlans';
import { useStandardProducts, useUserProducts } from '../features/meals/hooks/useProducts';
import { today } from '../lib/utils';
import { getActionDisplayInfo } from '../lib/ai/actions/types';
import type { HealthContext } from '../types/health';

export function BuddyPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gather health context for personalized AI responses
  const { data: profile } = useProfile();
  const { totals } = useDailyMealTotals(today());
  const { data: latestBody } = useLatestBodyMeasurement();
  const { data: activeSubstances } = useSubstances(true);
  const { data: activePlan } = useActivePlan();
  const { data: standardProducts } = useStandardProducts();
  const { data: userProducts } = useUserProducts();

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
    recentMeals: [],
    recentWorkouts: [],
    recentBloodPressure: [],
    recentSubstanceLogs: [],
    trainingGoals: [],
    latestBodyMeasurement: latestBody ?? undefined,
    activeSubstances: activeSubstances ?? [],
    activePlan: activePlan ?? undefined,
    userProducts: userProducts ?? [],
    standardProducts: standardProducts ?? [],
  };

  const {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    clearMessages,
    clearAction,
    addSystemMessage,
    checkConnection,
    providerName,
  } = useBuddyChat({ context: healthContext, language });

  // Action executor for auto-saving data — pass user.id to avoid auth race conditions
  const { executeAction } = useActionExecutor(user?.id);

  // Track which message IDs have already been auto-executed
  const executedActionsRef = useRef<Set<string>>(new Set());

  // Check AI connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle autoMessage from navigation (e.g., "Evaluate Day" button on MealsPage)
  const autoMessageSentRef = useRef(false);
  useEffect(() => {
    const state = location.state as { autoMessage?: string } | null;
    const autoMsg = state?.autoMessage;
    if (autoMsg && !isLoading && !autoMessageSentRef.current) {
      autoMessageSentRef.current = true;
      sendMessage(autoMsg);
      // Clear navigation state to prevent re-sending
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isLoading, sendMessage]);

  // Auto-execute: detect actions and save immediately without user confirmation
  // Supports MULTIPLE actions per message (e.g. 3 meals logged at once)
  useEffect(() => {
    const lastActionMsg = [...messages].reverse().find(m => m.pendingActions && m.pendingActions.length > 0);
    if (!lastActionMsg || executedActionsRef.current.has(lastActionMsg.id)) return;

    // Mark as handled immediately to prevent double-execution
    executedActionsRef.current.add(lastActionMsg.id);

    const actions = lastActionMsg.pendingActions!;

    // Execute ALL actions sequentially — pass each action directly to avoid state race
    setTimeout(async () => {
      const results: Array<{ action: typeof actions[0]; success: boolean; error?: string }> = [];

      for (const action of actions) {
        const result = await executeAction(action);
        results.push({ action, ...result });
      }

      clearAction(lastActionMsg.id);

      // Build combined status message
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);

      if (successes.length > 0) {
        const summaries = successes.map(r => {
          const display = getActionDisplayInfo(r.action);
          return `${display.icon} ${display.summary}`;
        });
        addSystemMessage(
          language === 'de'
            ? `✅ ${successes.length === 1 ? 'Gespeichert' : `${successes.length}x gespeichert`}:\n${summaries.join('\n')}`
            : `✅ ${successes.length === 1 ? 'Saved' : `${successes.length}x saved`}:\n${summaries.join('\n')}`,
          '✅',
        );
      }

      if (failures.length > 0) {
        const errorSummaries = failures.map(r => {
          const display = getActionDisplayInfo(r.action);
          // Map technical errors to user-friendly messages
          let friendlyError = r.error ?? '?';
          if (friendlyError.includes('Not authenticated') || friendlyError.includes('auth')) {
            friendlyError = language === 'de'
              ? 'Sitzung abgelaufen. Bitte neu einloggen.'
              : 'Session expired. Please log in again.';
          } else if (friendlyError.includes('row-level security') || friendlyError.includes('RLS') || friendlyError.includes('policy')) {
            friendlyError = language === 'de'
              ? 'Zugriffsfehler. Bitte neu einloggen.'
              : 'Access denied. Please log in again.';
          }
          return `${display.icon} ${display.summary}: ${friendlyError}`;
        });
        addSystemMessage(
          language === 'de'
            ? `❌ ${failures.length} Fehler:\n${errorSummaries.join('\n')}`
            : `❌ ${failures.length} error(s):\n${errorSummaries.join('\n')}`,
          '❌',
        );
      }
    }, 0);
  }, [messages, executeAction, clearAction, addSystemMessage, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t.buddy.title}</h1>
              <div className="flex items-center gap-1">
                {isConnected === true ? (
                  <Wifi className="h-2.5 w-2.5 text-green-500" />
                ) : isConnected === false ? (
                  <WifiOff className="h-2.5 w-2.5 text-red-500" />
                ) : null}
                <span className="text-[9px] text-gray-400">{providerName}</span>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={t.buddy.clearChat}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-36">
        {/* Greeting */}
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
            <span className="text-xs text-white font-bold">FB</span>
          </div>
          <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm max-w-[85%]">
            <p className="text-sm text-gray-700 leading-relaxed">
              {t.buddy.greeting}
            </p>
          </div>
        </div>

        {/* Connection Warning */}
        {isConnected === false && (
          <div className="bg-yellow-50 rounded-xl p-3 mb-4 text-center">
            <WifiOff className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-xs text-yellow-700">{t.buddy.connectionError}</p>
            <button
              onClick={checkConnection}
              className="mt-2 text-xs text-teal-600 hover:underline font-medium"
            >
              {language === 'de' ? 'Erneut versuchen' : 'Retry'}
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}

        {/* Help hint when no messages */}
        {messages.length === 0 && isConnected !== false && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-xs">{t.buddy.helpHint}</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-14 left-0 right-0 bg-white border-t border-gray-200 p-3">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.buddy.placeholder}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-colors"
            disabled={isLoading}
          />
          {/* Microphone Button — placeholder for future voice input */}
          <button
            type="button"
            onClick={() => alert(language === 'de' ? 'Spracheingabe wird in einer künftigen Version verfügbar.' : 'Voice input will be available in a future version.')}
            className="p-2.5 text-gray-300 hover:text-gray-400 rounded-full transition-colors"
            title={t.buddy.voiceInput}
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-600 hover:to-emerald-700 transition-all flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {t.buddy.send}
          </button>
        </form>
      </div>
    </div>
  );
}
