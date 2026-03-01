/**
 * InlineBuddyChat — Bottom-sheet chat overlay that renders above any page.
 *
 * Opens via the InlineBuddyChatContext when a BuddyQuickAccess chip is tapped.
 * The user stays on the current page while chatting with the buddy.
 *
 * Uses the same useBuddyChat hook + BuddyChatProvider as BuddyPage,
 * so messages and actions are fully shared and persistent.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, Trash2, Wifi, WifiOff, Mic, MicOff } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useInlineBuddyChat } from './InlineBuddyChatContext';
import { useBuddyChat } from '../../features/buddy/hooks/useBuddyChat';
import { useActionExecutor } from '../../features/buddy/hooks/useActionExecutor';
import { useVoiceInput } from '../../features/buddy/hooks/useVoiceInput';
import { ChatMessageBubble } from '../../features/buddy/components/ChatMessage';
import { AgentThreadTabs } from '../../features/buddy/components/AgentThreadTabs';
import { getAgentDisplayConfig } from '../../lib/ai/agents/agentDisplayConfig';
import { useAuth } from '../../app/providers/AuthProvider';
import { useProfile } from '../../features/auth/hooks/useProfile';
import { useOnboarding } from '../../features/buddy/hooks/useOnboarding';
import { useDailyMealTotals } from '../../features/meals/hooks/useMeals';
import { useLatestBodyMeasurement } from '../../features/body/hooks/useBodyMeasurements';
import { useSubstances } from '../../features/medical/hooks/useSubstances';
import { useActivePlan } from '../../features/workouts/hooks/useTrainingPlans';
import { useStandardProducts, useUserProducts } from '../../features/meals/hooks/useProducts';
import { useUserEquipmentResolved } from '../../features/equipment/hooks/useEquipment';
import { useTodayCheckin } from '../../features/checkin/hooks/useDailyCheckin';
import { today } from '../../lib/utils';
import { getActionDisplayInfo } from '../../lib/ai/actions/types';
import type { HealthContext } from '../../types/health';

// ---------------------------------------------------------------------------
// Outer Component: Always mounted, handles animation
// ---------------------------------------------------------------------------

export function InlineBuddyChat() {
  const { isOpen, closeBuddyChat } = useInlineBuddyChat();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="inline-chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeBuddyChat}
            className="fixed inset-0 bg-black/30"
            style={{ zIndex: 55 }}
            aria-hidden="true"
          />
          {/* Bottom Sheet */}
          <motion.div
            key="inline-chat-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Buddy Chat"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col"
            style={{ bottom: 56, maxHeight: '70vh', zIndex: 56 }}
          >
            <InlineBuddyChatContent />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Inner Component: Only mounted when open, contains all hooks
// ---------------------------------------------------------------------------

function InlineBuddyChatContent() {
  const { t, language, buddyVerbosity, buddyExpertise } = useTranslation();
  const { user } = useAuth();
  const { autoMessage, targetAgent, closeBuddyChat, clearAutoMessage } = useInlineBuddyChat();

  const [input, setInput] = useState('');
  const [voiceHint, setVoiceHint] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoMessageSentRef = useRef(false);

  // ── Health Context ──────────────────────────────────────────────────────
  const { data: profile } = useProfile();
  const { data: latestBody } = useLatestBodyMeasurement();
  const { needsOnboarding } = useOnboarding(profile, latestBody);
  const { totals } = useDailyMealTotals(today());
  const { data: activeSubstances } = useSubstances(true);
  const { data: activePlan } = useActivePlan();
  const { data: standardProducts } = useStandardProducts();
  const { data: userProducts } = useUserProducts();
  const { equipment: availableEquipment } = useUserEquipmentResolved();
  const { data: dailyCheckin } = useTodayCheckin();

  const healthContext: Partial<HealthContext> = {
    profile: profile ?? undefined,
    onboardingMode: needsOnboarding,
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
    availableEquipment: availableEquipment ?? [],
    dailyCheckin: dailyCheckin ?? undefined,
  };

  // ── Chat Hook ───────────────────────────────────────────────────────────
  const {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    clearMessages,
    clearAction,
    addSystemMessage,
    checkConnection,
    activeThread,
    setActiveThread,
    threads,
  } = useBuddyChat({ context: healthContext, language, communicationStyle: { verbosity: buddyVerbosity, expertise: buddyExpertise } });

  // Active agent display config (icon, color, greeting)
  const agentConfig = useMemo(() => getAgentDisplayConfig(activeThread), [activeThread]);

  // Switch to target agent when inline chat opens with a specific agent
  const targetAgentAppliedRef = useRef(false);
  useEffect(() => {
    if (targetAgent && !targetAgentAppliedRef.current) {
      targetAgentAppliedRef.current = true;
      setActiveThread(targetAgent);
    }
  }, [targetAgent, setActiveThread]);

  // ── Action Executor ─────────────────────────────────────────────────────
  const { executeAction } = useActionExecutor(user?.id);
  const executedActionsRef = useRef<Set<string>>(new Set());

  // ── Voice Input ─────────────────────────────────────────────────────────
  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
  }, []);

  const handleVoiceError = useCallback((err: 'not-supported' | 'not-allowed' | 'no-speech' | 'network' | 'unknown') => {
    if (err === 'not-supported') {
      setVoiceHint(t.buddy.voiceNotSupported);
    } else if (err === 'not-allowed') {
      setVoiceHint(t.buddy.voiceError);
    } else if (err === 'network') {
      setVoiceHint(language === 'de' ? 'Netzwerkfehler bei der Spracherkennung.' : 'Network error during speech recognition.');
    }
    setTimeout(() => setVoiceHint(''), 5000);
  }, [t, language]);

  // Ref for sendMessage (voice auto-send needs stable reference)
  const sendMessageRef = useRef<((msg: string) => Promise<void>) | undefined>(undefined);
  sendMessageRef.current = sendMessage;

  const handleVoiceAutoSend = useCallback((text: string) => {
    setInput('');
    sendMessageRef.current?.(text);
  }, []);

  const {
    isSupported: voiceSupported,
    isListening,
    toggleListening,
  } = useVoiceInput({
    language: language as 'de' | 'en',
    onTranscript: handleVoiceTranscript,
    onError: handleVoiceError,
    silenceTimeout: 8000,
    autoSend: true,
    onAutoSend: handleVoiceAutoSend,
  });

  // ── Effects ─────────────────────────────────────────────────────────────

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Auto-scroll to bottom on new messages + re-focus input after AI response
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  // Handle autoMessage: send once when sheet opens with a message
  useEffect(() => {
    if (autoMessage && !isLoading && !autoMessageSentRef.current) {
      autoMessageSentRef.current = true;
      sendMessage(autoMessage);
      clearAutoMessage();
    }
  }, [autoMessage, isLoading, sendMessage, clearAutoMessage]);

  // Auto-execute pending actions (same logic as BuddyPage)
  useEffect(() => {
    const lastActionMsg = [...messages].reverse().find(m => m.pendingActions && m.pendingActions.length > 0);
    if (!lastActionMsg || executedActionsRef.current.has(lastActionMsg.id)) return;

    executedActionsRef.current.add(lastActionMsg.id);
    const actions = lastActionMsg.pendingActions!;

    setTimeout(async () => {
      const results: Array<{ action: typeof actions[0]; success: boolean; error?: string }> = [];

      for (const action of actions) {
        const result = await executeAction(action);
        results.push({ action, ...result });
      }

      clearAction(lastActionMsg.id);

      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);

      if (successes.length > 0) {
        const summaries = successes.map(r => {
          const display = getActionDisplayInfo(r.action);
          return `${display.icon} ${display.summary}`;
        });
        addSystemMessage(
          language === 'de'
            ? `\u2705 ${successes.length === 1 ? 'Gespeichert' : `${successes.length}x gespeichert`}:\n${summaries.join('\n')}`
            : `\u2705 ${successes.length === 1 ? 'Saved' : `${successes.length}x saved`}:\n${summaries.join('\n')}`,
          '\u2705',
        );
      }

      if (failures.length > 0) {
        const errorSummaries = failures.map(r => {
          const display = getActionDisplayInfo(r.action);
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
            ? `\u274c ${failures.length} Fehler:\n${errorSummaries.join('\n')}`
            : `\u274c ${failures.length} error(s):\n${errorSummaries.join('\n')}`,
          '\u274c',
        );
      }
    }, 0);
  }, [messages, executeAction, clearAction, addSystemMessage, language]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput('');
    await sendMessage(message);
    inputRef.current?.focus();
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Drag Handle */}
      <div className="flex justify-center py-2">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 bg-gradient-to-br ${agentConfig.color} rounded-full flex items-center justify-center`}>
            <span className="text-xs">{agentConfig.icon}</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {language === 'de' ? agentConfig.shortName : agentConfig.shortNameEN}
          </span>
          {isConnected === true ? (
            <Wifi className="h-2.5 w-2.5 text-green-500" />
          ) : isConnected === false ? (
            <WifiOff className="h-2.5 w-2.5 text-red-500" />
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              title={t.buddy.clearChat}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={closeBuddyChat}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title={t.buddyAccess.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Agent Thread Tabs (compact) */}
      <AgentThreadTabs
        activeThread={activeThread}
        onSelectThread={setActiveThread}
        threads={threads}
        compact
      />

      {/* Chat Messages — scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        {/* Per-Thread Greeting */}
        <div className="flex gap-2 mb-3">
          <div className={`w-7 h-7 bg-gradient-to-br ${agentConfig.color} rounded-full flex-shrink-0 flex items-center justify-center mt-0.5`}>
            <span className="text-xs">{agentConfig.icon}</span>
          </div>
          <div className="bg-gray-50 rounded-2xl rounded-tl-md p-3 shadow-sm max-w-[85%]">
            <p className="text-xs text-gray-700 leading-relaxed">
              {needsOnboarding
                ? t.buddy.onboardingGreeting
                : language === 'de' ? agentConfig.greeting : agentConfig.greetingEN}
            </p>
          </div>
        </div>

        {/* Connection Warning */}
        {isConnected === false && (
          <div className="bg-yellow-50 rounded-xl p-2 mb-3 text-center">
            <WifiOff className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
            <p className="text-[10px] text-yellow-700">{t.buddy.connectionError}</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} avatarUrl={profile?.avatar_url} />
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* Voice Hint */}
      {(voiceHint || isListening) && (
        <div className="px-4 pb-1">
          <div className={`text-center text-[10px] py-1 px-2 rounded-full ${
            voiceHint
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {voiceHint || t.buddy.voiceHint}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="border-t border-gray-100 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.buddy.placeholder}
            className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-colors"
            disabled={isLoading}
            autoFocus
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`relative p-2 rounded-full transition-all ${
                isListening
                  ? 'text-red-500 bg-red-50 ring-2 ring-red-400 ring-opacity-75 animate-pulse'
                  : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
              }`}
              title={isListening ? t.buddy.voiceListening : t.buddy.voiceInput}
              disabled={isLoading}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-600 hover:to-emerald-700 transition-all flex items-center gap-1"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </>
  );
}
